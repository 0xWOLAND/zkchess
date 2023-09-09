import EspecialClient from 'especial/client'
import { makeAutoObservable, makeObservable, observable } from 'mobx'
import { WS_SERVER } from '../config'

export default class Message {
  connection = null
  client = null
  keepaliveTimer = null
  connected = false

  messages = []
  channels = []
  activeChannel = ''

  constructor(state) {
    makeAutoObservable(this)
    this.state = state
    this.load()
  }

  async load() {
    await this.connect()
    await this.state.game.loadGames()
  }

  async connect() {
    if (this.connected) return console.log('Already connected')
    try {
      const _client = new EspecialClient(WS_SERVER)
      makeObservable(_client, {
        connected: observable,
      })

      this.client = _client
      await _client.connect()
      this.connected = _client.connected
    } catch (err) {
      this.client = null
      return
    }
    this.client.addConnectedHandler(() => {
      this.connected = this.client.connected
    })
    this.client.listen('msg', ({ data }) => this.ingestMessages(data))
    this.keepaliveTimer = setInterval(
      () => this.client.send('ping'),
      5 * 60 * 1000
    )
  }
}
