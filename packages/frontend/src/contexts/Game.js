import { makeAutoObservable } from 'mobx'
import { Position } from 'kokopu'

export default class Game {
  _activeGame = null
  activeGameId = null
  position = null

  constructor(state) {
    makeAutoObservable(this)
    this.state = state
    this.load()
  }

  async load() {}

  async startGame() {
    const { data } = await this.state.msg.client.send('game.create')
    this._activeGame = new Position(data.position)
    this.activeGameId = data._id
    this.state.msg.client.listen(this.activeGameId, ({ data }) => {
      this._activeGame = new Position(data.position)
      this.position = this._activeGame.fen()
    })
  }

  async joinGame(gameId) {
    const { data } = await this.state.msg.client.send('game.load', {
      gameId
    })
    this._activeGame = new Position(data.position)
    this.activeGameId = data._id
    this.state.msg.client.listen(this.activeGameId, ({ data }) => {
      this._activeGame = new Position(data.position)
      this.position = this._activeGame.fen()
    })
  }

  async playMove(move) {
    this._activeGame.play(move)
    this.position = this._activeGame.fen()
    const { data } = await this.state.msg.client.send('game.playMove', {
      move,
      gameId: this.activeGameId
    })
  }

}
