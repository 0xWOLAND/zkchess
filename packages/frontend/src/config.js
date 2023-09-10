import { ethers } from "ethers";
import config from "../../../config";

const prod = NODE_ENV === "production";

const _UNIREP_ADDRESS = prod
  ? "0x97404AAF461f042F2ac2Ab3aa3099BA05dAf5490"
  : undefined;
const _APP_ADDRESS = prod
  ? "0xd2bA5c8c62B5E110c3AC7A552577DfE55d8c0350"
  : undefined;

export const UNIREP_ADDRESS = _UNIREP_ADDRESS ?? config.UNIREP_ADDRESS;
export const APP_ADDRESS = _APP_ADDRESS ?? config.APP_ADDRESS;
export const ETH_PROVIDER_URL = config.ETH_PROVIDER_URL;

export const provider = ETH_PROVIDER_URL.startsWith("http")
  ? new ethers.providers.JsonRpcProvider(ETH_PROVIDER_URL)
  : new ethers.providers.WebSocketProvider(ETH_PROVIDER_URL);

export const SERVER = prod
  ? "https://relay.zkchess.org"
  : "http://127.0.0.1:8000";
export const WS_SERVER = prod
  ? "wss://ws.relay.zkchess.org"
  : "ws://127.0.0.1:8001";
export const KEY_SERVER = prod
  ? "https://keys.zkchess.org/"
  : // : 'https://keys.zketh.io/v0/'
    "http://127.0.0.1:8000/build/";
// export const KEY_SERVER = 'https://keys.unirep.io/2-beta-1/'
