// game.js
// Lógica del combate integrada con el sistema de mapa
// MODELO DE FILAS: rows[0] = más cercano al launcher, rows[length-1] = más nuevo

(function(){
  const CFG = window.GAME_CONFIG;
  const PERSIST = window.PERSISTENCE;
  const MAP = window.MAP;

  window.COMBAT = {
    canvas: null,
    ctx: null,
    state: null,
    run: null,
    currentNode: null,
    W: 0, H: 0, DPR: 1,
    lastT: null,
    overlay: null,
    overlayTitle: null,
    overlayText: null,
    restartBtn: null,
    reviveBtn: null,
    menuBtn: null,

    init() {
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas.getContext('2d');
      this.overlay = document.getElementById('overlay');
      this.overlayTitle = document.getElementById('overlayTitle');
      this.overlayText = document.getElementById('overlayText');
      this.restartBtn = document.getElementById('restartBtn');
      this.reviveBtn = document.getElementById('reviveBtn');
      this.menuBtn = document.getElementById('menuBtn');

      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.setupInput();
      this.newGame();
      this.step(0);
    },

    initFromNode(node, run) {
      this.run = run;
      this.currentNode = node;
      this.init();
    },

    resize() {
      this.DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      this.W = rect.width;
      this.H = rect.height;
      this.canvas.width = this.W * this.DPR;
      this.canvas.height = this.H * this.DPR;
      this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    },

    newGame() {
      if (!this.run) {
        this.run = PERSIST.getCurrentRun();
      }

      const ROW_SPACING = CFG.BLOCK_H + CFG.ROW_GAP;

      this.state = {
        turn: 1,
        essence: 0,
        ballCount: this.run.ballCount,
        paddleX: this.W / 2,
        rows: [],
        balls: [],
        firing: false,
        aiming: false,
        aimDX: 0,
        aimDY: -1,
        gameOver: false,
        won: false,
        loseFrameRow: null,
        ROW_SPACING
      };

      // Sembramos filas iniciales
      for (let i = 0; i < 4; i++) {
        this.state.rows.push(this.spawnRow(i + 1));
      }

      this.overlay.style.display = 'none';
      this.updateHUD();
    },

    spawnRow(turn) {
      const d = CFG.difficultyForTurn(turn);
      const row = [];
      for (let c = 0; c < CFG.COLS; c++) {
        row[c] = 0;
      }
      const blockCount = Math.ceil(CFG.COLS * d.density);
      for (let i = 0; i < blockCount; i++) {
        row[Math.floor(Math.random() * CFG.COLS)] = Math.floor(
          d.minHp + Math.random() * (d.maxHp - d.minHp)
        );
      }
      return row;
    },

    updateHUD() {
      document.getElementById('essenceValue').textContent = this.state.essence;
      document.getElementById('turnValue').textContent = `${this.state.turn}/${CFG.TURNS_TO_SURVIVE}`;
      document.getElementById('ballsValue').textContent = this.state.ballCount;
    },

    colWidth() {
      return this.W / CFG.COLS;
    },

    rowY(rowIndex) {
      const dangerY = this.H - CFG.DANGER_Y_OFFSET;
      return dangerY - (rowIndex + 1) * this.state.ROW_SPACING;
    },

    getBlockRect(rowIndex, colIndex) {
      const cw = this.colWidth();
      const y = this.rowY(rowIndex);
      return { x: colIndex * cw + 3, y: y, w: cw - 6, h: CFG.BLOCK_H };
    },

    forEachBlock(cb) {
      for (let r = 0; r < this.state.rows.length; r++) {
        for (let c = 0; c < CFG.COLS; c++) {
          const hp = this.state.rows[r][c];
          if (hp > 0) cb(r, c, hp);
        }
      }
    },

    checkVictoryOnScreen() {
      return this.state.rows.every(row => row.every(v => v === 0));
    },

    advanceTurn() {
      const crossedRow = this.state.rows.shift();
      if (crossedRow && crossedRow.some(hp => hp > 0)) {
        this.state.loseFrameRow = crossedRow;
        this.endGame(false);
        return;
      }

      this.state.rows.push(this.spawnRow(this.state.turn + 1));
      this.state.turn += 1;
      this.updateHUD();

      if (this.state.turn > CFG.TURNS_TO_SURVIVE) {
        this.endGame(true);
      }
    },

    // INPUT
    setupInput() {
      let pointerActive = false;

      const pointerPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
      };

      const onDown = (e) => {
        if (this.state.firing || this.state.gameOver) return;
        pointerActive = true;
        this.state.aiming = true;
        this.updateAim(e);
      };

      const onMove = (e) => {
        if (pointerActive) this.updateAim(e);
      };

      const onUp = () => {
        if (!pointerActive) return;
        pointerActive = false;
        if (this.state.aiming && !this.state.firing && !this.state.gameOver) {
          this.fire();
        }
        this.state.aiming = false;
      };

      const updateAim = this.updateAim.bind(this);

      this.canvas.addEventListener('mousedown', onDown);
      this.canvas.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      this.canvas.addEventListener('touchstart', onDown, { passive: true });
      this.canvas.addEventListener('touchmove', onMove, { passive: true });
      this.canvas.addEventListener('touchend', onUp);

      // Botones de overlay
      if (this.restartBtn) {
        this.restartBtn.addEventListener('click', () => this.newGame());
      }

      if (this.reviveBtn) {
        this.reviveBtn.addEventListener('click', () => this.revive());
      }

      if (this.menuBtn) {
        this.menuBtn.addEventListener('click', () => this.returnToMap());
      }
    },

    updateAim(e) {
      const rect = this.canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      const p = { x: t.clientX - rect.left, y: t.clientY - rect.top };

      const paddleY = this.H - CFG.PADDLE_Y_OFFSET;
      let dx = p.x - this.state.paddleX;
      let dy = p.y - paddleY;
      if (dy > -20) dy = -20;

      const len = Math.hypot(dx, dy) || 1;
      this.state.aimDX = dx / len;
      this.state.aimDY = dy / len;
    },

    fire() {
      this.state.firing = true;
      const paddleY = this.H - CFG.PADDLE_Y_OFFSET;

      for (let i = 0; i < this.state.ballCount; i++) {
        const ball = {
          x: this.state.paddleX,
          y: paddleY,
          vx: this.state.aimDX * CFG.BALL_SPEED,
          vy: this.state.aimDY * CFG.BALL_SPEED,
          delay: i * CFG.LAUNCH_STAGGER,
          returned: false
        };
        this.state.balls.push(ball);
      }
    },

    resolveBallBlockCollision(ball) {
      for (let r = 0; r < this.state.rows.length; r++) {
        const y = this.rowY(r);
        if (y > this.H || y + CFG.BLOCK_H < 0) continue;

        for (let c = 0; c < CFG.COLS; c++) {
          const hp = this.state.rows[r][c];
          if (hp <= 0) continue;

          const rect = this.getBlockRect(r, c);
          if (
            ball.x + CFG.BALL_RADIUS > rect.x &&
            ball.x - CFG.BALL_RADIUS < rect.x + rect.w &&
            ball.y + CFG.BALL_RADIUS > rect.y &&
            ball.y - CFG.BALL_RADIUS < rect.y + rect.h
          ) {
            this.state.rows[r][c] -= 1;
            ball.vy *= -1;
            ball.y += ball.vy > 0 ? 4 : -4;

            if (this.state.rows[r][c] <= 0) {
              this.state.essence += hp;
              this.state.rows[r][c] = 0;
            }
            return true;
          }
        }
      }
      return false;
    },

    step(t) {
      if (this.lastT === null) this.lastT = t;
      let dt = Math.min((t - this.lastT) / 1000, 0.033);
      this.lastT = t;

      if (!this.state.gameOver) this.update(dt);
      this.draw();
      requestAnimationFrame((time) => this.step(time));
    },

    update(dt) {
      if (!this.state.firing) return;

      let allReturned = true;
      const paddleY = this.H - CFG.PADDLE_Y_OFFSET;

      for (const ball of this.state.balls) {
        ball.delay -= dt;
        if (ball.delay > 0) {
          allReturned = false;
          continue;
        }
        if (ball.returned) continue;

        allReturned = false;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x < CFG.BALL_RADIUS) {
          ball.x = CFG.BALL_RADIUS;
          ball.vx *= -1;
        }
        if (ball.x > this.W - CFG.BALL_RADIUS) {
          ball.x = this.W - CFG.BALL_RADIUS;
          ball.vx *= -1;
        }
        if (ball.y < CFG.BALL_RADIUS) {
          ball.y = CFG.BALL_RADIUS;
          ball.vy *= -1;
        }

        this.resolveBallBlockCollision(ball);

        if (ball.vy > 0 && ball.y >= paddleY) {
          ball.y = paddleY;
          ball.returned = true;
        }
      }

      if (allReturned) {
        this.state.firing = false;
        this.state.balls = [];

        if (this.checkVictoryOnScreen()) {
          this.state.essence += CFG.CLEAR_SCREEN_ESSENCE_BONUS;
          this.state.ballCount += CFG.CLEAR_SCREEN_BALL_BONUS;
        }
        this.advanceTurn();
      }
    },

    endGame(won) {
      this.state.gameOver = true;
      this.state.won = won;
      this.overlay.style.display = 'flex';

      if (won) {
        this.overlayTitle.textContent = 'Nodo superado';
        this.overlayText.textContent = `Sobreviviste ${CFG.TURNS_TO_SURVIVE} turnos. Esencia ganada: ${this.state.essence}`;
        this.restartBtn.textContent = 'Continuar al mapa';
        this.reviveBtn.style.display = 'none';

        // Actualizar estado del nodo en el mapa
        if (MAP && this.currentNode) {
          MAP.updateNodeState(this.currentNode.id, 'won');
          this.run.essence += this.state.essence;
          PERSIST.saveCurrentRun(this.run);
        }

        this.restartBtn.onclick = () => this.returnToMap();
      } else {
        this.overlayTitle.textContent = 'Derrota';
        this.overlayText.textContent = `Un bloque alcanzó el launcher en el turno ${this.state.turn}. Esencia obtenida: ${this.state.essence}`;
        this.restartBtn.textContent = 'Reintentar';
        this.reviveBtn.style.display = 'block';
        this.reviveBtn.textContent = 'Ver anuncio para revivir';

        // Actualizar estado del nodo en el mapa
        if (MAP && this.currentNode) {
          MAP.updateNodeState(this.currentNode.id, 'lost');
        }

        this.restartBtn.onclick = () => this.newGame();
        this.reviveBtn.onclick = () => this.reviveFromAd();
      }
    },

    revive() {
      // Placeholder: simular que el usuario vio un anuncio
      this.state.gameOver = false;
      this.overlay.style.display = 'none';
      this.state.turn += 1; // Le damos un turno extra
      this.updateHUD();
    },

    reviveFromAd() {
      // Aquí iría la integración con red de anuncios (Google Ads, ironSource, etc)
      console.log('Mostrar anuncio de revivir...');
      // Por ahora, simulamos que vio el anuncio
      setTimeout(() => this.revive(), 3000);
    },

    returnToMap() {
      this.lastT = null;
      if (MAP) {
        MAP.returnToMap();
      }
    },

    roundRect(x, y, w, h, r) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.W, this.H);

      const dangerY = this.H - CFG.DANGER_Y_OFFSET;

      // Línea de peligro
      ctx.save();
      ctx.strokeStyle = 'rgba(229,72,77,0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, dangerY);
      ctx.lineTo(this.W, dangerY);
      ctx.stroke();
      ctx.restore();

      // Dibujar bloques
      this.forEachBlock((r, c, hp) => {
        const rect = this.getBlockRect(r, c);
        if (rect.y > this.H + CFG.BLOCK_H || rect.y < -CFG.BLOCK_H) return;

        ctx.fillStyle = CFG.tierColorForHp(hp);
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.font = '600 15px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hp, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
      });

      // Dibujar paleta
      const paddleY = this.H - CFG.PADDLE_Y_OFFSET;
      ctx.fillStyle = '#ece8f2';
      this.roundRect(
        this.state.paddleX - CFG.PADDLE_WIDTH / 2,
        paddleY - 6,
        CFG.PADDLE_WIDTH,
        10,
        5
      );
      ctx.fill();

      // Línea de apuntamiento
      if (this.state.aiming && !this.state.firing) {
        ctx.save();
        ctx.strokeStyle = 'rgba(245,169,78,0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(this.state.paddleX, paddleY);
        ctx.lineTo(
          this.state.paddleX + this.state.aimDX * 300,
          paddleY + this.state.aimDY * 300
        );
        ctx.stroke();
        ctx.restore();
      }

      // Dibujar bolas
      for (const ball of this.state.balls) {
        if (ball.delay > 0) continue;
        ctx.fillStyle = '#f5a94e';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, CFG.BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  window.addEventListener('load', () => {
    if (document.getElementById('game')) {
      window.COMBAT.init();
    }
  });
})();
