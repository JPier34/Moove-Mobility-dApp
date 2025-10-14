const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomicfoundation/hardhat-verify");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
const dotenv = require("dotenv");
require("dotenv").config();
require("hardhat-contract-sizer");

dotenv.config();

const config = {
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 20,
        initialIndex: 0,
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 5000000000, // 5 gwei (further reduced)
      gas: 15000000, // 15 million gas limit (further reduced)
      maxFeePerGas: 5000000000, // 5 gwei max fee
      maxPriorityFeePerGas: 1000000000, // 1 gwei priority fee
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
  },
  mocha: {
    timeout: 40000,
    require: [`ts-node/register`],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};

module.exports = config;
