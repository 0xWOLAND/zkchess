class PlayerQueue {
  // string[]
  players = [];

  constructor() {
    setInterval(() => {
      this.buildMatches();
    }, 1000);
  }

  // Player type
  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(playerId) {
    this.players = this.players.splice(this.players.indexOf(playerId), 1);
  }

  buildMatches(wsApp) {
    this.players.sort((p1, p2) => p1.rating > p2.rating);
    for (let i = 0; i < this.players.length; i += 2) {
      const w = players[i]._id;
      const b = players[i + 1]._id;

      wsApp.broadcast("match", { w, b });

      this.removePlayer(w);
      this.removePlayer(b);
    }
  }
}

export default new PlayerQueue();
