// config.js
// Todos los números de balance del juego viven aquí.
// Idea (GDD Sección 6): facilita rebalancear sin tocar la lógica.

window.GAME_CONFIG = {
  // --- COMBATE (Sección 3) ---
  COLS: 7,
  TURNS_TO_SURVIVE: 12,
  STARTING_BALLS: 3,
  BLOCK_H: 34,
  ROW_GAP: 4,
  BALL_RADIUS: 5,
  PADDLE_Y_OFFSET: 70,
  DANGER_Y_OFFSET: 46,
  PADDLE_WIDTH: 52,
  BALL_SPEED: 480,
  LAUNCH_STAGGER: 0.05,

  difficultyForTurn(turn) {
    return {
      minHp: 2 + Math.floor(turn / 2),
      maxHp: 6 + turn,
      density: Math.min(0.85, 0.5 + turn * 0.02)
    };
  },

  CLEAR_SCREEN_ESSENCE_BONUS: 20,
  CLEAR_SCREEN_BALL_BONUS: 1,

  TIER_COLORS: {
    low: '#4f8ff7',
    mid: '#a06bf0',
    high: '#f0577a',
    extreme: '#f5c451'
  },
  tierColorForHp(hp) {
    if (hp <= 3) return this.TIER_COLORS.low;
    if (hp <= 7) return this.TIER_COLORS.mid;
    if (hp <= 12) return this.TIER_COLORS.high;
    return this.TIER_COLORS.extreme;
  },

  // --- MAPA Y PROGRESIÓN (Sección 2, 5) ---
  LEVELS: [
    { name: 'Level 1', nodeCount: 10, difficulty: 1 },
    { name: 'Level 2', nodeCount: 15, difficulty: 2 },
    { name: 'Level 3', nodeCount: 20, difficulty: 3 }
  ],

  // Probabilidad de que un nodo sea tienda (0.0 a 1.0)
  SHOP_NODE_CHANCE: 0.15,

  // Recompensas por superar un nodo de combate (base, aumenta con nodos superados)
  getNodeReward(nodeIndex, level) {
    const baseGold = 50 + (nodeIndex * 10) + (level * 30);
    const skillPoints = 1;
    return { gold: baseGold, skillPoints, trinket: null };
  },

  // --- HABILIDADES / ÁRBOL DE PODERES (Sección 4.1, 4.2) ---
  SKILL_RARITIES: {
    common: { color: '#8b87a0', costSkillPoints: 1, chance: 0.50 },
    rare: { color: '#7fd992', costSkillPoints: 1, chance: 0.30 },
    epic: { color: '#a06bf0', costSkillPoints: 2, chance: 0.15 },
    legendary: { color: '#f5c451', costSkillPoints: 3, chance: 0.05 }
  },

  SKILL_POOL: [
    // COMÚN
    { name: 'Bolas +1', rarity: 'common', effect: 'ballCount', value: 1, description: 'Ganas 1 bola extra' },
    { name: 'Velocidad +10%', rarity: 'common', effect: 'ballSpeed', value: 1.10, description: 'Las bolas vuelan 10% más rápido' },
    { name: 'Esencia +5%', rarity: 'common', effect: 'essenceMultiplier', value: 1.05, description: 'Ganas 5% más esencia de bloques' },

    // RARO
    { name: 'Penetración', rarity: 'rare', effect: 'ballPenetration', value: true, description: 'Las bolas atraviesan bloques' },
    { name: 'Ricochete', rarity: 'rare', effect: 'ballRicochet', value: 2, description: 'Las bolas rebotan 2 veces más' },
    { name: 'Oro +15%', rarity: 'rare', effect: 'goldMultiplier', value: 1.15, description: 'Ganas 15% más oro' },

    // ÉPICO
    { name: 'Bolas Dobles', rarity: 'epic', effect: 'doubleShot', value: true, description: 'Dispara 2 enjambres por turno' },
    { name: 'Escudo', rarity: 'epic', effect: 'shield', value: 1, description: 'Sobrevive 1 turno extra si un bloque cruza' },

    // LEGENDARIO
    { name: 'Destrucción Total', rarity: 'legendary', effect: 'instantClear', value: 0.5, description: 'Cada 2 turnos, limpia la pantalla' },
    { name: 'Inmortal', rarity: 'legendary', effect: 'immortal', value: 1, description: 'No puedes perder (1 vida)" }
  ],

  // --- TRINKETS (Objetos que dropean al superar nodos) ---
  TRINKET_POOL: [
    { name: 'Anillo de Esencia', effect: 'essenceMultiplier', value: 1.08 },
    { name: 'Gema de Velocidad', effect: 'ballSpeed', value: 1.12 },
    { name: 'Moneda Dorada', effect: 'goldMultiplier', value: 1.20 }
  ],

  // --- TIENDA ---
  SHOP_ITEMS: [
    { name: 'Punto de Skill', type: 'skillPoint', cost: 30 },
    { name: 'Trinket Aleatorio', type: 'trinket', cost: 50 }
  ]
};
