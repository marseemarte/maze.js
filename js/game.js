const CELL_SIZE = 80;

const mazes = [
  [
    ['S', 0, 1, 0, 0],
    [1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1],
    [0, 0, 0, 'E', 0]
  ],
  [
    [1, 'S', 0, 0, 0],
    [1, 0, 1, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 'E', 1]
  ],
  [
    ['S', 0, 1, 0, 0],
    [0, 0, 1, 0, 1],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0],
    [1, 0, 0, 'E', 0]
  ]
];

function getRandomMaze() {
  const randomIndex = Math.floor(Math.random() * mazes.length);
  return mazes[randomIndex];
}

function getPositions(maze) {
  let start = null;
  let end = null;
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === 'S') start = { x, y };
      if (maze[y][x] === 'E') end = { x, y };
    }
  }
  return { start, end };
}

function cellToCoord(cell) {
  return {
    x: cell.x * CELL_SIZE,
    y: cell.y * CELL_SIZE
  };
}

export { mazes, getRandomMaze, getPositions, cellToCoord, CELL_SIZE };