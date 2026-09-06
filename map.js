// map.js
// Sistema de mapa de nodos (Fase 1)
// Gestiona la navegación entre nodos, estructura de niveles, y transiciones

(function(){
  const CFG = window.GAME_CONFIG;
  const PERSIST = window.PERSISTENCE;

  window.MAP = {
    canvas: null,
    ctx: null,
    run: null,
    currentNode: null,
    W: 0, H: 0, DPR: 1,
    nodes: [],
    camera: { x: 0, y: 0, zoom: 1 },
    selectedNodeId: null,
    isTransitioning: false,

    init(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = this.canvas.getContext('2d');
      
      this.run = PERSIST.getCurrentRun();
      if (!this.run) {
        this.run = PERSIST.createNewRun();
      }

      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.setupInput();
      this.generateNodes();
      this.draw();
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

    // Generar estructura de nodos por nivel
    generateNodes() {
      this.nodes = [];
      let nodeId = 0;

      for (let levelIdx = 0; levelIdx < CFG.LEVELS.length; levelIdx++) {
        const level = CFG.LEVELS[levelIdx];
        const levelY = levelIdx * 200 + 100;

        // Nodos obligatorios de este nivel
        for (let nodeIdx = 0; nodeIdx < level.nodeCount; nodeIdx++) {
          const isPreviousNodeCleared = nodeIdx === 0 || 
            this.run.nodeStates[nodeId - 1] === 'won';
          
          const isShopNode = Math.random() < CFG.SHOP_NODE_CHANCE;
          const nodeType = isShopNode ? 'shop' : 'combat';
          
          const node = {
            id: nodeId,
            levelIdx,
            nodeIdx,
            type: nodeType,
            x: (nodeIdx % 5) * 100 + 50,
            y: levelY + Math.floor(nodeIdx / 5) * 80,
            state: this.run.nodeStates[nodeId] || 'pending',
            reward: this.getNodeReward(nodeId, levelIdx),
            unlocked: isPreviousNodeCleared || nodeId === 0
          };

          this.nodes.push(node);
          nodeId++;
        }
      }

      // Conectar nodos a la estructura de la run
      for (let node of this.nodes) {
        if (!this.run.nodeStates[node.id]) {
          this.run.nodeStates[node.id] = node.state;
        }
      }

      PERSIST.saveCurrentRun(this.run);
    },

    getNodeReward(nodeId, levelIdx) {
      return CFG.getNodeReward(nodeId, levelIdx);
    },

    setupInput() {
      const handlePointer = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        const x = t.clientX - rect.left;
        const y = t.clientY - rect.top;

        const clicked = this.nodes.find(node => 
          Math.hypot(node.x - x, node.y - y) < 35
        );

        if (clicked && clicked.unlocked && clicked.state === 'pending') {
          this.selectNode(clicked);
        }
      };

      this.canvas.addEventListener('click', handlePointer);
      this.canvas.addEventListener('touchend', handlePointer, { passive: true });
    },

    selectNode(node) {
      this.selectedNodeId = node.id;
      this.currentNode = node;

      // Transición a pantalla de combate/tienda
      if (node.type === 'combat') {
        setTimeout(() => this.enterCombat(node), 300);
      } else if (node.type === 'shop') {
        setTimeout(() => this.enterShop(node), 300);
      }
    },

    enterCombat(node) {
      // Cambiar a vista de combate
      document.getElementById('map-screen').style.display = 'none';
      document.getElementById('combat-screen').style.display = 'flex';
      
      // Iniciar combate con dificultad ajustada al nodo
      if (window.COMBAT) {
        window.COMBAT.initFromNode(node, this.run);
      }
    },

    enterShop(node) {
      // Cambiar a vista de tienda
      document.getElementById('map-screen').style.display = 'none';
      document.getElementById('shop-screen').style.display = 'flex';
      
      if (window.SHOP) {
        window.SHOP.initFromNode(node, this.run);
      }
    },

    // Actualizar estado del nodo después de combate
    updateNodeState(nodeId, result) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (!node) return;

      if (result === 'won') {
        node.state = 'won';
        this.run.nodeStates[nodeId] = 'won';
        this.run.totalNodesCompleted++;
        
        // Desbloquear próximo nodo
        const nextNode = this.nodes.find(n => n.id === nodeId + 1);
        if (nextNode) {
          nextNode.unlocked = true;
        }

        // Sumar recompensas
        this.run.gold += node.reward.gold;
        this.run.skillPoints += node.reward.skillPoints;

      } else if (result === 'lost') {
        node.state = 'lost';
        this.run.nodeStates[nodeId] = 'lost';
      }

      PERSIST.saveCurrentRun(this.run);
    },

    // Volver al mapa desde combate
    returnToMap() {
      document.getElementById('combat-screen').style.display = 'none';
      document.getElementById('map-screen').style.display = 'flex';
      this.selectedNodeId = null;
      this.draw();
    },

    draw() {
      const ctx = this.ctx;
      ctx.fillStyle = window.GAME_CONFIG ? window.GAME_CONFIG.TIER_COLORS?.low || '#12111a' : '#12111a';
      ctx.clearRect(0, 0, this.W, this.H);

      // Dibujar fondo
      ctx.fillStyle = '#12111a';
      ctx.fillRect(0, 0, this.W, this.H);

      // Dibujar HUD superior
      this.drawHUD();

      // Dibujar nodos
      for (const node of this.nodes) {
        this.drawNode(node);
      }

      // Dibujar líneas de conexión entre nodos
      this.drawConnections();

      requestAnimationFrame(() => this.draw());
    },

    drawHUD() {
      const ctx = this.ctx;
      ctx.fillStyle = '#ece8f2';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';

      const y = 25;
      const gap = 150;

      ctx.fillText(`Level ${this.run.level}/3`, 20, y);
      ctx.fillText(`Gold: ${this.run.gold}`, 20 + gap, y);
      ctx.fillText(`Skill Points: ${this.run.skillPoints}`, 20 + gap * 2, y);
      ctx.fillText(`Balls: ${this.run.ballCount}`, 20 + gap * 3, y);
    },

    drawNode(node) {
      const ctx = this.ctx;
      const radius = 32;

      // Colores por estado
      let color = '#4f8ff7'; // default (pending)
      if (node.state === 'won') color = '#7fd992';
      if (node.state === 'lost') color = '#e5484d';
      if (!node.unlocked) color = '#3a3847';
      if (node.type === 'shop') color = '#f5a94e';

      // Dibujar círculo del nodo
      ctx.fillStyle = color;
      ctx.globalAlpha = node.unlocked ? 1 : 0.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Borde si está seleccionado
      if (node.id === this.selectedNodeId) {
        ctx.strokeStyle = '#ece8f2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Texto dentro del nodo
      ctx.fillStyle = '#1c1204';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (node.type === 'shop') {
        ctx.fillText('$', node.x, node.y);
      } else {
        ctx.fillText(node.nodeIdx + 1, node.x, node.y);
      }

      // Indicador de estado
      if (node.state === 'won') {
        ctx.fillStyle = '#7fd992';
        ctx.fillText('✓', node.x + 20, node.y - 20);
      } else if (node.state === 'lost') {
        ctx.fillStyle = '#e5484d';
        ctx.fillText('✗', node.x + 20, node.y - 20);
      }
    },

    drawConnections() {
      const ctx = this.ctx;
      ctx.strokeStyle = 'rgba(139, 135, 160, 0.3)';
      ctx.lineWidth = 2;

      for (let i = 0; i < this.nodes.length - 1; i++) {
        const current = this.nodes[i];
        const next = this.nodes[i + 1];

        if (current.levelIdx === next.levelIdx) {
          ctx.beginPath();
          ctx.moveTo(current.x, current.y);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
        }
      }
    },

    // Revelar habilidades disponibles
    getAvailableSkills() {
      const available = [];
      const rearities = Object.keys(CFG.SKILL_RARITIES);

      for (let i = 0; i < 3; i++) {
        const rarity = rearities[Math.floor(Math.random() * rearities.length)];
        const skillsOfRarity = CFG.SKILL_POOL.filter(s => s.rarity === rarity);
        const skill = skillsOfRarity[Math.floor(Math.random() * skillsOfRarity.length)];
        available.push(skill);
      }

      return available;
    }
  };

  window.addEventListener('load', () => {
    const mapCanvas = document.getElementById('map-canvas');
    if (mapCanvas) {
      window.MAP.init(mapCanvas);
    }
  });
})();
