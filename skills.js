// skills.js
// Sistema de árbol de poderes pasivos (Fase 2)
// Gestiona el desbloqueo y aplicación de habilidades pasivas

(function(){
  const CFG = window.GAME_CONFIG;
  const PERSIST = window.PERSISTENCE;

  window.SKILLS = {
    run: null,
    skillTree: [],
    unlockedSkills: [],

    init(run) {
      this.run = run;
      this.unlockedSkills = run.unlockedSkills || [];
      this.generateSkillTree();
    },

    // Generar árbol de habilidades con estructura de ramificaciones
    generateSkillTree() {
      this.skillTree = [];
      const rarities = Object.keys(CFG.SKILL_RARITIES);

      // Crear 3 ramas principales
      for (let branchIdx = 0; branchIdx < 3; branchIdx++) {
        const branch = {
          id: `branch-${branchIdx}`,
          name: this.getBranchName(branchIdx),
          color: this.getBranchColor(branchIdx),
          skills: []
        };

        // Cada rama tiene 3 niveles de profundidad
        for (let level = 0; level < 3; level++) {
          const skillsPerLevel = 2 + level; // crece de 2 a 4 skills por nivel
          const costMultiplier = level + 1; // costo aumenta por nivel

          for (let i = 0; i < skillsPerLevel; i++) {
            // Seleccionar rareza (más probable común en primeros niveles)
            let rarity = rarities[0]; // common por defecto
            if (level > 0 && Math.random() < 0.4) {
              rarity = rarities[Math.floor(Math.random() * rarities.length)];
            }

            const rarityCfg = CFG.SKILL_RARITIES[rarity];
            const skill = {
              id: `skill-${branchIdx}-${level}-${i}`,
              branchIdx,
              level,
              name: this.getRandomSkillName(rarity),
              rarity,
              cost: rarityCfg.costSkillPoints * costMultiplier,
              effect: this.getRandomEffect(),
              unlocked: false,
              requiredLevel: level > 0 ? level - 1 : -1, // requiere desbloquear nivel anterior
              description: `Mejora en ${branchIdx === 0 ? 'Bolas' : branchIdx === 1 ? 'Defensa' : 'Esencia'}`
            };

            branch.skills.push(skill);
          }
        }

        this.skillTree.push(branch);
      }
    },

    getBranchName(idx) {
      const names = ['🎯 Rama de Ofensa', '🛡️ Rama de Defensa', '✨ Rama de Esencia'];
      return names[idx] || 'Rama Desconocida';
    },

    getBranchColor(idx) {
      const colors = ['#f5a94e', '#7fd992', '#a06bf0'];
      return colors[idx] || '#8b87a0';
    },

    getRandomSkillName(rarity) {
      const commonNames = ['Velocidad Base', 'Precisión', 'Resistencia Menor'];
      const rareNames = ['Velocidad Media', 'Precisión Aguda', 'Resistencia Media'];
      const epicNames = ['Velocidad Mayor', 'Precisión Letal', 'Resistencia Fuerte'];
      const legendaryNames = ['Velocidad Absoluta', 'Precisión Infinita', 'Resistencia Perfecta'];

      const pools = {
        common: commonNames,
        rare: rareNames,
        epic: epicNames,
        legendary: legendaryNames
      };

      const pool = pools[rarity] || commonNames;
      return pool[Math.floor(Math.random() * pool.length)];
    },

    getRandomEffect() {
      const effects = [
        { type: 'ballCount', value: 1 },
        { type: 'ballSpeed', value: 1.1 },
        { type: 'essenceMultiplier', value: 1.05 },
        { type: 'goldMultiplier', value: 1.1 },
        { type: 'health', value: 1 },
        { type: 'penetration', value: true }
      ];
      return effects[Math.floor(Math.random() * effects.length)];
    },

    // Desbloquear habilidad
    unlockSkill(skillId) {
      const skill = this.findSkill(skillId);
      if (!skill) return false;

      // Validar costo
      if (this.run.skillPoints < skill.cost) {
        console.warn(`No hay suficientes puntos de skill. Costo: ${skill.cost}, Tienes: ${this.run.skillPoints}`);
        return false;
      }

      // Validar prerequisitos
      if (skill.requiredLevel >= 0) {
        const branch = this.skillTree[skill.branchIdx];
        const previousLevelSkills = branch.skills.filter(s => s.level === skill.level - 1);
        const hasPrerequisite = previousLevelSkills.some(s => this.isUnlocked(s.id));

        if (!hasPrerequisite) {
          console.warn('Debes desbloquear habilidades del nivel anterior primero');
          return false;
        }
      }

      // Desbloquear
      skill.unlocked = true;
      this.run.skillPoints -= skill.cost;
      this.unlockedSkills.push(skill);

      console.log(`✓ Habilidad desbloqueada: ${skill.name}`);
      PERSIST.saveCurrentRun(this.run);
      return true;
    },

    // Verificar si una habilidad está desbloqueada
    isUnlocked(skillId) {
      return this.unlockedSkills.some(s => s.id === skillId);
    },

    // Encontrar habilidad por ID
    findSkill(skillId) {
      for (const branch of this.skillTree) {
        const skill = branch.skills.find(s => s.id === skillId);
        if (skill) return skill;
      }
      return null;
    },

    // Aplicar efectos de todas las habilidades desbloqueadas
    applyAllEffects(gameState) {
      for (const skill of this.unlockedSkills) {
        this.applySkillEffect(skill, gameState);
      }
    },

    // Aplicar efecto de una habilidad individual
    applySkillEffect(skill, gameState) {
      switch (skill.effect.type) {
        case 'ballCount':
          gameState.ballCount += skill.effect.value;
          break;
        case 'ballSpeed':
          CFG.BALL_SPEED *= skill.effect.value;
          break;
        case 'essenceMultiplier':
          gameState.essenceMultiplier = (gameState.essenceMultiplier || 1) * skill.effect.value;
          break;
        case 'goldMultiplier':
          gameState.goldMultiplier = (gameState.goldMultiplier || 1) * skill.effect.value;
          break;
        case 'health':
          gameState.maxHealth = (gameState.maxHealth || 1) + skill.effect.value;
          break;
        case 'penetration':
          gameState.ballPenetration = true;
          break;
        default:
          console.warn(`Efecto desconocido: ${skill.effect.type}`);
      }
    },

    // Renderizar árbol de habilidades (para pantalla de skills futura)
    renderSkillTree(containerElement) {
      containerElement.innerHTML = '';

      for (const branch of this.skillTree) {
        const branchEl = document.createElement('div');
        branchEl.className = 'skill-branch';
        branchEl.style.borderColor = branch.color;

        const titleEl = document.createElement('h3');
        titleEl.textContent = branch.name;
        titleEl.style.color = branch.color;
        branchEl.appendChild(titleEl);

        // Agrupar skills por nivel
        for (let level = 0; level < 3; level++) {
          const levelSkills = branch.skills.filter(s => s.level === level);
          if (levelSkills.length === 0) continue;

          const levelEl = document.createElement('div');
          levelEl.className = 'skill-level';
          levelEl.innerHTML = `<span class="level-label">Nivel ${level + 1}</span>`;

          for (const skill of levelSkills) {
            const skillEl = this.createSkillElement(skill);
            levelEl.appendChild(skillEl);
          }

          branchEl.appendChild(levelEl);
        }

        containerElement.appendChild(branchEl);
      }
    },

    // Crear elemento HTML para una habilidad
    createSkillElement(skill) {
      const el = document.createElement('div');
      el.className = `skill-card ${skill.rarity}`;
      el.id = skill.id;

      const rarityColor = CFG.SKILL_RARITIES[skill.rarity].color;

      el.innerHTML = `
        <div class="skill-header" style="border-bottom-color: ${rarityColor}">
          <span class="skill-name">${skill.name}</span>
          <span class="skill-rarity" style="color: ${rarityColor}">${skill.rarity.toUpperCase()}</span>
        </div>
        <div class="skill-body">
          <p class="skill-description">${skill.description}</p>
          <p class="skill-cost">💜 Costo: ${skill.cost} puntos</p>
        </div>
        <button class="skill-unlock-btn" ${skill.unlocked ? 'disabled' : ''}>
          ${skill.unlocked ? '✓ Desbloqueado' : 'Desbloquear'}
        </button>
      `;

      if (!skill.unlocked) {
        const btn = el.querySelector('.skill-unlock-btn');
        btn.addEventListener('click', () => this.unlockSkill(skill.id));
      }

      return el;
    },

    // Obtener resumen de habilidades desbloqueadas
    getSummary() {
      return {
        totalUnlocked: this.unlockedSkills.length,
        byRarity: {
          common: this.unlockedSkills.filter(s => s.rarity === 'common').length,
          rare: this.unlockedSkills.filter(s => s.rarity === 'rare').length,
          epic: this.unlockedSkills.filter(s => s.rarity === 'epic').length,
          legendary: this.unlockedSkills.filter(s => s.rarity === 'legendary').length
        },
        skills: this.unlockedSkills.map(s => ({ name: s.name, rarity: s.rarity }))
      };
    }
  };
})();
