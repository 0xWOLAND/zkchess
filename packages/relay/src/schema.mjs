import { nanoid } from 'nanoid'
import { Position } from 'kokopu'

export default [
  {
    name: "Message",
    primaryKey: "_id",
    rows: [
      {
        name: "_id",
        type: "String",
        default: () => nanoid(),
      },
      ["FEN", "String"],
      ["timestamp", "Int", { unique: true }],
      ["publicSignals", "String"],
      ["proof", "String"],
      ["channelName", "String"],
    ],
  },
  {
    name: "StateTreeRoot",
    primaryKey: "hash",
    rows: [["hash", "String"]],
  },
  {
    name: "Match",
    primaryKey: "matchId",
    rows: [
      {
        name: "matchId",
        type: "String",
        default: () => nanoid(),
      },
      ["white", "String"],
      ["black", "String"],
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
  },
  {
    name: "Player",
    primaryKey: "playerId",
    rows: [
      {
        name: "playerId",
        type: "String",
        default: () => nanoid(),
      },
      ["rating", "Int"],
    ],
  },
]
