import { useState, useEffect, useCallback } from "react";
import { useMiniAppContext } from "../../hooks/use-miniapp-context";
import { dApps, tokens, nfts, comparisonQuestions } from "../../lib/monadEcosystem";

interface PollItem {
  name: string;
  description: string;
}

export default function Poll({ userName }: { userName: string }) {
  const { actions } = useMiniAppContext();
  const [pollItems, setPollItems] = useState<PollItem[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);

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
  }, []);

  // Initial poll generation
  useEffect(() => {
    generatePoll();
  }, [generatePoll]);

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

    // Show feedback and then generate a new poll
    setShowFeedback(true);
    setTimeout(() => {
      generatePoll();
    }, 1000); // Show feedback for 1 second
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
      <div className="space-y-4">
        <button
          className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md flex flex-col items-start"
          onClick={() => handleVote(pollItems[0].name)}
        >
          <span className="text-lg font-medium">{pollItems[0].name}</span>
          <span className="text-sm text-gray-100">{pollItems[0].description}</span>
        </button>
        <button
          className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md flex flex-col items-start"
          onClick={() => handleVote(pollItems[1].name)}
        >
          <span className="text-lg font-medium">{pollItems[1].name}</span>
          <span className="text-sm text-gray-100">{pollItems[1].description}</span>
        </button>
      </div>
    </div>
  );
}