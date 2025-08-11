require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { SEPOLIA_API_KEY, ETHERSCAN_API_KEY, ALCHEMY_API_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  paths: {
    artifacts: "./client/src/artifacts",
  },
  networks: {
    development: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      networkId: 5777
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${SEPOLIA_API_KEY}`],
      chainId: 11155111,
    }
  },
};