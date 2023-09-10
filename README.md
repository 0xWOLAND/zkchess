# zkchess

A monorepo containing solidity contracts, javascript relay, javascript webapp

Deployed to scroll sepolia ZKEVM [here](https://sepolia-blockscout.scroll.io/address/0x35879376A7293E75Da04C3ddDB61B8dC2E33405c/contracts#address-tabs).

### 1. Installing

Once you have cloned run the following commands

```shell
yarn
yarn circuits build
yarn relay keys
```

### 1.1 Start a node

```shell
yarn contracts hardhat node
```

### 1.2 Deploy smart contracts

in new terminal window, from root:

```shell
yarn contracts deploy
```

### 1.3 Start a relayer (backend)

```shell
yarn relay start
```

### 1.4 Start a frontend

in new terminal window, from root:

```shell
yarn frontend start
```

It will be running at: http://localhost:3000/
