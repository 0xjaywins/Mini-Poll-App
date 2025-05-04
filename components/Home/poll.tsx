import { useState, useEffect, useCallback } from "react";
import { useMiniAppContext } from "../../hooks/use-miniapp-context";
import { dApps, tokens, nfts, comparisonQuestions } from "../../lib/monadEcosystem";
import { getContract } from "../../utils/contract";
import { ethers } from "ethers"; // Import ethers for type definitions

interface PollItem {
  name: string;
  description: string;
}

// Define the type for the Ethereum provider (EIP-1193 compliant)
interface EVMProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, listener: (...args: any[]) => void) => void;
  removeListener: (event: string, listener: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EVMProvider;
  }
}

const MONAD_TESTNET_CHAIN_ID = "0x27cf"; // Chain ID 10143 in hex

export default function Poll({ userName }: { userName: string }) {
  const { actions } = useMiniAppContext();
  const [pollItems, setPollItems] = useState<PollItem[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);

  // Check and switch network
  const checkNetwork = async (): Promise<boolean> => {
    if (!window.ethereum) {
      setNetworkError("Please connect an EVM-compatible wallet (e.g., MetaMask, Coinbase Wallet).");
      return false;
    }

    try {
      // Check if wallet is already connected
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length === 0) {
        // Prompt the user to connect their wallet
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
      setIsWalletConnected(true);

      // Check the current network
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== MONAD_TESTNET_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: MONAD_TESTNET_CHAIN_ID }],
          });
        } catch (switchError: any) {
          // If the network isn't added to the wallet, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: MONAD_TESTNET_CHAIN_ID,
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
            setNetworkError("Please switch to the Monad Testnet in your wallet.");
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      setNetworkError("Error checking network: " + (error as Error).message);
      return false;
    }
  };

  // Initialize the contract
  useEffect(() => {
    const initContract = async () => {
      try {
        const isNetworkCorrect = await checkNetwork();
        if (!isNetworkCorrect) return;

        const contractInstance = await getContract();
        setContract(contractInstance);
      } catch (error) {
        console.error("Error initializing contract:", error);
        setError("Failed to initialize contract. Please refresh and try again.");
      }
    };
    initContract();
  }, []);

  // Function to generate a new poll
  const generatePoll = useCallback(() => {
    const categories = [dApps, tokens, nfts];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    const shuffledItems = [...selectedCategory].sort(() => Math.random() - 0.5);
    const twoItems = shuffledItems.slice(0, 2);

    let questionPool: string[];
    if (selectedCategory === dApps) {
      questionPool = comparisonQuestions.filter((q) => q.includes("dApp"));
    } else if (selectedCategory === tokens) {
      questionPool = comparisonQuestions.filter((q) => q.includes("token"));
    } else {
      questionPool = comparisonQuestions.filter((q) => q.includes("NFT"));
    }
    const selectedQuestion = questionPool[Math.floor(Math.random() * questionPool.length)];

    setPollItems(twoItems);
    setQuestion(selectedQuestion);
    setShowFeedback(false); // Reset feedback state
    setError(null); // Clear any previous errors
  }, []);

  // Initial poll generation
  useEffect(() => {
    generatePoll();
  }, [generatePoll]);

  // Handle vote casting
  const handleVote = async (item: string) => {
    if (!contract) {
      setError("Contract not initialized. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Record the vote on the blockchain
      const tx = await contract.castVote(item);
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed:", tx.hash);

      // Post the vote to Warpcast
      if (actions?.composeCast) {
        actions.composeCast({
          text: `I voted for ${item}! #MiniPoll`,
          embeds: [],
        });
        console.log("Thanks for voting!");
      } else {
        console.log("Actions not available");
      }

      // Show feedback and then generate a new poll
      setShowFeedback(true);
      setTimeout(() => {
        generatePoll();
      }, 1000); // Show feedback for 1 second
    } catch (error: any) {
      console.error("Error casting vote:", error);
      setError(`Failed to cast vote: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle wallet connection
  const connectWallet = async () => {
    if (!window.ethereum) {
      setNetworkError("Please connect an EVM-compatible wallet (e.g., MetaMask, Coinbase Wallet).");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setIsWalletConnected(true);
      await checkNetwork(); // Re-check network after connecting
    } catch (error) {
      setNetworkError("Failed to connect wallet: " + (error as Error).message);
    }
  };

  if (!pollItems.length && !showFeedback) {
    return <div className="text-center text-gray-500">Loading poll...</div>;
  }

  if (showFeedback) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <p className="text-lg text-green-600 font-medium">Vote submitted! Loading new poll...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Hey {userName}, {question}
      </h2>
      {networkError && <p className="text-red-500 text-center mb-4">{networkError}</p>}
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {loading && <p className="text-blue-500 text-center mb-4">Waiting for transaction confirmation...</p>}
      {!isWalletConnected && (
        <div className="text-center mb-4">
          <button
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        </div>
      )}
      <div className="space-y-4">
        <button
          className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md flex flex-col items-start disabled:bg-gray-400"
          onClick={() => handleVote(pollItems[0].name)}
          disabled={loading || !!networkError || !isWalletConnected}
        >
          <span className="text-lg font-medium">{pollItems[0].name}</span>
          <span className="text-sm text-gray-100">{pollItems[0].description}</span>
        </button>
        <button
          className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md flex flex-col items-start disabled:bg-gray-400"
          onClick={() => handleVote(pollItems[1].name)}
          disabled={loading || !!networkError || !isWalletConnected}
        >
          <span className="text-lg font-medium">{pollItems[1].name}</span>
          <span className="text-sm text-gray-100">{pollItems[1].description}</span>
        </button>
      </div>
    </div>
  );
}