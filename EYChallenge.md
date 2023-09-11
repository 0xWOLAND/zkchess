Project info

ZKChess

An anonymous chess elo rating system.

@vimwitch - https://github.com/vimwitch
@0xwoland - https://github.com/0xwoland

Workshop info

Team name: chess/zkchess
Attendees: vimwitch/0xwoland

Deployment info

Smart contracts deployed to scroll sepolia public testnet [here](https://sepolia-blockscout.scroll.io/address/0x35879376A7293E75Da04C3ddDB61B8dC2E33405c/contracts#address-tabs).

[Operating address](https://sepolia-blockscout.scroll.io/address/0xD9eA324cF1510De6b9E19eDb6079057A5DfE9D54)

Privacy info

Our game rating system allows users to play and gain/lose rating anonymously, then prove their rating in zk. This allows players to do things like vote, join daos, claim tokens/nfts without revealing their identity.

We chose unirep (universal reputation) because of its support for private user data.

Architecture

Web client -> relay -> ZKChess contract -> UniRep contract

Web client ------------------------------------
    |                                          |
    \/                                         \/
   relay       ->   ZKChess contract -> Unirep contract


The web client synchronizes state by loading events from the unirep contract. From these events the client can construct the user state. The client proves the user state to the relay which is responsible for matching the user with other players. When the game ends the relay attests to the elo change for each user by sending a transaction through the zkchess contract to the unirep contract.
