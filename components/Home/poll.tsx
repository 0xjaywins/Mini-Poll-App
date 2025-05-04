// components/Home/Poll.tsx
import { useState, useEffect } from "react";
import { useMiniAppContext } from "../../hooks/use-miniapp-context"; // Import to access actions
import { dApps, tokens, nfts, comparisonQuestions } from "../../lib/monadEcosystem";

interface PollItem {
  name: string;
  description: string;
}

export default function Poll({ userName }: { userName: string }) {
  const { actions } = useMiniAppContext(); // Get actions for posting to Warpcast
  const [pollItems, setPollItems] = useState<PollItem[]>([]);
  const [question, setQuestion] = useState<string>("");

  useEffect(() => {
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
  }, []);

  const handleVote = (item: string) => {
    if (actions?.composeCast) {
      actions.composeCast({
        text: `I voted for ${item}! #MiniPoll`,
        embeds: [],
      });
      console.log("Thanks for voting!");
    } else {
      console.log("Actions not available");
    }
  };

  if (!pollItems.length) return <div>Loading poll...</div>;

  return (
    <div>
      <h2 className="text-2xl">
        Hey {userName}, {question}
      </h2>
      <div className="space-x-4">
        <button
          className="px-4 py-2 text-lg bg-gray-600 text-white rounded hover:bg-gray-500 transition"
          onClick={() => handleVote(pollItems[0].name)}
        >
          {pollItems[0].name} ({pollItems[0].description})
        </button>
        <button
          className="px-4 py-2 text-lg bg-gray-600 text-white rounded hover:bg-gray-500 transition"
          onClick={() => handleVote(pollItems[1].name)}
        >
          {pollItems[1].name} ({pollItems[1].description})
        </button>
      </div>
    </div>
  );
}