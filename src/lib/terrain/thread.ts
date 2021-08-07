const _NUM_WORKERS = 7;

let _IDs = 0;

class WorkerThread {
  _worker: Worker;
  _resolve: ((data: any) => void) | null;
  _id: number;

  constructor(s: Worker) {
    this._worker = s;
    this._worker.onmessage = (e) => {
      this.onMessage(e);
    };
    this._resolve = null;
    this._id = _IDs++;
  }

  onMessage(e: MessageEvent<any>) {
    const resolve = this._resolve;
    this._resolve = null;
    resolve?.(e.data);
  }

  get id() {
    return this._id;
  }

  postMessage(s: any, resolve: null) {
    this._resolve = resolve;
    this._worker.postMessage(s);
  }
}

interface WorkItem {}

class WorkerThreadPool {
  _workers: WorkerThread[];
  _free: any[];
  _busy: { [id: number]: boolean };
  _queue: [WorkItem, (data: any) => void][];
  constructor(size: number, worker: () => Worker) {
    this._workers = [...Array(size)].map((_) => new WorkerThread(worker()));
    this._free = [...this._workers];
    this._busy = {};
    this._queue = [];
  }

  get length() {
    return this._workers.length;
  }

  get busy() {
    return this._queue.length > 0 || Object.keys(this._busy).length > 0;
  }

  enqueue(workItem: WorkItem, resolve: any) {
    this._queue.push([workItem, resolve]);
    this.pumpQueue();
  }

  pumpQueue() {
    while (this._free.length > 0 && this._queue.length > 0) {
      const w = this._free.pop();
      this._busy[w.id] = w;

      const [workItem, workResolve] = this._queue.shift()!;

      w.postMessage(workItem, (v: any) => {
        delete this._busy[w.id];
        this._free.push(w);
        workResolve(v);
        this.pumpQueue();
      });
    }
  }
}

class _TerrainChunkRebuilder_Threaded {
  _pool: {};
  _old: never[];
  _workerPool: WorkerThreadPool;
  _params: any;
  constructor(params) {
    this._pool = {};
    this._old = [];

    this._workerPool = new WorkerThreadPool(
      _NUM_WORKERS,
      () => new Worker("./worker.ts", { type: "module" })
    );

    this._params = params;
  }

  _OnResult(chunk, msg) {
    if (msg.subject == "build_chunk_result") {
      chunk.RebuildMeshFromData(msg.data);
      chunk.Show();
    }
  }

  AllocateChunk(params) {
    const w = params.width;

    if (!(w in this._pool)) {
      this._pool[w] = [];
    }

    let c = null;
    if (this._pool[w].length > 0) {
      c = this._pool[w].pop();
      c._params = params;
    } else {
      c = new TerrainChunk(params);
    }

    c.Hide();

    const threadedParams = {
      noiseParams: params.noiseParams,
      colourNoiseParams: params.colourNoiseParams,
      biomesParams: params.biomesParams,
      colourGeneratorParams: params.colourGeneratorParams,
      heightGeneratorsParams: params.heightGeneratorsParams,
      width: params.width,
      offset: [params.offset.x, params.offset.y, params.offset.z],
      radius: params.radius,
      resolution: params.resolution,
      worldMatrix: params.group.matrix,
    };

    const msg = {
      subject: "build_chunk",
      params: threadedParams,
    };

    this._workerPool.Enqueue(msg, (m) => {
      this._OnResult(c, m);
    });

    return c;
  }

  RetireChunks(chunks) {
    this._old.push(...chunks);
  }

  _RecycleChunks(chunks) {
    for (let c of chunks) {
      if (!(c.chunk._params.width in this._pool)) {
        this._pool[c.chunk._params.width] = [];
      }

      c.chunk.Destroy();
    }
  }

  get Busy() {
    return this._workerPool.Busy;
  }

  Rebuild(chunks) {
    for (let k in chunks) {
      this._workerPool.enqueue(chunks[k].chunk._params);
    }
  }

  Update() {
    if (!this.Busy) {
      this._RecycleChunks(this._old);
      this._old = [];
    }
  }
}
