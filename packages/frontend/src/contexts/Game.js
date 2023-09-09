import { makeAutoObservable } from "mobx";
import { Position } from "kokopu";
import { SERVER } from "../config";

export default class Game {
  activeGame = null;
  position = null;
  activeGames = [];
  playerId = "test";

  constructor(state) {
    makeAutoObservable(this);
    this.state = state;
    this.load();
  }

  async load() {
    await new Promise(() => setTimeout(r, 10))
    this.state.msg.client.listen(
      "newGame",
      async ({ data: { gameId, white, black } }) => {
        if (this.playerId != white && this.playerId != black) return;

        const { data } = await this.state.msg.client.send("game.load", {
          gameId,
        });
        this._activeGame = new Position(data.position);
        this.activeGameId = data._id;
        this.state.msg.client.listen(gameId, ({ data }) => {
          this._activeGame = new Position(data.position);
          this.position = this._activeGame.fen();
        });
      }
    );
  }

  async loadGames() {
    const { data } = await this.state.msg.client.send("game.list");
    this.activeGames = data;
  }

  async joinQueue() {
    // make proofs/send
    // set playerId here
  }

  async playMove(move) {
    const g = new Position(this.activeGame.position);
    g.play(move);
    this.activeGame.position = g.fen();
    const { data } = await this.state.msg.client.send("game.playMove", {
      move,
      gameId: this.activeGame._id,
    });
  }
}
