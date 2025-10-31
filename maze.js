const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive settings: tratar de tener muchas celdas (paredes pequeñas)
let cellSize = 24; // valor inicial; se recalcula en setup
let maze = [];
let rows = 0;
let cols = 0;

let player = { x: 1, y: 1 };
let goal = { x: 1, y: 1 };

let lives = 3;
let time = 0;
let timerInterval = null;

// --- Generador de laberinto: recursive backtracker sobre una grilla con celdas impares ---
function generateMaze(r, c) {
  // r,c deben ser impares para que los pasillos y muros encajen
  if (r % 2 === 0) r--;
  if (c % 2 === 0) c--;

  // Inicializar con muros (1)
  const grid = Array.from({ length: r }, () => Array(c).fill(1));

  const stack = [];
  const start = { x: 1, y: 1 };
  grid[start.y][start.x] = 0;
  stack.push(start);

  const dirs = [
    { x: 0, y: -2 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
    { x: -2, y: 0 }
  ];

  while (stack.length) {
    const current = stack[stack.length - 1];
    // mezclar dirs
    const shuffled = dirs.sort(() => Math.random() - 0.5);
    let carved = false;

    for (const d of shuffled) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      if (ny > 0 && ny < r && nx > 0 && nx < c && grid[ny][nx] === 1) {
        // quitar el muro intermedio
        grid[current.y + d.y / 2][current.x + d.x / 2] = 0;
        grid[ny][nx] = 0;
        stack.push({ x: nx, y: ny });
        carved = true;
        break;
      }
    }

    if (!carved) stack.pop();
  }

  return grid;
}

function setupCanvasAndMaze() {
  // ajustar canvas al tamaño real de la ventana
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // objetivo: muchas celdas en pantalla -> elegir cellSize pequeño acorde al tamaño
  // intentamos tener ~40 columnas y ~25 filas como referencia
  const targetCols = 40;
  const targetRows = 25;
  const computedSize = Math.floor(Math.min(canvas.width / targetCols, canvas.height / targetRows));
  cellSize = Math.max(12, Math.min(40, computedSize)); // entre 12 y 40 px

  cols = Math.floor(canvas.width / cellSize);
  rows = Math.floor(canvas.height / cellSize);

  // asegurar impar
  if (cols % 2 === 0) cols--;
  if (rows % 2 === 0) rows--;

  maze = generateMaze(rows, cols);

  // Posición del jugador y meta: esquina superior izquierda y esquina inferior derecha (pasillos)
  player = { x: 1, y: 1 };
  goal = { x: cols - 2, y: rows - 2 };

  // Asegurar que start/goal sean caminos
  maze[player.y][player.x] = 0;
  maze[goal.y][goal.x] = 0;
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (maze[y] && maze[y][x] === 1) {
        ctx.fillStyle = "#004477"; // pared
      } else {
        ctx.fillStyle = "#000"; // pasillo
      }
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  // Meta
  ctx.fillStyle = "green";
  ctx.fillRect(goal.x * cellSize, goal.y * cellSize, cellSize, cellSize);

  // Jugador (círculo)
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(
    player.x * cellSize + cellSize / 2,
    player.y * cellSize + cellSize / 2,
    Math.max(4, cellSize / 3),
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function isWall(x, y) {
  if (y < 0 || y >= rows || x < 0 || x >= cols) return true;
  return maze[y][x] === 1;
}

function movePlayer(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;

  if (isWall(newX, newY)) {
    // Toca pared → pierde vida
    lives--;
    const livesEl = document.getElementById("lives");
    if (livesEl) livesEl.textContent = "Vidas: " + lives;
    if (lives <= 0) {
      alert("Perdiste todas las vidas 😢 Reiniciando nivel...");
      resetGame();
    } else {
      alert("¡Cuidado! Tocaste una pared. Te quedan " + lives + " vidas.");
      player = { x: 1, y: 1 };
    }
    drawMaze();
    return;
  }

  player.x = newX;
  player.y = newY;

  if (player.x === goal.x && player.y === goal.y) {
    clearInterval(timerInterval);
    alert(`¡Ganaste! Tiempo final: ${time} segundos`);
    resetGame();
  }

  drawMaze();
}

function resetGame() {
  setupCanvasAndMaze();
  lives = 3;
  time = 0;
  const livesEl = document.getElementById("lives");
  if (livesEl) livesEl.textContent = "Vidas: 3";
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = "Tiempo: 0s";
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    time++;
    if (timerEl) timerEl.textContent = "Tiempo: " + time + "s";
  }, 1000);
  drawMaze();
}

// Atajos de teclado
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": movePlayer(0, -1); break;
    case "ArrowDown": movePlayer(0, 1); break;
    case "ArrowLeft": movePlayer(-1, 0); break;
    case "ArrowRight": movePlayer(1, 0); break;
  }
});

// Start button
const startBtn = document.getElementById("startBtn");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    const menu = document.getElementById("menu");
    const hud = document.getElementById("hud");
    if (menu) menu.style.display = "none";
    if (hud) hud.style.display = "flex";
    canvas.style.display = "block";
    resetGame();
  });
}

// Recalcular al redimensionar la ventana
window.addEventListener("resize", () => {
  // si el juego ya está activo, regenerar para ajustar tamaño
  setupCanvasAndMaze();
  drawMaze();
});

// Hacer setup inicial (pero no iniciar el temporizador hasta que el usuario pulse Start)
setupCanvasAndMaze();
drawMaze();