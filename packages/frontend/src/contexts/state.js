import { createContext } from "react";
import Interface from "./interface";
import User from "./User";
import Auth from "./Auth";
import Message from "./Message";
import Game from "./Game";

const state = {};

const ui = new Interface(state);
const user = new User(state);
const msg = new Message(state);
const auth = new Auth(state);
const game = new Game(state);

Object.assign(state, {
  ui,
  user,
  msg,
  auth,
  game,
});

export default createContext(state);
