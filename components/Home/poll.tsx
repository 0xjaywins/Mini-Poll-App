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
import confetti from "canvas-confetti";
import Image from "next/image";

// Monad Testnet chain configuration
const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
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
  { id: "other", name: "Other Wallet", connector: injected(), isDetected: false },
];

const Poll = memo(({ userName }: { userName: string }) => {
  console.log("Poll component rendered at:", new Date().toISOString());
  const { actions, user } = useMiniAppContext();

  const [pollItems, setPollItems] = useState<PollItem[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [prevQuestion, setPrevQuestion] = useState<string | null>(null);
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

  // Log user data
  useEffect(() => {
    console.log("Warpcast User Data:", user);
  }, [user]);

  // Detect wallets
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

  // Initialize contract
  const initContract = useCallback(async () => {
    if (retryCount >= 3) {
      console.error("Max retries reached for contract initialization.");
      setError("Failed to initialize contract after multiple attempts.");
      return;
    }

    try {
      console.log("Initializing contract, attempt:", retryCount + 1);
      const isNetworkCorrect = await checkNetworkAndAccount();
      console.log("Network correct:", isNetworkCorrect);
      if (!isNetworkCorrect) {
        console.error("Network check failed.");
        setError("Please connect your wallet to Monad Testnet.");
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

  // Generate poll
  const generatePoll = useCallback(() => {
    console.log("Generating poll at:", new Date().toISOString());
    const categories = [dApps];
    const selectedCategory = categories[0];
    const shuffledItems = [...selectedCategory].sort(() => Math.random() - 0.5);
    const twoItems = shuffledItems.slice(0, 2);

    const questionPool = comparisonQuestions.filter((q) => q.includes("dApp") && q !== prevQuestion);
    const selectedQuestion =
      questionPool.length > 0
        ? questionPool[Math.floor(Math.random() * questionPool.length)]
        : comparisonQuestions.find((q) => q.includes("dApp")) || "Which dApp is better?";

    console.log("Previous question:", prevQuestion, "New question:", selectedQuestion);
    setPollItems(twoItems);
    setQuestion(selectedQuestion);
    setPrevQuestion(selectedQuestion);
    setShowFeedback(false);
    setError(null);
    setVoteCounts({});
    fetchVoteCounts();
  }, [fetchVoteCounts, prevQuestion]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      generatePoll();
    }
    return () => {
      isMounted = false;
    };
  }, [generatePoll]);

  // Connect wallet
  const connectWallet = async (wallet: WalletOption) => {
    if (isConnecting) {
      console.log("Connection already in progress...");
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
          console.log("Pending permissions detected, retrying...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempt++;
          if (attempt === maxAttempts) {
            setNetworkError(
              `Failed to connect with ${wallet.name}: A wallet permission request is pending.`
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

  // Disconnect wallet
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

  // Handle vote
  const handleVote = async (item: string) => {
    if (!contract || isVoting) {
      console.error("Vote attempted but contract is null or voting in progress.");
      setError("Contract not initialized or voting in progress.");
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

  // Trigger confetti
  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
        disableForReducedMotion: true,
      });
    }
  }, [showConfetti]);

  // Retry contract initialization
  const handleRetry = () => {
    console.log("Retrying contract initialization...");
    setError(null);
    setRetryCount(0);
    initContract();
  };

  // Calculate vote percentages
  const totalVotes = (voteCounts[pollItems[0]?.name] || 0) + (voteCounts[pollItems[1]?.name] || 0);
  const option1Percentage = totalVotes > 0 ? ((voteCounts[pollItems[0]?.name] || 0) / totalVotes) * 100 : 50;
  const option2Percentage = totalVotes > 0 ? ((voteCounts[pollItems[1]?.name] || 0) / totalVotes) * 100 : 50;

  if (!pollItems.length && !showFeedback) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading poll...</span>
      </div>
    );
  }

  if (showFeedback) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-semibold text-success-600 dark:text-success-400"
        >
          Vote submitted! Loading new poll...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 font-inter">MiniPoll: Monad Ecosystem</h1>
        <p className="text-gray-600 dark:text-gray-300">Vote on your favorite dApps and share on Warpcast!</p>
      </header>
      <AnimatePresence mode="wait">
        <motion.div
          key={question}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 text-center font-inter">
            Hey {user?.displayName || userName}, {question}
          </h2>
          {networkError && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 rounded-lg text-center animate-pulse">
              <p className="text-red-600 dark:text-red-300 font-medium">{networkError}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Try MetaMask for the best experience.
              </p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 rounded-lg text-center animate-pulse">
              <p className="text-red-600 dark:text-red-300 font-medium">{error}</p>
              {retryCount < 3 && (
                <button
                  className="mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200"
                  onClick={handleRetry}
                  aria-label="Retry contract initialization"
                >
                  Retry
                </button>
              )}
            </div>
          )}
          {(loading || isLoadingVotes) && (
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-primary-500 dark:text-primary-400">
                {loading ? "Processing vote..." : "Loading votes..."}
              </span>
            </div>
          )}
          <div className="text-center mb-6">
            {isWalletConnected ? (
              <div className="flex flex-col items-center">
                {user?.pfp ? (
                  <Image
                    src={user.pfp}
                    alt="Profile picture"
                    className="w-12 h-12 rounded-full mb-2 border-2 border-primary-500"
                    width={48}
                    height={48}
                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/48")}
                  />
                ) : (
                  <Image
                    src="https://via.placeholder.com/48"
                    alt="Profile placeholder"
                    className="w-12 h-12 rounded-full mb-2 border-2 border-primary-500"
                    width={48}
                    height={48}
                  />
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300">Warpcast ID: {user?.fid || "N/A"}</p>
                {user?.username && <p className="text-sm text-gray-600 dark:text-gray-300">Username: {user.username}</p>}
                {user?.displayName && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Display Name: {user.displayName}</p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Wallet: {account?.slice(0, 6)}...{account?.slice(-4)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Balance: {balance ? `${balance} MON` : "Loading..."}
                </p>
                <button
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-105 transition-all duration-200"
                  onClick={disconnectWallet}
                  aria-label="Disconnect wallet"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                className={`px-4 py-2 rounded-lg text-white transition-all duration-200 font-medium hover:scale-105 ${
                  isConnecting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary-500 hover:bg-primary-600"
                }`}
                onClick={() => setShowWalletModal(true)}
                disabled={isConnecting}
                aria-label="Connect wallet"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
          {showWalletModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-sm w-full"
              >
                <h3 className="text-lg font-semibold mb-4 font-inter text-gray-800 dark:text-gray-100">
                  Select Wallet
                </h3>
                <div className="space-y-2">
                  {walletOptions.map((wallet) => (
                    <button
                      key={wallet.id}
                      className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 ${
                        wallet.isDetected
                          ? "bg-primary-500 hover:bg-primary-600"
                          : "bg-gray-400 hover:bg-gray-500"
                      }`}
                      onClick={() => connectWallet(wallet)}
                      disabled={isConnecting}
                      aria-label={`Connect with ${wallet.name}`}
                    >
                      {wallet.name} {wallet.isDetected ? "(Detected)" : ""}
                    </button>
                  ))}
                </div>
                <button
                  className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                  onClick={() => setShowWalletModal(false)}
                  disabled={isConnecting}
                  aria-label="Cancel wallet selection"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          )}
          <div className="space-y-6">
            {pollItems.map((item, index) => (
              <div key={item.name}>
                <button
                  className={`w-full p-4 bg-primary-500 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 hover:scale-105 transition-all duration-200 flex flex-col items-start disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 shadow-md`}
                  onClick={() => handleVote(item.name)}
                  disabled={loading || !!networkError || !isWalletConnected || !contract || isVoting}
                  aria-label={`Vote for ${item.name}`}
                >
                  <span className="text-lg font-semibold font-inter">{item.name}</span>
                  <span className="text-sm text-gray-100">{item.description}</span>
                  {voteCounts[item.name] !== undefined && (
                    <span className="text-sm text-gray-100 mt-1">
                      Votes: {voteCounts[item.name]} (
                      {(index === 0 ? option1Percentage : option2Percentage).toFixed(1)}%)
                    </span>
                  )}
                </button>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
                  <motion.div
                    className="bg-primary-600 dark:bg-primary-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${index === 0 ? option1Percentage : option2Percentage}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

Poll.displayName = "Poll";

export default Poll;