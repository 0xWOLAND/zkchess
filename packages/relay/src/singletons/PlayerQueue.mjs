class PlayerQueue {
  // string[]
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

  async get(_id) {
    return await this.db.findOne("Player", { where: { _id } });
  }
  async add(_id) {
    if (this.get(_id)) return;
    await this.db.create("Player", {
      _id,
      rating: 800,
    });
  }

  async pop(_id) {
    const player = this.get(_id);
    this.db.delete("Player", {
      where: {
        _id,
      },
    });
    return player;
  }

  async buildMatches() {
    let queue = this.db.findMany("Player", {});
    while (queue.length >= 2) {
      queue.sort((p1, p2) => p1.rating < p2.rating);

      const white = this.pop(queue[0]);
      const black = this.pop(queue[1]);

      const game = await this.db.create("Game", {
        white,
        black,
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
