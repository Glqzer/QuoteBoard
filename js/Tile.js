import { CHARSET, SCRAMBLE_COLORS, SCRAMBLE_DURATION, FLIP_DURATION } from './constants.js';

export class Tile {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.currentChar = ' ';
    this.isAnimating = false;
    this._scrambleTimer = null;
    this._startTimer = null;
    this._settleTimer = null;
    this._cleanupTimer = null;
    this._animationId = 0;

    // Build DOM
    this.el = document.createElement('div');
    this.el.className = 'tile';

    this.innerEl = document.createElement('div');
    this.innerEl.className = 'tile-inner';

    this.frontEl = document.createElement('div');
    this.frontEl.className = 'tile-front';
    this.frontSpan = document.createElement('span');
    this.frontEl.appendChild(this.frontSpan);

    this.backEl = document.createElement('div');
    this.backEl.className = 'tile-back';
    this.backSpan = document.createElement('span');
    this.backEl.appendChild(this.backSpan);

    this.innerEl.appendChild(this.frontEl);
    this.innerEl.appendChild(this.backEl);
    this.el.appendChild(this.innerEl);
  }

  setChar(char) {
    this._clearTimers();
    this._resetVisualState();
    this.currentChar = char;
    this.frontSpan.textContent = char === ' ' ? '' : char;
    this.backSpan.textContent = char === ' ' ? '' : char;
  }

  scrambleTo(targetChar, delay, force = false) {
    if (targetChar === this.currentChar && !force) return;

    const animationId = ++this._animationId;
    this._clearTimers();
    this._resetVisualState();
    this.isAnimating = true;

    this._startTimer = setTimeout(() => {
      if (animationId !== this._animationId) return;
      this._startTimer = null;
      this.el.classList.add('scrambling');
      let scrambleCount = 0;
      const maxScrambles = 10 + Math.floor(Math.random() * 4);
      const scrambleInterval = 70;

      this._scrambleTimer = setInterval(() => {
        if (animationId !== this._animationId) {
          clearInterval(this._scrambleTimer);
          this._scrambleTimer = null;
          return;
        }

        // Random character
        const randChar = CHARSET[Math.floor(Math.random() * CHARSET.length)];
        this.frontSpan.textContent = randChar === ' ' ? '' : randChar;

        // Cycle background color
        const color = SCRAMBLE_COLORS[scrambleCount % SCRAMBLE_COLORS.length];
        this.frontEl.style.backgroundColor = color;

        // Briefly change text color for contrast on light backgrounds
        if (color === '#FFFFFF' || color === '#FFCC00') {
          this.frontSpan.style.color = '#111';
        } else {
          this.frontSpan.style.color = '';
        }

        scrambleCount++;

        if (scrambleCount >= maxScrambles) {
          clearInterval(this._scrambleTimer);
          this._scrambleTimer = null;

          // Reset colors
          this.frontEl.style.backgroundColor = '';
          this.frontSpan.style.color = '';

          // Set the final character directly (skip 3D flip for reliability)
          // Use a brief opacity flash to simulate the flip settle
          this.frontSpan.textContent = targetChar === ' ' ? '' : targetChar;
          this.backSpan.textContent = targetChar === ' ' ? '' : targetChar;

          // Quick flash effect: brief scale transform
          this.innerEl.style.transition = `transform ${FLIP_DURATION}ms ease-in-out`;
          this.innerEl.style.transform = 'perspective(400px) rotateX(-8deg)';

          this._settleTimer = setTimeout(() => {
            if (animationId !== this._animationId) return;
            this.innerEl.style.transform = '';
            this._cleanupTimer = setTimeout(() => {
              if (animationId !== this._animationId) return;
              this.innerEl.style.transition = '';
              this.el.classList.remove('scrambling');
              this.currentChar = targetChar;
              this.isAnimating = false;
            }, FLIP_DURATION);
          }, FLIP_DURATION / 2);
        }
      }, scrambleInterval);
    }, delay);
  }

  _clearTimers() {
    if (this._startTimer) {
      clearTimeout(this._startTimer);
      this._startTimer = null;
    }
    if (this._scrambleTimer) {
      clearInterval(this._scrambleTimer);
      this._scrambleTimer = null;
    }
    if (this._settleTimer) {
      clearTimeout(this._settleTimer);
      this._settleTimer = null;
    }
    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }

  _resetVisualState() {
    this.el.classList.remove('scrambling');
    this.frontEl.style.backgroundColor = '';
    this.frontSpan.style.color = '';
    this.innerEl.style.transition = '';
    this.innerEl.style.transform = '';
  }
}
