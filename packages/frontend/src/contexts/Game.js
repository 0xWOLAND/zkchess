import { makeAutoObservable } from "mobx";
import { Position } from "kokopu";
import { SERVER } from "../config";

export default class Game {
  activeGame = null;
  position = null;
  activeGames = [];
  joinProofs = null;
  color = null;

  constructor(state) {
    makeAutoObservable(this);
    this.state = state;
    this.load();
  }

  get playerId() {
    if (!this.joinProofs?.eloProof?.publicSignals[0]) {
      return null;
    }
    return this.joinProofs.eloProof.publicSignals[0].toString();
  }

  async buildJoinProofs() {
    this.joinProofs = await this.state.auth.proveElo();
  }

  async load() {}

  async joinGame(gameId) {
    if (!gameId) return
    const { data } = await this.state.msg.client.send("game.load", {
      gameId,
    });
    this.color = this.playerId === data.blackPlayerId ? "b" : "w";
    this.activeGame = data
    this.state.msg.client.listen(gameId, ({ data }) => {
      if (this.activeGame?._id !== data._id) return
      this.activeGame = data
    });
  }

  async loadGames() {
    const { data } = await this.state.msg.client.send("game.list");
    this.activeGames = data;
  }

  async leaveQueue() {
    if (!this.playerId) return;
    await this.state.msg.client.send("queue.leave", {
      playerId: this.playerId,
    });
  }

  async joinQueue() {
    if (!this.joinProofs) throw new Error("no join proofs built");
    const { ustProof, eloProof, epoch } = this.joinProofs;
    if (this.state.auth.userState?.sync?.calcCurrentEpoch() !== epoch) {
      throw new Error("join proofs epoch mismatch");
    }
    await this.state.msg.client.send("queue.join", {
      ustProof: {
        publicSignals: ustProof.publicSignals.map((v) => v.toString()),
        proof: ustProof.proof.map((v) => v.toString()),
      },
      eloProof: {
        publicSignals: eloProof.publicSignals.map((v) => v.toString()),
        proof: eloProof.proof.map((v) => v.toString()),
      },
    });
  }

  async playMove(move) {
    const g = new Position(this.activeGame.position);
    const prevPosition = g.fen();
    g.play(move);
    this.activeGame.position = g.fen();
    const moveProof = await this.state.auth.signMove(move, this.activeGame.startedAtEpoch + 1)
    try {
      const { data } = await this.state.msg.client.send("game.playMove", {
        ...moveProof,
        gameId: this.activeGame._id,
      });
    } catch {
      this.activeGame.position = prevPosition;
    }
  }
}
