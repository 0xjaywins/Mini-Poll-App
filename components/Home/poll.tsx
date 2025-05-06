import { useState, useEffect, useCallback } from "react";
import { useMiniAppContext } from "../../hooks/use-miniapp-context";
import { dApps, tokens, nfts, comparisonQuestions } from "../../lib/monadEcosystem";
import { getContract } from "../../utils/contract";
import { ethers } from "ethers";
import {
  createConfig,
  connect,
  disconnect,
  getAccount,
  switchChain,
  fetchBalance,
} from "@wagmi/core";
import { injected, coinbaseWallet } from "@wagmi/connectors";
import { http } from "viem";

// Monad Testnet chain configuration
const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
};

// Wagmi configuration
const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected({ target: "metaMask" }), // MetaMask
    injected({ target: "trustWallet" }), // Trust Wallet
    coinbaseWallet({ appName: "MiniPoll" }), // Coinbase Wallet
    injected(), // Generic injected provider for other EVM wallets
  ],
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
  },
});

interface PollItem {
  name: string;
  description: string;
}

interface WalletOption {
  id: string;
  name: string;
  connector: any; // Wagmi connector instance
  isDetected: boolean;
}

const MONAD_TESTNET_CHAIN_ID = 10143;

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
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false); // New state for connection loading

  // Define supported wallets
  const supportedWallets: WalletOption[] = [
    {
      id: "metamask",
      name: "MetaMask",
      connector: injected({ target: "metaMask" }),
      isDetected: false,
    },
    {
      id: "trustwallet",
      name: "Trust Wallet",
      connector: injected({ target: "trustWallet" }),
      isDetected: false,
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      connector: coinbaseWallet({ appName: "MiniPoll" }),
      isDetected: false,
    },
    {
      id: "other",
      name: "Other Injected Wallet",
      connector: injected(),
      isDetected: false,
    },
  ];

  // Detect available wallets
  const detectWallets = useCallback(() => {
    console.log("Detecting wallets, window.ethereum:", !!window.ethereum);
    const updatedWallets = supportedWallets.map((wallet) => {
      let isDetected = false;
      if (wallet.id === "metamask") {
        isDetected = Boolean(window.ethereum?.isMetaMask);
      } else if (wallet.id === "trustwallet") {
        isDetected = Boolean(window.ethereum?.isTrust);
      } else if (wallet.id === "coinbase") {
        isDetected = Boolean(window.ethereum?.isCoinbaseWallet);
      } else if (wallet.id === "other") {
        isDetected = Boolean(
          window.ethereum &&
            !window.ethereum.isMetaMask &&
            !window.ethereum.isTrust &&
            !window.ethereum.isCoinbaseWallet &&
            !window.ethereum.isRabby // Exclude unsupported wallets like Rabby
        );
      }
      return { ...wallet, isDetected };
    });
    console.log("Detected wallets:", updatedWallets);
    setWalletOptions(updatedWallets);
  }, []);

  // Initialize wallet detection
  useEffect(() => {
    detectWallets();
  }, [detectWallets]);

  // Check network and account
  const checkNetworkAndAccount = async () => {
    try {
      console.log("Checking account with Wagmi...");
      const accountData = getAccount(config);
      const { address, isConnected } = accountData;
      console.log("Account data:", { address, isConnected });
      if (!isConnected || !address) {
        console.log("No account connected.");
        setIsWalletConnected(false);
        setAccount(null);
        setBalance(null);
        return false;
      }

      setIsWalletConnected(true);
      setAccount(address);

      // Fetch balance
      console.log("Fetching balance for:", address);
      const balanceData = await fetchBalance(config, {
        address: address as `0x${string}`,
        chainId: MONAD_TESTNET_CHAIN_ID,
      });
      console.log("Balance:", balanceData.value);
      setBalance(ethers.formatEther(balanceData.value));

      // Check network
      const currentChainId = accountData.chainId;
      console.log("Current chainId (Wagmi):", currentChainId);
      if (currentChainId !== MONAD_TESTNET_CHAIN_ID) {
        console.log("Switching to Monad Testnet via Wagmi...");
        try {
          await switchChain(config, { chainId: MONAD_TESTNET_CHAIN_ID });
          console.log("Switched to Monad Testnet.");
        } catch (switchError: any) {
          console.error("Wagmi switch chain error:", switchError);
          setNetworkError("Please switch to the Monad Testnet in your wallet.");
          return false;
        }
      }
      return true;
    } catch (error: any) {
      console.error("Error checking network/account:", error.message, error);
      setNetworkError(`Error checking network: ${error.message}`);
      return false;
    }
  };

  // Initialize the contract with retry mechanism
  const initContract = useCallback(async () => {
    if (retryCount >= 3) {
      console.error("Max retries reached for contract initialization.");
      setError("Failed to initialize contract after multiple attempts. Please ensure your wallet is connected to Monad Testnet and try again.");
      return;
    }

    try {
      console.log("Initializing contract, attempt:", retryCount + 1);
      const isNetworkCorrect = await checkNetworkAndAccount();
      console.log("Network correct:", isNetworkCorrect);
      if (!isNetworkCorrect) {
        console.error("Network check failed. Wallet not connected or wrong network.");
        setError("Please connect your wallet to Monad Testnet and try again.");
        setRetryCount((prev) => prev + 1);
        return;
      }

      console.log("Calling getContract...");
      const contractInstance = await getContract();
      console.log("Contract initialized:", contractInstance.address);
      setContract(contractInstance);
      setRetryCount(0); // Reset retry count on success
    } catch (error: any) {
      console.error("Error initializing contract:", error.message, error);
      setError(`Failed to initialize contract: ${error.message}. Retrying...`);
      setRetryCount((prev) => prev + 1);
    }
  }, [retryCount]);

  // Run initContract on mount and when wallet connects
  useEffect(() => {
    if (isWalletConnected) {
      initContract();
    }
  }, [isWalletConnected, initContract]);

  // Generate a new poll
  const generatePoll = useCallback(() => {
    console.log("Generating new poll...");
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

    console.log("Poll items:", twoItems, "Question:", selectedQuestion);
    setPollItems(twoItems);
    setQuestion(selectedQuestion);
    setShowFeedback(false);
    setError(null);
  }, []);

  // Initial poll generation
  useEffect(() => {
    generatePoll();
  }, [generatePoll]);

  // Handle wallet connection with retry for pending permissions
  const connectWallet = async (wallet: WalletOption) => {
    if (isConnecting) {
      console.log("Connection already in progress, please wait...");
      return;
    }

    setIsConnecting(true);
    setNetworkError(null);

    const maxAttempts = 3;
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        console.log(`Connecting wallet: ${wallet.name}, attempt ${attempt + 1}`);
        await connect(config, { connector: wallet.connector });
        console.log("Wallet connected.");
        setShowWalletModal(false);
        await checkNetworkAndAccount();
        setIsConnecting(false);
        return; // Success, exit the loop
      } catch (error: any) {
        console.error(`Wallet connection error (attempt ${attempt + 1}):`, error);
        if (
          error.message.includes("wallet_requestPermissions") &&
          error.message.includes("already pending")
        ) {
          console.log("Pending permissions detected, retrying after delay...");
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
          attempt++;
          if (attempt === maxAttempts) {
            setNetworkError(
              `Failed to connect with ${wallet.name}: A wallet permission request is pending. Please resolve it in your wallet (e.g., approve or reject the prompt) and try again.`
            );
            setIsConnecting(false);
            return;
          }
        } else {
          setNetworkError(`Failed to connect with ${wallet.name}: ${error.message}`);
          setIsConnecting(false);
          return;
        }
      }
    }
  };

  // Handle wallet disconnection
  const disconnectWallet = async () => {
    try {
      console.log("Disconnecting wallet...");
      await disconnect(config);
      setIsWalletConnected(false);
      setAccount(null);
      setBalance(null);
      setContract(null);
      setNetworkError(null);
      setRetryCount(0);
      console.log("Wallet disconnected.");
    } catch (error: any) {
      console.error("Disconnect error:", error);
      setError("Failed to disconnect wallet: " + error.message);
    }
  };

  // Handle vote casting
  const handleVote = async (item: string) => {
    if (!contract) {
      console.error("Vote attempted but contract is null.");
      setError("Contract not initialized. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Casting vote for:", item);
      const tx = await contract.castVote(item);
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed:", tx.hash);

      if (actions?.composeCast) {
        console.log("Posting to Warpcast...");
        actions.composeCast({
          text: `I voted for ${item}! #MiniPoll`,
          embeds: [],
        });
        console.log("Cast posted.");
      } else {
        console.log("Actions not available for Warpcast post.");
      }

      setShowFeedback(true);
      setTimeout(() => {
        generatePoll();
      }, 1000);
    } catch (error: any) {
      console.error("Error casting vote:", error);
      setError(`Failed to cast vote: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manual retry for contract initialization
  const handleRetry = () => {
    console.log("Retrying contract initialization...");
    setError(null);
    setRetryCount(0);
    initContract();
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
      {networkError && (
        <div className="text-center mb-4">
          <p className="text-red-500">{networkError}</p>
          <p className="text-sm text-gray-600 mt-2">
            If using a wallet other than MetaMask, we recommend trying MetaMask for the best experience.
          </p>
        </div>
      )}
      {error && (
        <div className="text-center mb-4">
          <p className="text-red-500">{error}</p>
          {retryCount < 3 && (
            <button
              className="mt-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
              onClick={handleRetry}
            >
              Retry
            </button>
          )}
        </div>
      )}
      {loading && <p className="text-blue-500 text-center mb-4">Waiting for transaction confirmation...</p>}
      <div className="text-center mb-4">
        {isWalletConnected ? (
          <div>
            <p className="text-sm text-gray-600">
              Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
            </p>
            <p className="text-sm text-gray-600">Balance: {balance ? `${balance} MON` : "Loading..."}</p>
            <button
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 mt-2"
              onClick={disconnectWallet}
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <button
            className={`p-2 rounded-lg text-white transition-all duration-200 ${
              isConnecting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            onClick={() => setShowWalletModal(true)}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Select Wallet</h3>
            <div className="space-y-2">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  className={`w-full p-2 rounded-lg text-white transition-all duration-200 ${
                    wallet.isDetected
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-400 hover:bg-gray-500"
                  }`}
                  onClick={() => connectWallet(wallet)}
                  disabled={isConnecting}
                >
                  {wallet.name} {wallet.isDetected ? "(Detected)" : ""}
                </button>
              ))}
            </div>
            <button
              className="mt-4 p-2 bg-gray-300 text-black rounded-lg w-full"
              onClick={() => setShowWalletModal(false)}
              disabled={isConnecting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <button
          className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md flex flex-col items-start disabled:bg-gray-400"
          onClick={() => handleVote(pollItems[0].name)}
          disabled={loading || !!networkError || !isWalletConnected || !contract}
        >
          <span className="text-lg font-medium">{pollItems[0].name}</span>
          <span className="text-sm text-gray-100">{pollItems[0].description}</span>
        </button>
        <button
          className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md flex flex-col items-start disabled:bg-gray-400"
          onClick={() => handleVote(pollItems[1].name)}
          disabled={loading || !!networkError || !isWalletConnected || !contract}
        >
          <span className="text-lg font-medium">{pollItems[1].name}</span>
          <span className="text-sm text-gray-100">{pollItems[1].description}</span>
        </button>
      </div>
    </div>
  );
}