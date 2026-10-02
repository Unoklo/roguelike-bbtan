(function(){
  const CFG = window.GAME_CONFIG;
  const PERSIST = window.PERSISTENCE;

  function getEffectConfigByKey(type){
    if (!CFG.SKILL_POOL) return null;
    return CFG.SKILL_POOL.find(skill => skill.effect === type) || null;
  }

  function normalizeSkillData(skill){
    if (!skill) return null;
    if (skill.effect && typeof skill.effect === 'object') return skill;
    const poolSkill = getEffectConfigByKey(skill.effectType || skill.effect || skill.type);
    if (!poolSkill) return skill;
    return {
      ...skill,
      effect: {
        type: poolSkill.effect,
        value: poolSkill.value,
        description: poolSkill.description,
        name: poolSkill.name,
        rarity: poolSkill.rarity
      }
    };
  }

  window.SKILLS = {
    run: null,
    skillTree: [],
    unlockedSkills: [],

    init(run) {
      this.run = run;
      this.unlockedSkills = Array.isArray(run.unlockedSkills) ? run.unlockedSkills : [];
      this.generateSkillTree();
    },

    generateSkillTree() {
      this.skillTree = [];
      const branchDefinitions = [
        { id: 'offense', name: '🎯 Rama de Ofensa', color: '#f5a94e' },
        { id: 'defense', name: '🛡️ Rama de Defensa', color: '#7fd992' },
        { id: 'essence', name: '✨ Rama de Esencia', color: '#a06bf0' }
      ];

      for (let branchIdx = 0; branchIdx < branchDefinitions.length; branchIdx++) {
        const branchDef = branchDefinitions[branchIdx];
        const branch = {
          id: branchDef.id,
          name: branchDef.name,
          color: branchDef.color,
          skills: []
        };

        for (let level = 0; level < 3; level++) {
          const skillsPerLevel = 2 + level;
          for (let i = 0; i < skillsPerLevel; i++) {
            const poolOption = CFG.SKILL_POOL[Math.floor(Math.random() * CFG.SKILL_POOL.length)];
            const skill = {
              id: `skill-${branchDef.id}-${level}-${i}`,
              branchIdx,
              level,
              name: poolOption.name,
              rarity: poolOption.rarity,
              cost: CFG.SKILL_RARITIES[poolOption.rarity].costSkillPoints * (level + 1),
              effect: { type: poolOption.effect, value: poolOption.value },
              unlocked: false,
              requiredLevel: level > 0 ? level - 1 : -1,
              description: poolOption.description
            };
            branch.skills.push(skill);
          }
        }
        this.skillTree.push(branch);
      }
    },

    unlockSkill(skillId) {
      const skill = this.findSkill(skillId);
      if (!skill) return false;

      if (this.run.skillPoints < skill.cost) {
        console.warn('No hay suficientes puntos de skill');
        return false;
      }

      if (skill.requiredLevel >= 0) {
        const branch = this.skillTree[skill.branchIdx];
        const previousLevelSkills = branch.skills.filter(s => s.level === skill.level - 1);
        const hasPrereq = previousLevelSkills.some(s => this.isUnlocked(s.id));
        if (!hasPrereq) {
          console.warn('Debes desbloquear la rama previa primero');
          return false;
        }
      }

      skill.unlocked = true;
      this.run.skillPoints -= skill.cost;
      this.unlockedSkills.push(skill);
      PERSIST.saveCurrentRun(this.run);
      return true;
    },

    isUnlocked(skillId) {
      return this.unlockedSkills.some(s => s.id === skillId);
    },

    findSkill(skillId) {
      for (const branch of this.skillTree) {
        const skill = branch.skills.find(s => s.id === skillId);
        if (skill) return skill;
      }
      return null;
    },

    applyAllEffects(gameState) {
      for (const skill of this.unlockedSkills) {
        this.applySkillEffect(skill, gameState);
      }
    },

    applySkillEffect(skill, gameState) {
      const normalized = normalizeSkillData(skill);
      if (!normalized || !normalized.effect) return;
      const { type, value } = normalized.effect;

      switch (type) {
        case 'ballCount':
          gameState.ballCount += value;
          break;
        case 'ballSpeed':
          gameState.ballSpeedMultiplier = (gameState.ballSpeedMultiplier || 1) * value;
          break;
        case 'essenceMultiplier':
          gameState.essenceMultiplier = (gameState.essenceMultiplier || 1) * value;
          break;
        case 'goldMultiplier':
          gameState.goldMultiplier = (gameState.goldMultiplier || 1) * value;
          break;
        case 'health':
          gameState.maxHealth = (gameState.maxHealth || 1) + value;
          break;
        case 'penetration':
        case 'ballPenetration':
          gameState.ballPenetration = true;
          break;
        default:
          console.warn(`Efecto desconocido: ${type}`);
      }
    }
  };
})();
