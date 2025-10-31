const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive settings: tratar de tener muchas celdas (paredes pequeñas)
let cellSize = 24; // valor inicial; se recalcula en setup
let maze = [];
let rows = 0;
let cols = 0;

let player = { x: 1, y: 1 };
let goal = { x: 1, y: 1 };

// Imágenes del jugador
const playerImg = new Image();
playerImg.src = 'img/frente.png';
const playerDownImg = new Image();
playerDownImg.src = 'img/abajoo.png';
const playerUpImg = new Image();
playerUpImg.src = 'img/arriba.png';
const playerLeftImg = new Image();
playerLeftImg.src = 'img/izquierda.png';
const playerRightImg = new Image();
playerRightImg.src = 'img/derecha.png';

// currentPlayerImg es la imagen que se dibuja cada frame
let currentPlayerImg = playerImg;

let lives = 3;
let time = 60;
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
  // Definir el número deseado de celdas
  const targetCols = 25;
  const targetRows = 25;
  
  // Calcular el tamaño de celda basado en el espacio disponible
  const maxW = Math.min(640, Math.floor(window.innerWidth * 0.9));
  const maxH = Math.min(640, Math.floor(window.innerHeight * 0.7));
  cellSize = Math.floor(Math.min(maxW / targetCols, maxH / targetRows));
  cellSize = Math.max(18, Math.min(28, cellSize)); // ajustado para el nuevo tamaño

  // Ajustar el tamaño del canvas para que sea múltiplo exacto del tamaño de celda
  cols = targetCols;
  rows = targetRows;
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

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

  // Jugador (imagen)
  ctx.drawImage(
    currentPlayerImg,
    player.x * cellSize,
    player.y * cellSize,
    cellSize,
    cellSize
  );
}

function isWall(x, y) {
  if (y < 0 || y >= rows || x < 0 || x >= cols) return true;
  return maze[y][x] === 1;
}

function movePlayer(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;

  if (isWall(newX, newY)) {
    // Si toca pared, simplemente no se mueve
    return;
  }

  player.x = newX;
  player.y = newY;

  if (player.x === goal.x && player.y === goal.y) {
    clearInterval(timerInterval);
    alert(`¡Ganaste! Te quedaban ${time} segundos`);
    resetGame();
  }

  drawMaze();
}

function resetGame() {
  setupCanvasAndMaze();
  currentPlayerImg = playerImg; // Asegurar que mire al frente al iniciar
  lives = 3;
  time = 60;
  const livesEl = document.getElementById("lives");
  if (livesEl) livesEl.textContent = "Vidas: 3";
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = "Tiempo: " + time + "s";
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    time--;
    if (timerEl) timerEl.textContent = "Tiempo: " + time + "s";
    
    // Verificar si se acabó el tiempo
    if (time <= 0) {
      clearInterval(timerInterval);
      alert("¡PERDISTE! Se acabó el tiempo");
      const menu = document.getElementById("menu");
      const hud = document.getElementById("hud");
      if (menu) menu.style.display = "block";
      if (hud) hud.style.display = "none";
      canvas.style.display = "none";
    }
  }, 1000);
  drawMaze();
}

// Atajos de teclado
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp": 
      currentPlayerImg = playerUpImg;
      movePlayer(0, -1); 
      break;
    case "ArrowDown": 
      currentPlayerImg = playerDownImg;
      movePlayer(0, 1); 
      break;
    case "ArrowLeft": 
      currentPlayerImg = playerLeftImg;
      movePlayer(-1, 0); 
      break;
    case "ArrowRight": 
      currentPlayerImg = playerRightImg;
      movePlayer(1, 0); 
      break;
  }
});

// Volver a la imagen de frente cuando se suelta la tecla
document.addEventListener("keyup", () => {
  currentPlayerImg = playerImg;
  drawMaze();
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

// Back button
const backBtn = document.getElementById("backBtn");
if (backBtn) {
  backBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    const menu = document.getElementById("menu");
    const hud = document.getElementById("hud");
    if (menu) menu.style.display = "block";
    if (hud) hud.style.display = "none";
    canvas.style.display = "none";
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