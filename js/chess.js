let canvas, ctx;
let piecesSprites, spriteWidth=426, spriteHeight = 426;
// game logic variables
let savedPiece = null;
let mouseDown = false;
let mouseDownIndex = null;
let mousePos = { x: 0, y: 0 };

// class with definitions of the pieces
let Pieces = {
  Exists: 1 << 6,

  White: 1 << 5,

  Pawn: 5,
  Rook: 4,
  Knight: 3,
  Bishop: 2,
  Queen: 1,
  King: 0,
}

// load pieces sprites as buffer from ../img/pieces.png
function loadPieces() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = './img/pieces.png';
    img.onload = () => {
      const buffer = document.createElement('canvas');
      buffer.width = img.width;
      buffer.height = img.height;
      buffer.getContext('2d').drawImage(img, 0, 0);
      resolve(buffer);
    };
    img.onerror = reject;
  });
}

/**
 *   draw a piece on the board
 *   @param {number} piece - the position of the piece
 *   @param {number} x - the x position of the piece
 *   @param {number} y - the y position of the piece
 */
function drawPiece(piece, index) {
  // check if the piece exists
  if (!(piece & Pieces.Exists)) return;

  // determine x and y position of the piece
  const x = index % 8;
  const y = Math.floor(index / 8);

  // determine the size of the squares
  const squareSize = canvas.isLandscape ? canvas.height * 0.9 / 8 : canvas.width * 0.9 / 8;

  // determine top left corner of the board
  const boardX = (canvas.width - squareSize * 8) / 2;
  const boardY = (canvas.height - squareSize * 8) / 2;

  // determine if the piece is white or black
  const isWhite = piece & 1 << 5;

  // determine the type of the piece
  const type = piece & 7;

  // determine the position of the piece in the sprite
  const spriteX = type * spriteWidth;
  const spriteY = isWhite ? 0 : spriteHeight;

  // draw the piece
  ctx.drawImage(piecesSprites, spriteX, spriteY, spriteWidth, spriteHeight, boardX + x * squareSize, boardY + y * squareSize, squareSize, squareSize);
}

function drawHeldPiece() {
  // determine the size of the squares
  const squareSize = canvas.isLandscape ? canvas.height * 0.9 / 8 : canvas.width * 0.9 / 8;

  // determine the position of the piece in the sprite
  const spriteX = (savedPiece.piece & 7) * spriteWidth;
  const spriteY = (savedPiece.piece & Pieces.White) ? 0 : spriteHeight;

  // draw the piece
  ctx.drawImage(piecesSprites, spriteX, spriteY, spriteWidth, spriteHeight, mousePos.x - squareSize / 2, mousePos.y - squareSize / 2, squareSize, squareSize);
}

function drawTiles(canvas, ctx) {
  // determine the size of the squares
  const squareSize = canvas.isLandscape ? canvas.height * 0.9 / 8 : canvas.width * 0.9 / 8;

  // determine top left corner of the board
  const x = (canvas.width - squareSize * 8) / 2;
  const y = (canvas.height - squareSize * 8) / 2;

  // draw the squares
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#ffd39d' : '#cc8324';
      ctx.fillRect(x + i * squareSize, y + j * squareSize, squareSize, squareSize);
    }
  }
}


// draw the chess board
function drawBoard() {
  // clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw the tiles of the board
  drawTiles(canvas, ctx);

  // draw the pieces
  for (let i = 0; i < board.length; i++) {
    drawPiece(board[i], i);
  }

  // draw the held piece
  if (savedPiece) drawHeldPiece();

  // ensure loop
  requestAnimationFrame(drawBoard);
}

// on page load
$(document).ready(async () => {
  // get the canvas element
  canvas = document.getElementById('chess');
  // get the 2d context
  ctx = canvas.getContext('2d');

  // on resize, set the width and height of the canvas
  $(window).resize(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.isLandscape = canvas.width > canvas.height;
  })

  // trigger resize to set the width and height of the canvas
  $(window).resize();

  // load the pieces sprites
  try {
    piecesSprites = await loadPieces();
  } catch (e) {
    console.error(e);
    alert('Error loading pieces sprites');
  }

  // draw the board
  requestAnimationFrame(drawBoard);
})

/*
 !   GAME LOGIC
 !  =================
 */

// the board
let board = new Array(64).fill(0);

// loadFen
function loadFen(fen) {
  // split the fen string into sections
  const sections = fen.split('/');
  // loop through the sections
  for (let i = 0; i < sections.length; i++) {
    // loop through the characters in the section
    for (let j = 0; j < sections[i].length; j++) {
      // get the character
      const char = sections[i][j];
      // check if the character is a number
      if (!isNaN(char)) {
        // if so, skip the next char.length squares
        j += parseInt(char) - 1;
        continue;
      }

      // determine the type of the piece
      let type;
      switch (char.toLowerCase()) {
        case 'p':
          type = Pieces.Pawn;
          break;
        case 'r':
          type = Pieces.Rook;
          break;
        case 'n':
          type = Pieces.Knight;
          break;
        case 'b':
          type = Pieces.Bishop;
          break;
        case 'q':
          type = Pieces.Queen;
          break;
        case 'k':
          type = Pieces.King;
          break;
      }

      // determine the color of the piece
      const isWhite = char === char.toUpperCase();

      // set the piece on the board
      board[i * 8 + j] = Pieces.Exists | (isWhite ? Pieces.White : 0) | type;
    }
  }
}

// load default fen string
loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

// on click down
$("#chess").mousedown((e) => {
  // set mouse down to true
  mouseDown = true;

  // x and y position of the mouse
  let x = e.pageX - canvas.offsetLeft;
  let y = e.pageY - canvas.offsetTop;

  // save the mouse position
  mousePos = { x, y };

  // determine the size of the squares
  const squareSize = canvas.isLandscape ? canvas.height * 0.9 / 8 : canvas.width * 0.9 / 8;

  // determine top left corner of the board
  const boardX = (canvas.width - squareSize * 8) / 2;
  const boardY = (canvas.height - squareSize * 8) / 2;

  // determine the square
  const squareX = Math.floor((x - boardX) / squareSize);
  const squareY = Math.floor((y - boardY) / squareSize);

  // determine the index
  const index = squareY * 8 + squareX;

  // determine the piece
  const piece = board?.[index];

  // make piece disappear if it exists
  if (piece & Pieces.Exists) {
    board[index] = 0;

    // save the mouse down index
    mouseDownIndex = index;

    // save the piece
    savedPiece = { piece, x: squareX, y: squareY };
  }
})

// on mouse move
$("#chess").mousemove((e) => {
  // x and y position of the mouse
  let x = e.pageX - canvas.offsetLeft;
  let y = e.pageY - canvas.offsetTop;

  // save the mouse position
  mousePos = { x, y };
})

// on click up
$("#chess").mouseup((e) => {
  // set mouse down to false
  mouseDown = false;

  // if there is no saved piece, return
  if (!savedPiece) return;

  let x = e.pageX - canvas.offsetLeft;
  let y = e.pageY - canvas.offsetTop;

  // determine the size of the squares
  const squareSize = canvas.isLandscape ? canvas.height * 0.9 / 8 : canvas.width * 0.9 / 8;

  // determine top left corner of the board
  const boardX = (canvas.width - squareSize * 8) / 2;
  const boardY = (canvas.height - squareSize * 8) / 2;

  // determine the square
  const squareX = Math.floor((x - boardX) / squareSize);
  const squareY = Math.floor((y - boardY) / squareSize);

  // check if the square is valid
  if (squareX < 0 || squareX > 7 || squareY < 0 || squareY > 7 || savedPiece.x === squareX && savedPiece.y === squareY) {
    // if not, put the piece back
    board[mouseDownIndex] = savedPiece.piece;

    savedPiece = null;
    return;
  }

  // if the piece was moved, put it in the new square
  board[squareY * 8 + squareX] = savedPiece.piece;
  // TODO: check if the move is valid

  // reset the saved piece
  savedPiece = null;
})
