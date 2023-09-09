import { makeAutoObservable } from "mobx";
export default class MatchQueue {
  // user's player
  player;
  constructor(state) {
    makeAutoObservable(this);
    this.state = state;
    this.load();
  }

  async load() {}

  async createGames() {
    const { data } = await this.state.msg.client.send("queue.get");
    if (data.length > 1) {
      const white = data[0]._id;
      const black = data[1]._id;

      await this.state.msg.client.send("game.create", { white, black });
      await this.state.msg.client.send("queue.leave", { playerId: white });
      await this.state.msg.client.send("queue.leave", { playerId: black });
    } else {
      console.log("not enough people in queue -- ", data);
    }
  }
}
