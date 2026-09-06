// fusion.js
// Sistema de fusión de bolas con elementos (Fase 2)
// Implementa colisiones elemento-bloque con efectos especiales

(function(){
  const CFG = window.GAME_CONFIG;

  window.FUSION = {
    ELEMENTS: {
      fire: {
        name: 'Fuego',
        color: '#f0577a',
        symbol: '🔥',
        damageMultiplier: 1.5,
        effectRange: 40, // aoe pequeño
        effect: 'burn' // daño adicional a bloques cercanos
      },
      electric: {
        name: 'Eléctrico',
        color: '#f5c451',
        symbol: '⚡',
        damageMultiplier: 1.2,
        effectRange: 80, // aoe más grande
        effect: 'chain' // salta a bloques cercanos
      },
      ice: {
        name: 'Hielo',
        color: '#4f8ff7',
        symbol: '❄️',
        damageMultiplier: 1.3,
        effectRange: 0,
        effect: 'slow' // ralentiza bloques
      },
      nature: {
        name: 'Naturaleza',
        color: '#7fd992',
        symbol: '🌿',
        damageMultiplier: 1.1,
        effectRange: 50,
        effect: 'heal' // restaura vidas (raro)
      },
      void: {
        name: 'Vacío',
        color: '#a06bf0',
        symbol: '◾',
        damageMultiplier: 2.0,
        effectRange: 0,
        effect: 'pierce' // ignora defensa
      }
    },

    // Crear una bola con elemento
    createElementalBall(x, y, vx, vy, element = null) {
      const ball = {
        x, y, vx, vy,
        delay: 0,
        returned: false,
        element: element || this.getRandomElement(),
        fusion: 0, // nivel de fusión (cuántas bolas del mismo elemento se han combinado)
        radius: CFG.BALL_RADIUS
      };
      return ball;
    },

    // Obtener elemento aleatorio
    getRandomElement() {
      const elements = Object.keys(this.ELEMENTS);
      const randomElement = elements[Math.floor(Math.random() * elements.length)];
      return randomElement;
    },

    // Fusionar dos bolas
    fuse(ball1, ball2) {
      // Si son del mismo elemento, aumentar fusion level
      if (ball1.element === ball2.element) {
        ball1.fusion = Math.min((ball1.fusion || 0) + 1, 3); // máximo nivel 3
        ball1.radius = CFG.BALL_RADIUS + (ball1.fusion * 2); // aumentar tamaño
        return ball1;
      }

      // Crear elemento "fusion" (elemento neutral que hereda efectos de ambos)
      // Para simplificar, la bola toma el elemento del más fuerte
      const elementalPower = {
        fire: 2, electric: 2, ice: 1.5, nature: 1, void: 3
      };

      const power1 = elementalPower[ball1.element] || 1;
      const power2 = elementalPower[ball2.element] || 1;

      if (power1 > power2) {
        return ball1;
      } else {
        return ball2;
      }
    },

    // Resolver colisión bola-bloque con elemento
    resolveBallBlockCollisionWithElement(ball, block, blockHp, row, col) {
      const element = this.ELEMENTS[ball.element];
      if (!element) return blockHp;

      let damageDealt = 1; // daño base
      let totalDamage = Math.ceil(damageDealt * element.damageMultiplier);

      // Aplicar efecto de fusión
      if (ball.fusion > 0) {
        totalDamage += ball.fusion; // daño extra por nivel de fusión
      }

      // Reducir HP del bloque
      blockHp -= totalDamage;

      // Aplicar efectos especiales por elemento
      switch (element.effect) {
        case 'burn':
          this.applyBurnEffect(row, col, element.effectRange);
          break;
        case 'chain':
          this.applyChainEffect(row, col, element.effectRange);
          break;
        case 'slow':
          // Ralentizar descenso de bloques (para futuro)
          console.log('⚡ Efecto Slow aplicado');
          break;
        case 'pierce':
          // Ignorar defensa (ya está hecho por multplicador alto)
          break;
      }

      return Math.max(blockHp, 0);
    },

    // Efecto Burn: daño a bloques cercanos
    applyBurnEffect(centerRow, centerCol, range) {
      const gameState = window.COMBAT?.state;
      if (!gameState || !gameState.rows) return;

      for (let r = 0; r < gameState.rows.length; r++) {
        for (let c = 0; c < CFG.COLS; c++) {
          const distance = Math.hypot(r - centerRow, c - centerCol);
          if (distance < range / 40 && gameState.rows[r][c] > 0) {
            gameState.rows[r][c] -= 1; // daño splash
          }
        }
      }
    },

    // Efecto Chain: salta a bloques cercanos
    applyChainEffect(centerRow, centerCol, range) {
      const gameState = window.COMBAT?.state;
      if (!gameState || !gameState.rows) return;

      const targets = [];
      for (let r = 0; r < gameState.rows.length; r++) {
        for (let c = 0; c < CFG.COLS; c++) {
          if (gameState.rows[r][c] > 0) {
            const distance = Math.hypot(r - centerRow, c - centerCol);
            if (distance < range / 40) {
              targets.push({ r, c });
            }
          }
        }
      }

      // Saltar a máximo 2 bloques cercanos
      const chainsToApply = Math.min(targets.length, 2);
      for (let i = 0; i < chainsToApply; i++) {
        const target = targets[i];
        gameState.rows[target.r][target.c] -= 1;
      }
    },

    // Renderizar bola con color de elemento
    drawElementalBall(ctx, ball) {
      const element = this.ELEMENTS[ball.element];
      if (!element) {
        ctx.fillStyle = '#f5a94e';
      } else {
        ctx.fillStyle = element.color;
      }

      // Dibujar círculo principal
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Dibujar borde con color más oscuro
      ctx.strokeStyle = this.darkenColor(element?.color || '#f5a94e', 0.7);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dibujar símbolo del elemento
      if (element) {
        ctx.fillStyle = '#000000';
        ctx.font = `${Math.max(8, ball.radius - 2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(element.symbol, ball.x, ball.y);
      }

      // Si tiene fusion, mostrar nivel
      if (ball.fusion > 0) {
        ctx.fillStyle = '#ece8f2';
        ctx.font = `bold ${ball.radius}px sans-serif`;
        ctx.fillText(`+${ball.fusion}`, ball.x + ball.radius + 3, ball.y - ball.radius - 3);
      }
    },

    // Oscurecer color (para bordes)
    darkenColor(color, factor) {
      const hex = color.replace('#', '');
      const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * factor);
      const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * factor);
      const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * factor);
      return `rgb(${r},${g},${b})`;
    },

    // Obtener información de elemento para UI
    getElementInfo(element) {
      const el = this.ELEMENTS[element];
      if (!el) return null;

      return {
        name: el.name,
        color: el.color,
        symbol: el.symbol,
        damageMultiplier: el.damageMultiplier,
        effect: el.effect,
        description: this.getEffectDescription(el.effect)
      };
    },

    getEffectDescription(effect) {
      const descriptions = {
        burn: 'Daña bloques cercanos',
        chain: 'Salta a bloques próximos',
        slow: 'Ralentiza bloques enemigos',
        heal: 'Restaura salud (raro)',
        pierce: 'Ignora defensa de bloques'
      };
      return descriptions[effect] || 'Efecto especial';
    },

    // Generar bola elemental cuando se dispara
    generateElementalShot(ballCount, paddleX, paddleY, aimDX, aimDY) {
      const balls = [];

      for (let i = 0; i < ballCount; i++) {
        const ball = this.createElementalBall(
          paddleX,
          paddleY,
          aimDX * CFG.BALL_SPEED,
          aimDY * CFG.BALL_SPEED,
          this.getRandomElement()
        );
        ball.delay = i * CFG.LAUNCH_STAGGER;
        balls.push(ball);
      }

      return balls;
    }
  };
})();
