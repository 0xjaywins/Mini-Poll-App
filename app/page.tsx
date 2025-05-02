'use client';

import { useMiniAppContext } from '../hooks/use-miniapp-context';
import { monadTestnet } from 'wagmi/chains'; // Updated import
import { useAccount, useSwitchChain } from 'wagmi';

export default function Page() {
  const { context, actions } = useMiniAppContext();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const handleCatsVote = () => {
    if (actions?.composeCast) {
      actions.composeCast({
        text: "I voted Cats! 🐱 #MiniPoll",
        embeds: [],
      });
      console.log("Thanks for voting!");
    } else {
      console.log("Actions not available");
    }
  };

  const handleDogsVote = () => {
    if (actions?.composeCast) {
      actions.composeCast({
        text: "I voted Dogs! 🐶 #MiniPoll",
        embeds: [],
      });
      console.log("Thanks for voting!");
    } else {
      console.log("Actions not available");
    }
  };

  const userName = context?.user?.displayName || "User";
  const isCorrectChain = chainId === monadTestnet.id;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center">
        Mini Poll App
      </h1>
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex flex-col items-center space-y-4">
          {!isCorrectChain ? (
            <div className="text-center space-y-2">
              <p className="text-red-400">
                Please switch to Monad Testnet to use this app.
              </p>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
                onClick={() => switchChain({ chainId: monadTestnet.id })}
              >
                Switch to Monad Testnet
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl">
                Hey {userName}, Cats or Dogs?
              </h2>
              <div className="space-x-4">
                <button
                  className="px-4 py-2 text-lg bg-gray-600 text-white rounded hover:bg-gray-500 transition"
                  onClick={handleCatsVote}
                >
                  Cats 🐱
                </button>
                <button
                  className="px-4 py-2 text-lg bg-gray-600 text-white rounded hover:bg-gray-500 transition"
                  onClick={handleDogsVote}
                >
                  Dogs 🐶
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}