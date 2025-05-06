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
  if (!window.ethereum) {
    throw new Error("Please install a compatible Ethereum wallet (e.g., MetaMask, Trust Wallet, or Coinbase Wallet).");
  }

  try {
    // Initialize provider
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Check network
    const { chainId } = await provider.getNetwork();
    if (Number(chainId) !== MONAD_TESTNET_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${MONAD_TESTNET_CHAIN_ID.toString(16)}` }],
        });
      } catch (switchError: any) {
        // If chain is not added, prompt to add Monad Testnet
        if (switchError.code === 4902) {
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
        } else {
          throw new Error("Please switch to Monad Testnet in your wallet.");
        }
      }
    }

    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" });

    // Get signer
    const signer = await provider.getSigner();

    // Return contract instance
    return new ethers.Contract(contractAddress, contractABI, signer);
  } catch (error: any) {
    console.error("Error initializing contract:", error);
    throw new Error(`Failed to connect to wallet: ${error.message}`);
  }
};