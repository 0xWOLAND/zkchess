import { makeAutoObservable } from 'mobx'
import { Position } from 'kokopu'

export default class Game {
  activeGame = null
  position = null
  activeGames = []

  constructor(state) {
    makeAutoObservable(this)
    this.state = state
    this.load()
  }

  async load() {}

  async loadGames() {
    const { data } = await this.state.msg.client.send('game.list')
    this.activeGames = data
  }

  async startGame() {
    const { data } = await this.state.msg.client.send('game.create')
    this.activeGame = data
    this.state.msg.client.listen(this.activeGame._id, ({ data }) => {
      this.activeGame = data
    })
  }

  async joinGame(gameId) {
    const { data } = await this.state.msg.client.send('game.load', {
      gameId
    })
    this.activeGame = data
    this.state.msg.client.listen(this.activeGame._id, ({ data }) => {
      this.activeGame = data
    })
  }

  async playMove(move) {
    const g = new Position(this.activeGame.position)
    g.play(move)
    this.activeGame.position = g.fen()
    const { data } = await this.state.msg.client.send('game.playMove', {
      move,
      gameId: this.activeGame._id
    })
  }

}
