import { getRandomMaze, getPositions, cellToCoord, CELL_SIZE } from "./mazes.js";

const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");
const game = document.getElementById("game");
const timerText = document.getElementById("timer");

let player = { x: 0, y: 0 };
let maze, start, end;
let timeLeft = 60;
let timerInterval;
const LEVEL_BACKGROUNDS = [
  "img/nivel1.jpg",
  "img/nivel2.jpg",
  "img/nivel3.jpg"
];

function setBackgroundForLevel(levelIndex) {
  const url = LEVEL_BACKGROUNDS[levelIndex] || LEVEL_BACKGROUNDS[0];
  document.body.style.backgroundImage = `url('${url}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundPosition = "center center";
}

startBtn.addEventListener("click", startGame);

function startGame() {
  menu.classList.add("hidden");
  game.classList.remove("hidden");

  const { maze: selectedMaze, index: levelIndex } = getRandomMaze();
  maze = selectedMaze;
  setBackgroundForLevel(levelIndex);
  const pos = getPositions(maze);
  start = pos.start;
  end = pos.end;
  player = { ...start };
  drawMaze();
  drawPlayer();

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 60;
  timerText.textContent = `Tiempo: ${timeLeft}s`;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerText.textContent = `Tiempo: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert("⏰ Se acabó el tiempo!");
      location.reload();
    }
  }, 1000);
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      const cell = maze[y][x];
      const px = x * CELL_SIZE;
      const py = y * CELL_SIZE;
      if (cell === 1) {
        ctx.fillStyle = "#333";
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      } else if (cell === "E") {
        ctx.fillStyle = "#00ff88";
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      } else if (cell === "S") {
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

function drawPlayer() {
  const { x, y } = cellToCoord(player);
  ctx.fillStyle = "#00ccff";
  ctx.beginPath();
  ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2);
  ctx.fill();
}

function canMove(x, y) {
  return maze[y] && maze[y][x] !== 1;
}

document.addEventListener("keydown", (e) => {
  let newX = player.x;
  let newY = player.y;

  if (e.key === "ArrowUp") newY--;
  if (e.key === "ArrowDown") newY++;
  if (e.key === "ArrowLeft") newX--;
  if (e.key === "ArrowRight") newX++;

  if (canMove(newX, newY)) {
    player.x = newX;
    player.y = newY;
    drawMaze();
    drawPlayer();
    checkWin();
  }
});

function checkWin() {
  if (player.x === end.x && player.y === end.y) {
    clearInterval(timerInterval);
    alert("🎉 ¡Ganaste!");
    location.reload();
  }
}