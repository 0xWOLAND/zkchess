import { makeAutoObservable } from 'mobx'
import { Position } from 'kokopu'

export default class Game {
  _activeGame

  constructor() {
    makeAutoObservable(this)
    this.load()
  }

  get activeGame() {
    if (!this._activeGame) {
      return new Position('start')
    }
    return this._activeGame
  }

  async load() {}

  async startGame() {
    console.log('tst')
    this._activeGame = new Position('start')
  }

  async playMove(move) {
    this._activeGame.play(move)
  }

}
