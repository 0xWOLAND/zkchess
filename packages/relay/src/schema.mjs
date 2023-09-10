import { nanoid } from "nanoid";
import { Position } from "kokopu";

export default [
  {
    name: "Game",
    primaryKey: "_id",
    rows: [
      {
        name: "_id",
        type: "String",
        default: () => nanoid(),
      },
      {
        name: "position",
        type: "String",
        default: () => new Position("start").fen(),
      },
      {
        name: "whitePlayerId",
        type: "String",
      },
      {
        name: "blackPlayerId",
        type: "String",
      },
      {
        name: 'startedAtEpoch',
        type: "Int"
      },
      // 'w' for white victory, 'b' for black victory, 'd' for draw
      ["outcome", "String", { optional: true }],
      {
        name: "lastMoveAt",
        type: "Int",
        default: () => +new Date(),
      },
    ],
  },
  {
    name: "Player",
    primaryKey: "_id",
    rows: [
      ["_id", 'String'],
      ["rating", "Int"],
      ["currentEpk", "String"],
      ["nextEpk", "String"],
      ['epoch', 'Int'],
    ],
  },
  {
    name: "PlayerQueue",
    primaryKey: "_id",
    rows: [
      {
        name: "_id",
        type: "String",
        default: () => nanoid(),
      },
      ["playerId", "String", { unique: true }],
    ],
  }
];
