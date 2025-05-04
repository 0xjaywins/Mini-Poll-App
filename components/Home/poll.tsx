// components/Home/Poll.tsx
import { useState, useEffect } from "react";
import { dApps, tokens, nfts, comparisonQuestions } from "../../lib/monadEcosystem";

interface PollItem {
  name: string;
  description: string;
}

export default function Poll({ userName }: { userName: string }) {
  const [pollItems, setPollItems] = useState<PollItem[]>([]);
  const [question, setQuestion] = useState<string>("");

  useEffect(() => {
    // Randomly select a category (dApps, tokens, or NFTs)
    const categories = [dApps, tokens, nfts];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];

    // Randomly select two items from the category
    const shuffledItems = [...selectedCategory].sort(() => Math.random() - 0.5);
    const twoItems = shuffledItems.slice(0, 2);

    // Select a question based on the category
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

  const handleVote = async (item: string) => {
    // Implement voting logic (e.g., post to Warpcast feed)
    const message = `I voted for ${item}! #MiniPoll`;
    // Add logic to post to Warpcast feed (likely via an API or SDK)
    console.log(message);
  };

  if (!pollItems.length) return <div>Loading poll...</div>;

  return (
    <div>
      <h2>Hey {userName}, {question}</h2>
      <button onClick={() => handleVote(pollItems[0].name)}>
        {pollItems[0].name} ({pollItems[0].description})
      </button>
      <button onClick={() => handleVote(pollItems[1].name)}>
        {pollItems[1].name} ({pollItems[1].description})
      </button>
    </div>
  );
}