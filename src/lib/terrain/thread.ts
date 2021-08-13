import { TerrainChunk, TerrainChunkParams } from "./TerrainChunk";
import { PositionedTerrainChunk } from "./TerrainChunkManager";

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

interface WorkItem { }

class WorkerThreadPool {
  workers: WorkerThread[];
  free: any[];
  _busy: { [id: number]: boolean };
  queue: [WorkItem, (data: any) => void][];
  constructor(size: number, worker: () => Worker) {
    this.workers = [...Array(size)].map((_) => new WorkerThread(worker()));
    this.free = [...this.workers];
    this._busy = {};
    this.queue = [];
  }

  get length() {
    return this.workers.length;
  }

  get busy() {
    return this.queue.length > 0 || Object.keys(this._busy).length > 0;
  }

  enqueue(workItem: WorkItem, resolve: any) {
    this.queue.push([workItem, resolve]);
    this.pumpQueue();
  }

  pumpQueue() {
    while (this.free.length > 0 && this.queue.length > 0) {
      const w = this.free.pop();
      this._busy[w.id] = w;

      const [workItem, workResolve] = this.queue.shift()!;

      w.postMessage(workItem, (v: any) => {
        delete this._busy[w.id];
        this.free.push(w);
        workResolve(v);
        this.pumpQueue();
      });
    }
  }
}

export class TerrainChunkRebuilder_Threaded {
  chunkPool: Record<string, TerrainChunk[]>;
  oldChunks: PositionedTerrainChunk[];
  workerPool: WorkerThreadPool;
  constructor() {
    this.chunkPool = {};
    this.oldChunks = [];

    this.workerPool = new WorkerThreadPool(
      _NUM_WORKERS,
      () => new Worker("./worker.ts", { type: "module" })
    );
  }

  handleResult(chunk: TerrainChunk, msg: { subject: string; data: any; }) {
    if (msg.subject == "build_chunk_result") {
      chunk.rebuildMeshFromData(msg.data);
      chunk.show();
    }
  }

  allocateChunk(params: TerrainChunkParams) {
    const w = params.width;

    if (!(w in this.chunkPool)) {
      this.chunkPool[w] = [];
    }

    let c: TerrainChunk | null = null;
    if (this.chunkPool[w].length > 0) {
      c = this.chunkPool[w].pop()!;
      c.params = params;
    } else {
      c = new TerrainChunk(params);
    }

    c.hide();

    const threadedParams = {
      heightNoiseParams: params.heightNoiseParams,
      colourNoiseParams: params.colorNoiseParams,
      biomesParams: params.biomeNoiseParams,
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

    this.workerPool.enqueue(msg, (m: any) => {
      this.handleResult(c!, m);
    });

    return c;
  }

  retireChunks(chunks: PositionedTerrainChunk[]) {
    this.oldChunks.push(...chunks);
  }

  recycleChunks(chunks: PositionedTerrainChunk[]) {
    for (let c of chunks) {
      if (!(c.chunk.params.width in this.chunkPool)) {
        this.chunkPool[c.chunk.params.width] = [];
      }

      c.chunk.destroy();
    }
  }

  get busy() {
    return this.workerPool.busy;
  }

  Rebuild(chunks: { [x: string]: TerrainChunk; }) {
    for (let k in chunks) {
      this.workerPool.enqueue(chunks[k].params, console.log);
    }
  }

  update() {
    if (!this.busy) {
      this.recycleChunks(this.oldChunks);
      this.oldChunks = [];
    }
  }
}
