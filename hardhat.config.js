require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.20" },
      { version: "0.8.28" },
    ],
  },
  networks: {
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz", // Use the official RPC endpoint
      chainId: 10143,
      pollingInterval: 10000, // Keep the increased polling interval to avoid rate limits
    },
  },
};