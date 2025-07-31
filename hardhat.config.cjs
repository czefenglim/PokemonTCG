require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      gas: 50000000, // 50M gas limit (much higher)
      blockGasLimit: 50000000, // 50M block gas limit
      gasPrice: 20000000000, // 20 gwei
      timeout: 60000, // 60 second timeout
    },
    hardhat: {
      gas: 50000000, // 50M gas limit
      blockGasLimit: 50000000, // 50M block gas limit
      gasPrice: 20000000000,
      allowUnlimitedContractSize: true, // For large contracts
    },
  },
  // Increase timeout for large transactions
  mocha: {
    timeout: 120000, // 2 minutes
  },
};
