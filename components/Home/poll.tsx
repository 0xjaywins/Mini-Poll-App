import React, { memo, useState, useEffect, useCallback } from "react";
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

const Poll = memo(({ userName }: { userName: string }) => {
  const { actions, user } = useMiniAppContext();
  const [pollItems, setPollItems] = useState<PollItem[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [category, setCategory] = useState<"dApps" | "tokens" | "nfts">("dApps");
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
  const [voteCounts, setVoteCounts] = useState<{ [key: string]: string }>({});
  const [isLoadingVotes, setIsLoadingVotes] = useState<boolean>(false);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  useEffect(() => {
    console.log("Warpcast User Data:", user);
    // Additional logging for PFP
    console.log("User PFP URL:", user?.pfp);
  }, [user]);

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
        [pollItems[0].name]: count1.toString(),
        [pollItems[1].name]: count2.toString(),
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

  const generatePoll = useCallback(() => {
    console.log("Generating new poll...");
    const categories = [
      { name: "dApps", items: dApps },
      { name: "tokens", items: tokens },
      { name: "nfts", items: nfts },
    ] as const;
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    const shuffledItems = [...selectedCategory.items].sort(() => Math.random() - 0.5);
    const twoItems = shuffledItems.slice(0, 2);

    let questionPool: string[];
    if (selectedCategory.name === "dApps") {
      questionPool = comparisonQuestions.filter((q) => q.includes("dApp"));
    } else if (selectedCategory.name === "tokens") {
      questionPool = comparisonQuestions.filter((q) => q.includes("token"));
    } else {
      questionPool = comparisonQuestions.filter((q) => q.includes("NFT"));
    }
    const selectedQuestion = questionPool[Math.floor(Math.random() * questionPool.length)];

    console.log("Category:", selectedCategory.name, "Poll items:", twoItems, "Question:", selectedQuestion);
    setCategory(selectedCategory.name);
    setPollItems(twoItems);
    setQuestion(selectedQuestion);
    setShowFeedback(false);
    setError(null);
    setVoteCounts({});
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      generatePoll();
    }
    return () => {
      isMounted = false;
    };
  }, [generatePoll]);

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

  const handleVote = async (item: string) => {
    if (!contract || isVoting) {
      console.error("Vote attempted but contract is null or voting in progress.");
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
          text: `I voted for ${item} in the ${category} category! #MiniPoll`,
          embeds: [],
        });
        console.log("Cast posted.");
      }

      setShowFeedback(true);
      await fetchVoteCounts();
      setTimeout(() => {
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

  const handleRetry = () => {
    console.log("Retrying contract initialization...");
    setError(null);
    setRetryCount(0);
    initContract();
  };

  const totalVotes = (parseInt(voteCounts[pollItems[0]?.name] || "0") + parseInt(voteCounts[pollItems[1]?.name] || "0")).toString();
  const option1Percentage =
    totalVotes !== "0" ? (parseInt(voteCounts[pollItems[0]?.name] || "0") / parseInt(totalVotes)) * 100 : 50;
  const option2Percentage =
    totalVotes !== "0" ? (parseInt(voteCounts[pollItems[1]?.name] || "0") / parseInt(totalVotes)) * 100 : 50;

  if (!pollItems.length && !showFeedback) {
    return (
      <div className="text-center text-gray-500 animate-pulse">
        Loading poll...
      </div>
    );
  }

  if (showFeedback) {
    return (
      <div className="max-w-md mx-auto p-6 bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-xl text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="particle absolute rounded-full animate-particle"
              style={{
                backgroundColor: ["#3B82F6", "#16A34A", "#EF4444", "#FBBF24"][Math.floor(Math.random() * 4)],
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 1}s`,
              }}
            />
          ))}
        </div>
        <p className="text-lg text-green-600 font-semibold animate-bounce relative z-10">
          Vote submitted! Loading new poll...
        </p>
      </div>
    );
  }

  // Determine the profile picture URL with a fallback
  const profilePicUrl = user?.pfp && typeof user.pfp === "string" && user.pfp.startsWith("http")
    ? user.pfp
    : "https://via.placeholder.com/56";

  return (
    <div className="max-w-md mx-auto p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl border-2 border-blue-200/50">
      <div key={question} className="animate-fadeIn">
        <h1 className="text-3xl font-extrabold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text drop-shadow-lg animate-pulse">
        Pick Your favourite projects on Monad
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          Hey {user?.displayName || userName}, {question}
        </h2>
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm capitalize font-medium shadow-md transform hover:scale-105 transition-transform duration-200">
            {category}
          </span>
        </div>
        {networkError && (
          <div className="text-center mb-4 p-4 bg-red-50 rounded-lg shadow-md">
            <p className="text-red-600 font-medium">{networkError}</p>
            <p className="text-sm text-gray-600 mt-2">
              If using a wallet other than MetaMask, we recommend trying MetaMask for the best experience.
            </p>
          </div>
        )}
        {error && (
          <div className="text-center mb-4 p-4 bg-red-50 rounded-lg shadow-md">
            <p className="text-red-600 font-medium">{error}</p>
            {retryCount < 3 && (
              <button
                className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transform hover:scale-105 transition-all duration-200"
                onClick={handleRetry}
              >
                Retry
              </button>
            )}
          </div>
        )}
        {loading && (
          <p className="text-blue-600 text-center mb-4 font-medium animate-pulse">
            Waiting for transaction confirmation...
          </p>
        )}
        {isLoadingVotes && (
          <p className="text-blue-600 text-center mb-4 font-medium animate-pulse">
            Loading vote counts...
          </p>
        )}
        <div className="text-center mb-6">
          {isWalletConnected ? (
            <div className="flex flex-col items-center bg-gradient-to-b from-gray-50 to-white p-4 rounded-lg shadow-lg">
              <Image
                src={profilePicUrl}
                alt="Profile"
                className="w-14 h-14 rounded-full mb-3 border-4 border-gradient-to-r from-blue-400 to-purple-400 shadow-lg transform hover:scale-110 transition-transform duration-200"
                width={56}
                height={56}
                onError={(e) => {
                  console.error("Failed to load profile picture, falling back to placeholder.");
                  e.currentTarget.src = "https://via.placeholder.com/56";
                }}
              />
              <p className="text-sm text-gray-700 font-medium">Warpcast ID: {user?.fid || "N/A"}</p>
              {user?.username && <p className="text-sm text-gray-700 font-medium">Username: {user.username}</p>}
              {user?.displayName && <p className="text-sm text-gray-700 font-medium">Display Name: {user.displayName}</p>}
              <p className="text-sm text-gray-700 font-medium">
                Wallet: {account?.slice(0, 6)}...{account?.slice(-4)}
              </p>
              <p className="text-sm text-gray-700 font-medium">Balance: {balance ? `${balance} MON` : "Loading..."}</p>
              <button
                className="mt-3 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg shadow-lg hover:from-red-600 hover:to-red-800 transform hover:scale-105 transition-all duration-200"
                onClick={disconnectWallet}
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <button
              className={`px-4 py-2 rounded-lg text-white shadow-lg transform hover:scale-105 transition-all duration-200 ${
                isConnecting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
              }`}
              onClick={() => setShowWalletModal(true)}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
        {showWalletModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full border-2 border-blue-200/50">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">Select Wallet</h3>
              <div className="space-y-3">
                {walletOptions.map((wallet) => (
                  <button
                    key={wallet.id}
                    className={`w-full px-4 py-3 rounded-lg text-white shadow-md transform hover:scale-105 transition-all duration-200 ${
                      wallet.isDetected
                        ? "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                        : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600"
                    }`}
                    onClick={() => connectWallet(wallet)}
                    disabled={isConnecting}
                  >
                    {wallet.name} {wallet.isDetected ? "(Detected)" : ""}
                  </button>
                ))}
              </div>
              <button
                className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 rounded-lg w-full shadow-md hover:from-gray-400 hover:to-gray-500 transform hover:scale-105 transition-all duration-200"
                onClick={() => setShowWalletModal(false)}
                disabled={isConnecting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="space-y-6">
          <div>
            <button
              className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 flex flex-col items-start disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
              onClick={() => handleVote(pollItems[0].name)}
              disabled={loading || !!networkError || !isWalletConnected || !contract || isVoting}
            >
              <span className="text-lg font-semibold">{pollItems[0].name}</span>
              <span className="text-sm text-gray-100">{pollItems[0].description}</span>
              {voteCounts[pollItems[0].name] !== undefined && (
                <span className="text-sm text-gray-100 mt-1">Votes: {voteCounts[pollItems[0].name]}</span>
              )}
            </button>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${option1Percentage}%` }}
              ></div>
            </div>
          </div>
          <div>
            <button
              className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 flex flex-col items-start disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
              onClick={() => handleVote(pollItems[1].name)}
              disabled={loading || !!networkError || !isWalletConnected || !contract || isVoting}
            >
              <span className="text-lg font-semibold">{pollItems[1].name}</span>
              <span className="text-sm text-gray-100">{pollItems[1].description}</span>
              {voteCounts[pollItems[1].name] !== undefined && (
                <span className="text-sm text-gray-100 mt-1">Votes: {voteCounts[pollItems[1].name]}</span>
              )}
            </button>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${option2Percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        <button
          className="mt-6 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-lg shadow-lg hover:from-gray-600 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 w-full"
          onClick={generatePoll}
          disabled={isVoting}
        >
          Skip to Next Question
        </button>
      </div>
    </div>
  );
});

Poll.displayName = "Poll";

export default Poll;