const gridSize = 5;
const sequenceLength = 5;
let matrix = [];
let sequence = [];
let userInput = [];
let gameActive = true;
let lastPick = null;

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function generateMatrix() {
  matrix = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    matrix.push(randomInt(10));
  }
}

function generateSequence() {
  sequence = [];
  let usedNumbers = new Set();
  // Start at a random cell
  let idx = randomInt(gridSize * gridSize);
  sequence.push(idx);
  usedNumbers.add(matrix[idx]);
  while (sequence.length < sequenceLength) {
    const prevIdx = sequence[sequence.length - 1];
    const prevRow = Math.floor(prevIdx / gridSize);
    const prevCol = prevIdx % gridSize;
    // Find all cells in same row or column with a unique number
    let candidates = [];
    for (let i = 0; i < matrix.length; i++) {
      if (sequence.includes(i)) continue; // don't revisit cells
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      if ((row === prevRow || col === prevCol) && !usedNumbers.has(matrix[i])) {
        candidates.push(i);
      }
    }
    if (candidates.length === 0) break; // can't extend further
    let nextIdx = candidates[randomInt(candidates.length)];
    sequence.push(nextIdx);
    usedNumbers.add(matrix[nextIdx]);
  }
  // If we failed to build a full sequence, regenerate
  if (sequence.length < sequenceLength) {
    generateMatrix();
    generateSequence();
  }
}

function renderMatrix() {
  const game = document.getElementById('game');
  game.innerHTML = '';
  for (let i = 0; i < matrix.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = matrix[i];
    cell.dataset.idx = i;
    cell.addEventListener('click', onCellClick);
    game.appendChild(cell);
  }
  highlightAllowedCells();
  updateTerminalProgress();
}

function renderSequence() {
  const seqDiv = document.getElementById('sequence');
  seqDiv.innerHTML = 'Sequence: ' + sequence.map((idx, i) => {
    const val = matrix[idx];
    if (i < userInput.length) {
      return `<span style="color:#4caf50;font-weight:bold;">${val}</span>`;
    } else {
      return `<span>${val}</span>`;
    }
  }).join(' <span style="color:#888;">→</span> ');
  updateTerminalProgress();
}

function highlightAllowedCells() {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('allowed');
    // Don't add allowed to already selected cells
    if (userInput.length === 0) return;
    const prevIdx = userInput[userInput.length - 1];
    const prevRow = Math.floor(prevIdx / gridSize);
    const prevCol = prevIdx % gridSize;
    const idx = parseInt(cell.dataset.idx);
    const currRow = Math.floor(idx / gridSize);
    const currCol = idx % gridSize;
    if ((currRow === prevRow || currCol === prevCol) && !userInput.includes(idx)) {
      cell.classList.add('allowed');
    }
  });
}

function onCellClick(e) {
  if (!gameActive) return;
  const idx = parseInt(e.currentTarget.dataset.idx);
  const cell = e.currentTarget;
  const expectedIdx = sequence[userInput.length];
  const expectedValue = matrix[expectedIdx];
  // Prevent picking a number already picked (in any cell)
  const pickedValues = userInput.map(i => matrix[i]);
  if (pickedValues.includes(matrix[idx])) {
    cell.classList.add('error');
    setMessage('You already picked this number!', false);
    setTimeout(() => {
      cell.classList.remove('error');
    }, 500);
    return;
  }
  // Row/col restriction logic
  if (userInput.length > 0) {
    const prevIdx = userInput[userInput.length - 1];
    const prevRow = Math.floor(prevIdx / gridSize);
    const prevCol = prevIdx % gridSize;
    const currRow = Math.floor(idx / gridSize);
    const currCol = idx % gridSize;
    if (currRow !== prevRow && currCol !== prevCol) {
      cell.classList.add('error');
      setMessage('Must pick from same row or column as last pick!', false);
      setTimeout(() => {
        cell.classList.remove('error');
      }, 500);
      userInput = [];
      document.querySelectorAll('.cell.selected').forEach(c => c.classList.remove('selected'));
      highlightAllowedCells();
      renderSequence();
      return;
    }
  }
  if (matrix[idx] === expectedValue) {
    userInput.push(idx);
    // Shade all picked cells in green
    document.querySelectorAll('.cell').forEach((c, i) => {
      if (userInput.includes(i)) {
        c.classList.add('selected');
      }
    });
    highlightAllowedCells();
    renderSequence(); // update sequence highlight
    if (userInput.length === sequence.length) {
      setMessage('Camera hacked! Access granted.', true);
      gameActive = false;
      showHackerWinAnimation();
      return;
    }
  } else {
    cell.classList.add('error');
    setMessage('Wrong cell! Try again.', false);
    setTimeout(() => {
      cell.classList.remove('error');
    }, 500);
    userInput = [];
    document.querySelectorAll('.cell.selected').forEach(c => c.classList.remove('selected'));
    highlightAllowedCells();
    renderSequence(); // update sequence highlight
  }
}

function setMessage(msg, success) {
  const message = document.getElementById('message');
  message.textContent = msg;
  message.style.color = success ? '#4caf50' : '#f44336';
}

function restartGame() {
  generateMatrix();
  generateSequence();
  userInput = [];
  gameActive = true;
  setMessage('', true);
  renderMatrix();
  renderSequence(); // ensure sequence is reset
  lastPick = null;
  highlightAllowedCells();
  document.querySelectorAll('.cell.selected').forEach(c => c.classList.remove('selected'));
  updateTerminalProgress();
}

function updateTerminalProgress() {
  const progressDiv = document.getElementById('terminal-progress');
  if (!progressDiv) return;
  let progress = userInput.length / sequence.length;
  progressDiv.innerHTML = `<pre id=\"ascii-cam\">${window.renderCameraHtml(progress)}</pre>`;
  // Progress bar
  let barLength = 20;
  let filled = Math.round(progress * barLength);
  let bar = '[' + '#'.repeat(filled) + '-'.repeat(barLength - filled) + `] ${userInput.length}/${sequence.length}`;
  progressDiv.innerHTML += `\n<span style=\"color:#39ff14;\">Progress:</span> <span style=\"color:#fff;\">${bar}</span>`;
}

function getRandomHackerWinMessage() {
  // Use the global hackerWinMessages array from hackerWinMessages.js
  const messages = window.hackerWinMessages || [];
  return messages[Math.floor(Math.random() * messages.length)] || 'ACCESS GRANTED';
}

function animateGridOut() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach((cell, i) => {
    setTimeout(() => {
      cell.classList.add('animate-out');
    }, i * 40 + Math.random() * 80); // staggered, a bit random
  });
}

function showHackerWinAnimation() {
  animateGridOut(); // Animate grid away!
  const progressDiv = document.getElementById('terminal-progress');
  if (!progressDiv) return;
  const msg = getRandomHackerWinMessage();
  let i = 0;
  progressDiv.innerHTML = '';
  function typeNext() {
    if (i <= msg.length) {
      progressDiv.innerHTML = `<pre style='color:#39ff14;font-size:2em;text-shadow:0 0 8px #39ff14;'>${msg.slice(0, i)}<span class='blink'>█</span></pre>`;
      i++;
      setTimeout(typeNext, 60);
    } else {
      progressDiv.innerHTML = `<pre style='color:#39ff14;font-size:2em;text-shadow:0 0 8px #39ff14;'>${msg}</pre>`;
    }
  }
  typeNext();
}

document.getElementById('restart').addEventListener('click', restartGame);
restartGame();
