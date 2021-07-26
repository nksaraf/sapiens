
import { firefox } from 'playwright';
import { Chess, WHITE } from './lib/chess'
// import stockfish from 'stockfish';

// let fish = stockfish();
// fish.onmessage = function (event) {
//   //NOTE: Web Workers wrap the response in an object.
//   console.log(event.data ? event.data : event);
// };

// console.log(fish);


(async () => {
  const browser = await firefox.launch({
    headless: false
  });
  const context = await browser.newContext();

  // Open new page
  const page = await context.newPage();

  // Go to https://www.chess.com/
  await page.goto('https://www.chess.com/');

  // // Click a:has-text("Log In")
  // await page.click('a:has-text("Log In")');
  // // assert.equal(page.url(), 'https://www.chess.com/login_and_go?returnUrl=https://www.chess.com/');

  // // Click [placeholder="Username or Email"]
  // await page.click('[placeholder="Username or Email"]');

  // // Fill [placeholder="Username or Email"]
  // await page.fill('[placeholder="Username or Email"]', 'nksaraf98');

  // // Press Tab
  // await page.press('[placeholder="Username or Email"]', 'Tab');

  // // Click [placeholder="Password"]
  // await page.click('[placeholder="Password"]');

  // // Click [placeholder="Password"]
  // await page.click('[placeholder="Password"]');

  // // Fill [placeholder="Password"]
  // await page.fill('[placeholder="Password"]', '@Hogwart582');

  // // Click text=Log In
  // await page.click('text=Log In');
  // // assert.equal(page.url(), 'https://www.chess.com/home');

  // Click a:has-text("vs Computer")
  await page.click('a:has-text("Play Computer")');
  // assert.equal(page.url(), 'https://www.chess.com/play/computer');

  // Click text=Chess Computer Challenge the computer to an online chess game. Play bots with va >> button
  await page.click('text=Chess Computer Challenge the computer to an online chess game. Play bots with va >> button');

  // Click text=Choose
  await page.click('text=Choose');

  // Click button:has-text("Play")
  await page.click('button:has-text("Play")');

  const chess = new Chess();

  let board = await page.$('chess-board')
  let { width, height } = await board.boundingBox()
  let cellWidth = (width / 8);
  let cellHeight = (height / 8);

  // for (var i = 0; i < 8; i++) {
  //   for (var j = 0; j < 8; j++) {
  //     await board.click({ position: { x: (cellWidth * i) + 1, y: (cellHeight * j) + 1 }, button: "right" })

  //   }
  // }

  let moves = await page.$('vertical-move-list')

  let oldMovesLength = 0;
  let lastMoveIndex = 0;
  let movePos = 0
  let moveCount = 0

  let rowIndex = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 }

  async function clickSquare(pos, options) {
    return await board.click({ position: { x: (cellWidth * (rowIndex[pos.charAt(0)] - 1)) + 1, y: (cellHeight * (8 - Number(pos.charAt(1))) + 1) }, ...options })
  }

  async function makeWhiteMove(move) {
    let moveDescription = chess.move(move, { dry_run: true })
    await clickSquare(moveDescription.from, {})
    await clickSquare(moveDescription.to, {})
  }

  page.exposeFunction('movesChanged', async () => {
    const movesMade = (await moves.innerText()).split('\n');

    if (oldMovesLength == movesMade.length) {
      return
    }

    oldMovesLength = movesMade.length
    chess.move(movesMade[movesMade.length - 1])
    console.log(chess.ascii())

    if (chess.state.turn === WHITE) {
      let move = chess.moves()[0]
      setTimeout(() => makeWhiteMove(move), 500)
    }
  });

  console.log(await moves.evaluate(move => {
    return new Promise(res => {
      new window.MutationObserver((mutationsList, observer) => {
        // Assuming all children are 'mySubClass'. If not, add more logic here to determine whether
        // we are done.
        console.log(document.querySelector('vertical-move-list').textContent)

        for (var mutation of mutationsList) {
          console.log(mutation.oldValue, mutation.addedNodes, mutation.removedNodes, mutation.type)

          // @ts-ignore
          movesChanged();
        }
      }).observe(move, { childList: true, subtree: true })
    })
  }))


  // ---------------------
  // await context.close();
  // await browser.close();
})();