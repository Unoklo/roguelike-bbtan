// shop.js
// Sistema de tienda mística (Fase 1)
// Permite comprar skill points y trinkets con oro

(function(){
  const CFG = window.GAME_CONFIG;
  const PERSIST = window.PERSISTENCE;
  const MAP = window.MAP;

  window.SHOP = {
    run: null,
    currentNode: null,
    shopItems: [],

    initFromNode(node, run) {
      this.run = run;
      this.currentNode = node;
      this.generateShopItems();
      this.render();
      this.setupInput();
    },

    generateShopItems() {
      this.shopItems = [];

      // Generar 4-6 items aleatorios
      const itemCount = 4 + Math.floor(Math.random() * 3);

      for (let i = 0; i < itemCount; i++) {
        // Decidir si es skill point o trinket
        const isSkillPoint = Math.random() < 0.6;

        if (isSkillPoint) {
          this.shopItems.push({
            id: `sp-${i}`,
            type: 'skillPoint',
            name: 'Punto de Skill',
            description: 'Desbloquea nuevas habilidades',
            cost: 30,
            icon: '⭐'
          });
        } else {
          // Seleccionar un trinket aleatorio
          const trinket = CFG.TRINKET_POOL[Math.floor(Math.random() * CFG.TRINKET_POOL.length)];
          this.shopItems.push({
            id: `trinket-${i}`,
            type: 'trinket',
            name: trinket.name,
            description: this.getTrinketDescription(trinket.effect, trinket.value),
            cost: 50,
            effect: trinket.effect,
            value: trinket.value,
            icon: '💎'
          });
        }
      }
    },

    getTrinketDescription(effect, value) {
      const descriptions = {
        essenceMultiplier: `+${Math.round((value - 1) * 100)}% esencia`,
        ballSpeed: `+${Math.round((value - 1) * 100)}% velocidad`,
        goldMultiplier: `+${Math.round((value - 1) * 100)}% oro`
      };
      return descriptions[effect] || 'Efecto especial';
    },

    render() {
      const shopGold = document.getElementById('shop-gold');
      const shopItemsContainer = document.getElementById('shop-items');

      // Mostrar oro actual
      shopGold.textContent = this.run.gold;

      // Limpiar items anteriores
      shopItemsContainer.innerHTML = '';

      // Renderizar items
      for (const item of this.shopItems) {
        const itemEl = document.createElement('div');
        itemEl.className = 'shop-item';
        itemEl.id = item.id;

        const canAfford = this.run.gold >= item.cost;
        if (!canAfford) {
          itemEl.classList.add('disabled');
        }

        itemEl.innerHTML = `
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-description" style="font-size: 11px; color: var(--text-dim);">${item.description}</div>
          <div class="shop-item-cost">💰 ${item.cost} oro</div>
        `;

        if (canAfford) {
          itemEl.addEventListener('click', () => this.buyItem(item));
        }

        shopItemsContainer.appendChild(itemEl);
      }
    },

    buyItem(item) {
      if (this.run.gold < item.cost) {
        alert('No tienes suficiente oro');
        return;
      }

      // Gastar oro
      this.run.gold -= item.cost;

      if (item.type === 'skillPoint') {
        this.run.skillPoints += 1;
        console.log('✓ Compraste un punto de skill');
      } else if (item.type === 'trinket') {
        // Agregar trinket al inventario
        if (!this.run.activeTrinkets) {
          this.run.activeTrinkets = [];
        }
        this.run.activeTrinkets.push({
          name: item.name,
          effect: item.effect,
          value: item.value
        });
        console.log(`✓ Compraste: ${item.name}`);
      }

      // Guardar cambios
      PERSIST.saveCurrentRun(this.run);

      // Actualizar mapa si existe
      if (MAP) {
        MAP.run = this.run;
      }

      // Renderizar de nuevo
      this.render();
    },

    setupInput() {
      const exitBtn = document.getElementById('shop-exit');
      if (exitBtn) {
        exitBtn.addEventListener('click', () => this.returnToMap());
      }
    },

    returnToMap() {
      document.getElementById('shop-screen').style.display = 'none';
      document.getElementById('map-screen').style.display = 'flex';

      // Actualizar estado del nodo como visitado (pero no ganado)
      if (MAP && this.currentNode) {
        const node = MAP.nodes.find(n => n.id === this.currentNode.id);
        if (node) {
          node.state = 'visited';
          MAP.run.nodeStates[this.currentNode.id] = 'visited';

          // Desbloquear próximo nodo
          const nextNode = MAP.nodes.find(n => n.id === this.currentNode.id + 1);
          if (nextNode) {
            nextNode.unlocked = true;
          }
        }
      }

      PERSIST.saveCurrentRun(this.run);
      MAP.draw();
    }
  };
})();
