window.PERSISTENCE = {
  KEYS: {
    CURRENT_RUN: 'bbtan_current_run',
    RUNS_HISTORY: 'bbtan_runs_history',
    SETTINGS: 'bbtan_settings'
  },

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
      nodeStates: {},
      totalNodesCompleted: 0,
      lives: 1
    };
    this.saveCurrentRun(run);
    return run;
  },

  getCurrentRun() {
    try {
      const data = localStorage.getItem(this.KEYS.CURRENT_RUN);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('No se pudo leer la run actual', error);
      return null;
    }
  },

  saveCurrentRun(run) {
    try {
      localStorage.setItem(this.KEYS.CURRENT_RUN, JSON.stringify(run));
    } catch (error) {
      console.warn('No se pudo guardar la run actual', error);
    }
  },

  finishRun(run, result) {
    run.finishedAt = new Date().toISOString();
    run.result = result;
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

  getRunsHistory() {
    try {
      const data = localStorage.getItem(this.KEYS.RUNS_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('No se pudo leer el historial', error);
      return [];
    }
  },

  clearCurrentRun() {
    localStorage.removeItem(this.KEYS.CURRENT_RUN);
  }
};
