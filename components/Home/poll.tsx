import React, { memo, useState, useEffect, useCallback } from "react";
import { useMiniAppContext } from "../../hooks/use-miniapp-context";
import { dApps, comparisonQuestions } from "../../lib/monadEcosystem";
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
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import Image from "next/image";

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
    injected({ target: "metaMask" }),
    injected({ target: "trustWallet" }),
    coinbaseWallet({ appName: "MiniPoll" }),
    injected(),
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
  connector: any;
  isDetected: boolean;
}

const MONAD_TESTNET_CHAIN_ID = 10143;

const supportedWallets: WalletOption[] = [
  { id: "metamask", name: "MetaMask", connector: injected({ target: "metaMask" }), isDetected: false },
  { id: "trustwallet", name: "Trust Wallet", connector: injected({ target: "trustWallet" }), isDetected: false },
  { id: "coinbase", name: "Coinbase Wallet", connector: coinbaseWallet({ appName: "MiniPoll" }), isDetected: false },
  { id: "other", name: "Other Injected Wallet", connector: injected(), isDetected: false },
];

// Debounce utility
function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const Poll = memo(({ userName }: { userName: string }) => {
  console.log("Poll component rendered at:", new Date().toISOString());
  const { actions, user } = useMiniAppContext();

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
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [voteCounts, setVoteCounts] = useState<{ [key: string]: number }>({});
  const [isLoadingVotes, setIsLoadingVotes] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  // Log user data to verify
  useEffect(() => {
    console.log("Warpcast User Data:", user);
  }, [user]);

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
            !window.ethereum.isRabby
        );
      }
      return { ...wallet, isDetected };
    });
    console.log("Detected wallets:", updatedWallets);
    setWalletOptions(updatedWallets);
  }, []);

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

      console.log("Fetching balance for:", address);
      const balanceData = await fetchBalance(config, {
        address: address as `0x${string}`,
        chainId: MONAD_TESTNET_CHAIN_ID,
      });
      console.log("Balance:", balanceData.value);
      setBalance(ethers.formatEther(balanceData.value));

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
      setRetryCount(0);
    } catch (error: any) {
      console.error("Error initializing contract:", error.message, error);
      setError(`Failed to initialize contract: ${error.message}. Retrying...`);
      setRetryCount((prev) => prev + 1);
    }
  }, [retryCount]);

  useEffect(() => {
    if (isWalletConnected) {
      initContract();
    }
  }, [isWalletConnected, initContract]);

  // Fetch vote counts
  const fetchVoteCounts = useCallback(async () => {
    if (!contract || !pollItems.length) {
      console.log("Cannot fetch vote counts: contract or pollItems not ready.");
      return;
    }
    setIsLoadingVotes(true);
    try {
      console.log("Fetching vote counts for:", pollItems.map((item) => item.name));
      const [count1, count2] = await Promise.all([
        contract.getVoteCount(pollItems[0].name),
        contract.getVoteCount(pollItems[1].name),
      ]);
      const counts = {
        [pollItems[0].name]: Number(count1),
        [pollItems[1].name]: Number(count2),
      };
      console.log("Vote counts:", counts);
      setVoteCounts(counts);
    } catch (error: any) {
      console.error("Error fetching vote counts:", error);
      setError(`Failed to fetch vote counts: ${error.message}`);
    } finally {
      setIsLoadingVotes(false);
    }
  }, [contract, pollItems]);

  useEffect(() => {
    if (contract && pollItems.length) {
      fetchVoteCounts();
    }
  }, [contract, pollItems, fetchVoteCounts]);

  // Generate a new poll with debounce
  const generatePoll = useCallback(
    debounce(() => {
      console.log("Generating poll at:", new Date().toISOString());
      const categories = [dApps];
      const selectedCategory = categories[0];
      const shuffledItems = [...selectedCategory].sort(() => Math.random() - 0.5);
      const twoItems = shuffledItems.slice(0, 2);

      const questionPool = comparisonQuestions.filter((q) => q.includes("dApp"));
      const selectedQuestion = questionPool[Math.floor(Math.random() * questionPool.length)];

      console.log("Poll items:", twoItems, "Question:", selectedQuestion);
      setPollItems(twoItems);
      setQuestion(selectedQuestion);
      setShowFeedback(false);
      setError(null);
      setVoteCounts({});
      fetchVoteCounts();
    }, 1000),
    [fetchVoteCounts]
  );

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      generatePoll();
    }
    return () => {
      isMounted = false;
    };
  }, [generatePoll]);

  // Handle wallet connection
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
        return;
      } catch (error: any) {
        console.error(`Wallet connection error (attempt ${attempt + 1}):`, error);
        if (
          error.message.includes("wallet_requestPermissions") &&
          error.message.includes("already pending")
        ) {
          console.log("Pending permissions detected, retrying after delay...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempt++;
          if (attempt === maxAttempts) {
            setNetworkError(
              `Failed to connect with ${wallet.name}: A wallet permission request is pending. Please resolve it in your wallet and try again.`
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
      setVoteCounts({});
      console.log("Wallet disconnected.");
    } catch (error: any) {
      console.error("Disconnect error:", error);
      setError("Failed to disconnect wallet: " + error.message);
    }
  };

  // Handle vote casting
  const handleVote = async (item: string) => {
    if (!contract || isVoting) {
      console.error("Vote attempted but contract is null or voting is in progress.");
      setError("Contract not initialized or voting in progress. Please wait and try again.");
      return;
    }

    setIsVoting(true);
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
      }

      setShowFeedback(true);
      setShowConfetti(true);
      await fetchVoteCounts();
      setTimeout(() => {
        setShowConfetti(false);
        generatePoll();
        setIsVoting(false);
      }, 2000);
    } catch (error: any) {
      console.error("Error casting vote:", error);
      setError(`Failed to cast vote: ${error.message}`);
      setIsVoting(false);
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

  // Calculate total votes for progress bar
  const totalVotes = (voteCounts[pollItems[0]?.name] || 0) + (voteCounts[pollItems[1]?.name] || 0);
  const option1Percentage =
    totalVotes > 0 ? ((voteCounts[pollItems[0]?.name] || 0) / totalVotes) * 100 : 50;
  const option2Percentage =
    totalVotes > 0 ? ((voteCounts[pollItems[1]?.name] || 0) / totalVotes) * 100 : 50;

  if (!pollItems.length && !showFeedback) {
    return <div className="text-center text-gray-500">Loading poll...</div>;
  }

  if (showFeedback) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
        <p className="text-lg text-green-600 font-medium">Vote submitted! Loading new poll...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={question}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Hey {user?.displayName || userName}, {question}
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
          {isLoadingVotes && <p className="text-blue-500 text-center mb-4">Loading vote counts...</p>}
          <div className="text-center mb-4">
            {isWalletConnected ? (
              <div className="flex flex-col items-center">
                {user?.pfp ? (
                  <Image
                    src={user.pfp}
                    alt="Profile"
                    className="w-12 h-12 rounded-full mb-2 border-2 border-blue-500"
                    width={48}
                    height={48}
                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/48")}
                  />
                ) : (
                  <Image
                    src="https://via.placeholder.com/48"
                    alt="Profile Placeholder"
                    className="w-12 h-12 rounded-full mb-2 border-2 border-blue-500"
                    width={48}
                    height={48}
                  />
                )}
                <p className="text-sm text-gray-600">Warpcast ID: {user?.fid || "N/A"}</p>
                {user?.username && <p className="text-sm text-gray-600">Username: {user.username}</p>}
                {user?.displayName && <p className="text-sm text-gray-600">Display Name: {user.displayName}</p>}
                <p className="text-sm text-gray-600">
                  Wallet: {account?.slice(0, 6)}...{account?.slice(-4)}
                </p>
                <p className="text-sm text-gray-600">Balance: {balance ? `${balance} MON` : "Loading..."}</p>
                <button
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 mt-2 shadow-md"
                  onClick={disconnectWallet}
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                className={`p-2 rounded-lg text-white transition-all duration-200 shadow-md ${
                  isConnecting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-600"
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
                      className={`w-full p-2 rounded-lg text-white transition-all duration-200 shadow-md ${
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
                  className="mt-4 p-2 bg-gray-300 text-black rounded-lg w-full shadow-md"
                  onClick={() => setShowWalletModal(false)}
                  disabled={isConnecting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <button
                className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md flex flex-col items-start disabled:bg-gray-400"
                onClick={() => handleVote(pollItems[0].name)}
                disabled={loading || !!networkError || !isWalletConnected || !contract || isVoting}
              >
                <span className="text-lg font-medium">{pollItems[0].name}</span>
                <span className="text-sm text-gray-100">{pollItems[0].description}</span>
                {voteCounts[pollItems[0].name] !== undefined && (
                  <span className="text-sm text-gray-100">Votes: {voteCounts[pollItems[0].name]}</span>
                )}
              </button>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${option1Percentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <button
                className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md flex flex-col items-start disabled:bg-gray-400"
                onClick={() => handleVote(pollItems[1].name)}
                disabled={loading || !!networkError || !isWalletConnected || !contract || isVoting}
              >
                <span className="text-lg font-medium">{pollItems[1].name}</span>
                <span className="text-sm text-gray-100">{pollItems[1].description}</span>
                {voteCounts[pollItems[1].name] !== undefined && (
                  <span className="text-sm text-gray-100">Votes: {voteCounts[pollItems[1].name]}</span>
                )}
              </button>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${option2Percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

Poll.displayName = "Poll";

export default Poll;