// persistence.js
// Sistema de guardado en localStorage para runs persistentes

window.PERSISTENCE = {
  KEYS: {
    CURRENT_RUN: 'bbtan_current_run',
    RUNS_HISTORY: 'bbtan_runs_history',
    SETTINGS: 'bbtan_settings'
  },

  // Crear una nueva run
  createNewRun() {
    const run = {
      id: Date.now(),
      startedAt: new Date().toISOString(),
      level: 1,
      currentNodeIndex: 0,
      gold: 0,
      essence: 0,
      skillPoints: 0,
      ballCount: window.GAME_CONFIG.STARTING_BALLS,
      activeTrinkets: [],
      unlockedSkills: [],
      nodeStates: {}, // { nodeId: 'pending' | 'won' | 'lost' | 'shop' }
      totalNodesCompleted: 0,
      lives: 1
    };
    this.saveCurrentRun(run);
    return run;
  },

  // Obtener run actual
  getCurrentRun() {
    const data = localStorage.getItem(this.KEYS.CURRENT_RUN);
    return data ? JSON.parse(data) : null;
  },

  // Guardar run actual
  saveCurrentRun(run) {
    localStorage.setItem(this.KEYS.CURRENT_RUN, JSON.stringify(run));
  },

  // Finalizar run (guardar en historial)
  finishRun(run, result) {
    run.finishedAt = new Date().toISOString();
    run.result = result; // 'completed' | 'gameover'
    run.finalStats = {
      totalGold: run.gold,
      totalEssence: run.essence,
      nodesCleared: run.totalNodesCompleted,
      skillPointsUsed: run.unlockedSkills.length
    };
    
    const history = this.getRunsHistory();
    history.push(run);
    localStorage.setItem(this.KEYS.RUNS_HISTORY, JSON.stringify(history));
    localStorage.removeItem(this.KEYS.CURRENT_RUN);
    
    return run;
  },

  // Obtener historial de runs
  getRunsHistory() {
    const data = localStorage.getItem(this.KEYS.RUNS_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  // Limpiar run actual (para empezar una nueva)
  clearCurrentRun() {
    localStorage.removeItem(this.KEYS.CURRENT_RUN);
  }
};
