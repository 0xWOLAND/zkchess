import { nanoid } from 'nanoid'
import { Position } from 'kokopu'

export default [
  {
    name: 'Message',
    primaryKey: '_id',
    rows: [
      {
        name: '_id',
        type: 'String',
        default: () => nanoid(),
      },
      ['text', 'String'],
      ['timestamp', 'Int', { unique: true }],
      ['publicSignals', 'String'],
      ['proof', 'String'],
      ['channelName', 'String'],
    ],
  },
  {
    name: 'StateTreeRoot',
    primaryKey: 'hash',
    rows: [['hash', 'String']],
  },
  {
    name: 'Channel',
    primaryKey: 'name',
    rows: [
      ['name', 'String'],
      ['memberCount', 'Int'],
      ['root', 'String'],
      ['dataPath', 'String'],
    ],
  },
  {
    name: 'Game',
    primaryKey: '_id',
    rows: [
      {
        name: '_id',
        type: 'String',
        default: () => nanoid()
      },
      {
        name: 'position',
        type: 'String',
        default: () => new Position('start').fen()
      },
    ]
  }
]
