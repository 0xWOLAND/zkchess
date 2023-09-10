import { makeAutoObservable } from "mobx";
import { Position } from "kokopu";
import { SERVER } from "../config";

export default class Game {
  activeGame = null;
  position = null;
  activeGames = [];

  constructor(state) {
    makeAutoObservable(this);
    this.state = state;
    this.load();
  }

  async load() {
    await new Promise((r) => setTimeout(r, 10))
    this.state.msg.client.listen(
      "newGame",
      async ({ data: { gameId, white, black } }) => {
        console.log('starting game', gameId, white, black)
        if (this.playerId != white && this.playerId != black) return;
        const { data } = await this.state.msg.client.send("game.load", {
          gameId,
        });
        this.activeGame = data
        this.state.msg.client.listen(gameId, ({ data }) => {
          this.activeGame = data
        });
      }
    );
  }

  async loadGames() {
    const { data } = await this.state.msg.client.send("game.list");
    this.activeGames = data;
  }

  async joinQueue() {
    const { ustProof, eloProof } = await this.state.auth.proveElo()
    this.playerId = ustProof.publicSignals[1].toString()
    await this.state.msg.client.send("queue.join", {
      ustProof: {
        publicSignals: ustProof.publicSignals.map(v => v.toString()),
        proof: ustProof.proof.map(v => v.toString()),
      },
      eloProof: {
        publicSignals: eloProof.publicSignals.map(v => v.toString()),
        proof: eloProof.proof.map(v => v.toString()),
      }
    });
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
