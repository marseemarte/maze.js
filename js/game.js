const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive settings: tratar de tener muchas celdas (paredes pequeñas)
let cellSize = 24; // valor inicial; se recalcula en setup
let maze = [];
let rows = 0;
let cols = 0;

let player = { x: 1, y: 1 };
let goal = { x: 1, y: 1 };
let currentLevel = 1;
let monsters = [];
let monsterInterval = null;

// Imagen del monstruo
const monsterImg = new Image();
monsterImg.src = 'img/monster.png';

// Efectos de sonido (coloca los archivos en audio/)
const sfxWin = new Audio('ganaste2.mp3');
const sfxLose = new Audio('PERDISTE2.mp3');
// Ajustes por defecto
sfxWin.volume = 0.9;
sfxLose.volume = 0.9;

// Configuración de niveles
const levels = [
  { 
    rows: 25, 
    cols: 25, 
    time: 60,
    monsters: 0,
    monsterSpeed: 0
  },
  { 
    rows: 29, 
    cols: 29, 
    time: 60,
    monsters: 1,
    monsterSpeed: 300  // Velocidad en ms (más alto = más lento)
  },
  { 
    rows: 33, 
    cols: 33, 
    time: 60,
    monsters: 3,
    monsterSpeed: 200  // Más rápido que en nivel 2
  }
];

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

function createMonster() {
  // Encontrar una posición válida para el monstruo
  let x, y;
  do {
    x = Math.floor(Math.random() * (cols - 2)) + 1;
    y = Math.floor(Math.random() * (rows - 2)) + 1;
  } while (maze[y][x] === 1 || (x === player.x && y === player.y) || (x === goal.x && y === goal.y));
  
  return { x, y };
}

function moveMonsters() {
  for (let monster of monsters) {
    // Calcular dirección hacia el jugador
    const dx = Math.sign(player.x - monster.x);
    const dy = Math.sign(player.y - monster.y);
    
    // Priorizar el movimiento en la dirección que está más lejos del jugador
    const distX = Math.abs(player.x - monster.x);
    const distY = Math.abs(player.y - monster.y);
    
    if (distX > distY) {
      // Intentar moverse horizontalmente primero
      if (!isWall(monster.x + dx, monster.y)) {
        monster.x += dx;
      } 
      // Si no puede, intentar verticalmente
      else if (!isWall(monster.x, monster.y + dy)) {
        monster.y += dy;
      }
      // Si ambas direcciones están bloqueadas, buscar camino alternativo
      else {
        const possibleMoves = [
          {x: 0, y: 1},
          {x: 0, y: -1},
          {x: -dx, y: 0} // Dirección opuesta como última opción
        ].filter(move => !isWall(monster.x + move.x, monster.y + move.y));
        
        if (possibleMoves.length > 0) {
          // Elegir el primer movimiento disponible (más directo)
          const move = possibleMoves[0];
          monster.x += move.x;
          monster.y += move.y;
        }
      }
    } else {
      // Intentar moverse verticalmente primero
      if (!isWall(monster.x, monster.y + dy)) {
        monster.y += dy;
      }
      // Si no puede, intentar horizontalmente
      else if (!isWall(monster.x + dx, monster.y)) {
        monster.x += dx;
      }
      // Si ambas direcciones están bloqueadas, buscar camino alternativo
      else {
        const possibleMoves = [
          {x: 1, y: 0},
          {x: -1, y: 0},
          {x: 0, y: -dy} // Dirección opuesta como última opción
        ].filter(move => !isWall(monster.x + move.x, monster.y + move.y));
        
        if (possibleMoves.length > 0) {
          // Elegir el primer movimiento disponible (más directo)
          const move = possibleMoves[0];
          monster.x += move.x;
          monster.y += move.y;
        }
      }
    }
    
    // Verificar colisión con el jugador
    if (monster.x === player.x && monster.y === player.y) {
      // Reducir vida en lugar de reiniciar inmediatamente
      lives--;
      const livesEl = document.getElementById("lives");
      if (livesEl) livesEl.textContent = "Vidas: " + lives;

      if (lives <= 0) {
        // Si ya no quedan vidas: fin del juego
        clearInterval(timerInterval);
        clearInterval(monsterInterval);

        // reproducir sonido de derrota (intentar, si el usuario ya interactuó se permitirá)
        try { sfxLose.currentTime = 0; sfxLose.play(); } catch(e) {}

        const gameOverModal = document.getElementById('gameOverModal');
        const hud = document.getElementById("hud");
        if (gameOverModal) {
          gameOverModal.style.display = 'flex';
          // asignar click que detenga el sonido y reinicie
          gameOverModal.onclick = () => {
            try { sfxLose.pause(); sfxLose.currentTime = 0; } catch(e) {}
            gameOverModal.style.display = 'none';
            if (hud) hud.style.display = "flex";
            canvas.style.display = "block";
            resetGame();
          };
        }
        if (hud) hud.style.display = "none";
        canvas.style.display = "none";
        return;
      } else {
        // Si quedan vidas: devolver al jugador a la posición inicial y continuar
        player = { x: 1, y: 1 };
        drawMaze();
        // No detener intervalos: los monstruos siguen activos
        // Evitar procesar colisiones adicionales inmediatamente
        // (si quieres invulnerabilidad temporal, podemos añadirla más tarde)
      }
    }
  }
  drawMaze();
}

function setupCanvasAndMaze() {
  // Limpiar intervalos anteriores
  if (monsterInterval) {
    clearInterval(monsterInterval);
  }
  monsters = [];
  
  // Obtener configuración del nivel actual (aleatorio)
  const levelIndex = Math.floor(Math.random() * levels.length);
  const level = levels[levelIndex];
  currentLevel = levelIndex + 1;
  
  // Calcular el tamaño de celda basado en el espacio disponible
  const maxW = Math.min(800, Math.floor(window.innerWidth * 0.9));
  const maxH = Math.min(800, Math.floor(window.innerHeight * 0.8));
  cellSize = Math.floor(Math.min(maxW / level.rows, maxH / level.rows));
  cellSize = Math.max(16, Math.min(26, cellSize)); // ajustado para mejor visibilidad

  // Establecer las dimensiones del laberinto
  rows = level.rows;
  cols = level.cols;

  // Asegurar dimensiones impares para el laberinto
  if (rows % 2 === 0) rows--;
  if (cols % 2 === 0) cols--;

  // Ajustar el tamaño del canvas
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  // Generar el laberinto con las dimensiones correctas
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

  // Dibujar monstruos
  for (let monster of monsters) {
    ctx.drawImage(
      monsterImg,
      monster.x * cellSize,
      monster.y * cellSize,
      cellSize,
      cellSize
    );
  }

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
    return; // Si hay pared, simplemente no nos movemos
  }

  player.x = newX;
  player.y = newY;

  if (player.x === goal.x && player.y === goal.y) {
    clearInterval(timerInterval);
    clearInterval(monsterInterval);
    
    // Mostrar modal de victoria
    const victoriaModal = document.getElementById('victoriaModal');
    const hud = document.getElementById("hud");
    
    if (victoriaModal) {
      // reproducir sonido de victoria
      try { sfxWin.currentTime = 0; sfxWin.play(); } catch(e) {}
      victoriaModal.style.display = 'flex';
      // asignar click que detenga el sonido y reinicie
      victoriaModal.onclick = () => {
        try { sfxWin.pause(); sfxWin.currentTime = 0; } catch(e) {}
        victoriaModal.style.display = 'none';
        if (hud) hud.style.display = "flex";
        canvas.style.display = "block";
        resetGame();
      };
    }
    if (hud) hud.style.display = "none";
    canvas.style.display = "none";
    return;
  }

  drawMaze();
}

function resetGame() {
  setupCanvasAndMaze();
  currentPlayerImg = playerImg; // Asegurar que mire al frente al iniciar
  lives = 3;
  time = 60;
  
  // Crear monstruos según el nivel
  const level = levels[currentLevel - 1];
  for (let i = 0; i < level.monsters; i++) {
    monsters.push(createMonster());
  }
  
  // Iniciar movimiento de monstruos si hay alguno
  if (level.monsters > 0) {
    monsterInterval = setInterval(moveMonsters, level.monsterSpeed);
  }

  // Actualizar la interfaz
  const livesEl = document.getElementById("lives");
  if (livesEl) livesEl.textContent = "Vidas: 3";
  const levelEl = document.getElementById("level");
  if (levelEl) levelEl.textContent = "Nivel: " + currentLevel;
  
  const timerEl = document.getElementById("timer");
  if (timerEl) timerEl.textContent = "Tiempo: " + time + "s";
  // detener/rewindear efectos de sonido si estaban sonando
  try { sfxWin.pause(); sfxWin.currentTime = 0; } catch(e) {}
  try { sfxLose.pause(); sfxLose.currentTime = 0; } catch(e) {}
  
  // Reiniciar el temporizador
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    time--;
    if (timerEl) timerEl.textContent = "Tiempo: " + time + "s";
    
    if (time <= 0) {
      clearInterval(timerInterval);
      clearInterval(monsterInterval);
      // reproducir sonido de derrota
      try { sfxLose.currentTime = 0; sfxLose.play(); } catch(e) {}

      // Mostrar modal de Game Over
      const gameOverModal = document.getElementById('gameOverModal');
      const hud = document.getElementById("hud");
      
      if (gameOverModal) {
        gameOverModal.style.display = 'flex';
        // asignar click que detenga el sonido y reinicie
        gameOverModal.onclick = () => {
          try { sfxLose.pause(); sfxLose.currentTime = 0; } catch(e) {}
          gameOverModal.style.display = 'none';
          if (hud) hud.style.display = "flex";
          canvas.style.display = "block";
          resetGame();
        };
      }
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