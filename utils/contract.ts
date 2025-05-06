import { ethers } from "ethers";

// Contract configuration
const contractAddress = "0x85A1150f49A0e534a13D6b59740E80c45ab0Aa47";
const contractABI = [
  "function castVote(string memory item) public",
  "function getVoteCount(string memory item) public view returns (uint256)",
  "event VoteCast(string item, uint256 voteCount)",
];

const MONAD_TESTNET_CHAIN_ID = 10143;

export const getContract = async () => {
  console.log("Checking window.ethereum:", !!window.ethereum);
  if (!window.ethereum) {
    throw new Error("Please install a compatible Ethereum wallet (e.g., MetaMask, Trust Wallet, or Coinbase Wallet).");
  }

  try {
    // Initialize provider
    console.log("Creating BrowserProvider...");
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Check network
    console.log("Checking network...");
    const { chainId } = await provider.getNetwork();
    console.log("Current chainId:", Number(chainId));
    if (Number(chainId) !== MONAD_TESTNET_CHAIN_ID) {
      console.log("Switching to Monad Testnet...");
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${MONAD_TESTNET_CHAIN_ID.toString(16)}` }],
        });
        console.log("Switched to Monad Testnet.");
      } catch (switchError: any) {
        console.error("Network switch error:", switchError);
        // If chain is not added, prompt to add Monad Testnet
        if (switchError.code === 4902) {
          console.log("Adding Monad Testnet...");
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${MONAD_TESTNET_CHAIN_ID.toString(16)}`,
                  chainName: "Monad Testnet",
                  rpcUrls: ["https://testnet-rpc.monad.xyz"],
                  nativeCurrency: {
                    name: "MON",
                    symbol: "MON",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://testnet.monadexplorer.com"],
                },
              ],
            });
            console.log("Monad Testnet added.");
          } catch (addError: any) {
            console.error("Error adding Monad Testnet:", addError);
            throw new Error("Failed to add Monad Testnet to wallet: " + addError.message);
          }
        } else {
          throw new Error("Please switch to Monad Testnet in your wallet: " + switchError.message);
        }
      }
    }

    // Request account access
    console.log("Requesting account access...");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    console.log("Account access granted.");

    // Get signer
    console.log("Getting signer...");
    const signer = await provider.getSigner();
    console.log("Signer address:", await signer.getAddress());

    // Return contract instance
    console.log("Creating contract instance...");
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log("Contract created:", contract.address);
    return contract;
  } catch (error: any) {
    console.error("Error initializing contract:", error.message, error);
    throw new Error(`Failed to connect to wallet or initialize contract: ${error.message}`);
  }
};