// Mapa del laberinto (1 = pared, 0 = camino)
const mapa = [
  [1,1,1,1,1,1,1,1,1,1,],
  [1,0,0,0,0,1,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,0,0,0,1],
  [1,0,0,0,0,0,1,0,1,1],
  [1,1,1,1,1,0,1,0,0,1],
  [1,0,0,0,1,0,0,0,0,1],
  [1,0,1,0,0,0,1,0,2,1], // 2 = salida
  [1,1,1,1,1,1,1,1,1,1]
];
const laberinto = document.getElementById('laberinto');
const mensaje = document.getElementById('mensaje');

// Crear el laberinto visual
mapa.forEach(fila => {
  fila.forEach(valor => {
    const celda = document.createElement('div');
    celda.classList.add('celda');
    if (valor === 1) celda.classList.add('pared');
    if (valor === 2) celda.classList.add('salida');
    laberinto.appendChild(celda);
  });
});

// Posiciones iniciales
let jugador = {x: 1, y: 1};
let jefe = {x: 8, y: 8};
let jugando = true;

function dibujar() {
  const celdas = document.querySelectorAll('.celda');
  celdas.forEach(c => c.classList.remove('jugador', 'jefe'));

  let idxJugador = jugador.y * 10 + jugador.x;
  let idxJefe = jefe.y * 10 + jefe.x;

  celdas[idxJugador].classList.add('jugador');
  celdas[idxJefe].classList.add('jefe');
}

dibujar();

// Movimiento jugador
document.addEventListener('keydown', (e) => {
  if (!jugando) return;

  let nuevoX = jugador.x;
  let nuevoY = jugador.y;

  if (e.key === 'w') nuevoY--;
  if (e.key === 's') nuevoY++;
  if (e.key === 'a') nuevoX--;
  if (e.key === 'd') nuevoX++;
  

  // Verificar límites y paredes
  if (mapa[nuevoY][nuevoX] === 0 || mapa[nuevoY][nuevoX] === 2) {
    jugador.x = nuevoX;
    jugador.y = nuevoY;
  }

  // Comprobar victoria
  if (mapa[jugador.y][jugador.x] === 2) {
    mensaje.textContent = "🎉 ¡Escapaste del monstruo! Ganaste 😎";
    jugando = false;
  }

  dibujar();
});

// Movimiento del jefe (persigue al jugador)
function moverJefe() {
  if (!jugando) return;

  let dx = jugador.x - jefe.x;
  let dy = jugador.y - jefe.y;

  let movX = jefe.x + Math.sign(dx);
  let movY = jefe.y + Math.sign(dy);

  // Movimiento simple hacia el jugador (evita paredes)
  if (Math.abs(dx) > Math.abs(dy)) {
    if (mapa[jefe.y][movX] === 0) jefe.x = movX;
    else if (mapa[movY][jefe.x] === 0) jefe.y = movY;
  } else {
    if (mapa[movY][jefe.x] === 0) jefe.y = movY;
    else if (mapa[jefe.y][movX] === 0) jefe.x = movX;
  }

  dibujar();

  // Detectar colisión
  if (jugador.x === jefe.x && jugador.y === jefe.y) {
    mensaje.textContent = "💀 ¡El monstruo te atrapó! Intenta de nuevo.";
    jugando = false;
  }
}

setInterval(moverJefe, 600);
