require('@nomiclabs/hardhat-ethers')

module.exports = {
  defaultNetwork: 'local',
  networks: {
    hardhat: {
      blockGasLimit: 12000000,
      chainId: 421613, // match arb goerli
    },
    local: {
      url: 'http://127.0.0.1:8545',
      blockGasLimit: 12000000,
      chainId: 421613, // match arb goerli
      accounts: [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      ],
    },
    scroll: {
      url: 'https://sepolia-rpc.scroll.io',
      accounts: [
      ],
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: { enabled: true, runs: 2 ** 32 - 1 },
        },
      },
    ],
  },
}
