class PlayerQueue {
  // string[]
  players = [];
  configure(db, wsApp) {
    this.db = db;
    this.wsApp = wsApp;
  }

  constructor() {
    (async () => {
      for (;;) {
        await this.buildMatches();
        await new Promise((r) => setTimeout(r, 1000));
      }
    })();
  }

  add(id) {
    this.players.push(id);
  }

  remove(id) {
    this.players = this.players.filter((v) => v !== id);
  }

  async buildMatches() {
    while (this.players.length >= 2) {
      const white = this.players.pop();
      const black = this.players.pop();
      const game = await this.db.create("Game", {
        white,
        white,
      });
      this.wsApp.broadcast("newGame", {
        gameId: game._id,
        white,
        black,
      });
    }
  }
}

export default new PlayerQueue();
