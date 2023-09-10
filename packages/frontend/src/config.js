import { ethers } from "ethers";
import config from "../../../config";

const prod = NODE_ENV === "production";

const _UNIREP_ADDRESS = prod
  ? "0x9bC4f2305D1221a57F4a96A2DAc07505c4b7137a"
  : undefined;
const _APP_ADDRESS = prod
  ? "0x35879376A7293E75Da04C3ddDB61B8dC2E33405c"
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
