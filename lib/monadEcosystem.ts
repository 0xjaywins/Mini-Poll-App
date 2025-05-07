// Monad Ecosystem dApps, Tokens, and NFTs Categorized

// dApps categorized by type
const aiAndData = [
  { name: "AiCraft.fun", description: "AI-agent launchpad for decentralized AI agents" },
  { name: "Catton AI", description: "AI-based protocol for predictive analytics" },
  { name: "Codatta", description: "Data-centric dApp focused on on-chain analytics and AI insights" },
  { name: "Anima", description: "Identity and AI-focused project for user data sovereignty" },
  { name: "NeuralNest", description: "AI platform for decentralized machine learning models" },
  { name: "DataSphere", description: "Protocol for secure, decentralized data sharing" },
];

const defi = [
  { name: "Biconomy", description: "Toolkit for user-friendly dApps with gasless transactions" },
  { name: "Ambient", description: "Decentralized AMM for efficient trading" },
  { name: "Ammalgam", description: "Automated Market Maker with cross-chain support" },
  { name: "Balancer", description: "Popular decentralized trading protocol and portfolio manager" },
  { name: "Bebop", description: "DeFi aggregator for optimized token swaps" },
  { name: "Curvance", description: "Lending and borrowing protocol with dynamic rates" },
  { name: "Crystal", description: "DeFi staking platform with high-yield opportunities" },
  { name: "Caddy Finance", description: "Yield aggregator for DeFi lending" },
  { name: "PumpBTC", description: "Bitcoin-focused yield farming protocol" },
  { name: "Primex Finance", description: "Decentralized credit protocol for margin trading" },
  { name: "Plato", description: "Savings and aggregation platform for DeFi yields" },
  { name: "AZEx", description: "Decentralized Exchange with low fees" },
  { name: "AUSD", description: "Stablecoin pegged to USD for DeFi applications" },
  { name: "Crust Finance", description: "Synthetic assets and vaults for DeFi" },
  { name: "Blazpay", description: "Payment infrastructure for DeFi transactions" },
  { name: "Pingu Exchange", description: "DEX with a focus on user experience" },
  { name: "Renzo", description: "Restaking protocol for enhanced rewards" },
  { name: "Rubic", description: "Multi-chain swap aggregator for seamless trades" },
  { name: "Rysk", description: "Options trading protocol with risk management" },
  { name: "Atlantis", description: "DeFi ecosystem for trading and lending" },
  { name: "ApeBond", description: "Bonding and lending app from the ApeSwap lineage" },
  { name: "Velodrome", description: "AMM and liquidity protocol for DeFi" },
  { name: "SushiSwap", description: "Popular DEX with yield farming and staking" },
  { name: "Compound", description: "Lending and borrowing protocol for DeFi assets" },
  { name: "Uniswap", description: "Leading decentralized exchange for token swaps" },
];

const gamingAndBetting = [
  { name: "Dusted", description: "Social platform for token-specific chat rooms with gaming elements" },
  { name: "Rug Rumble", description: "Web3 game based on rug-pull humor and mechanics" },
  { name: "RareBetSports", description: "Decentralized sports betting dApp with live odds" },
  { name: "Proof-of-Skill", description: "Gaming platform rewarding users for skill-based play" },
  { name: "PLAY Network", description: "Gaming infrastructure for blockchain-based games" },
  { name: "CryptoQuest", description: "RPG game with NFT-based characters and rewards" },
  { name: "Betify", description: "Prediction market and betting platform for Web3 users" },
  { name: "PixelPals", description: "NFT-based pet game with play-to-earn mechanics" },
];

const socialIdentityNFT = [
  { name: "Apriori", description: "Reputation and identity system for Web3 communities" },
  { name: "CoNFT", description: "Platform for co-ownership of NFTs" },
  { name: "Chaquen", description: "Social platform for NFT collectors and creators" },
  { name: "Poply", description: "Web3 content creation and social platform" },
  { name: "Rabble", description: "Community and social coordination app for Web3" },
  { name: "Redbrick", description: "Social platform for NFT communities" },
  { name: "Anima", description: "Identity and credentials platform for Web3 users" },
  { name: "NFTVerse", description: "Marketplace and social hub for NFT trading" },
  { name: "Soulbound", description: "Platform for non-transferable NFTs tied to identity" },
];

const infraAndTooling = [
  { name: "MonadPad", description: "Token launchpad for diverse Monad projects" },
  { name: "Acurast", description: "Decentralized compute and oracle layer for dApps" },
  { name: "Accountable", description: "Governance and accountability tooling for DAOs" },
  { name: "Castora", description: "Protocol tooling for smart contract development" },
  { name: "Blocklive", description: "Real-time on-chain events and analytics infrastructure" },
  { name: "Covenant", description: "Smart contract and DAO governance tooling" },
  { name: "Bima", description: "Modular infrastructure for insurance and risk management" },
  { name: "Bean Exchange", description: "Infrastructure for cross-chain trading" },
  { name: "Chainlink", description: "Decentralized oracle network for secure data feeds" },
  { name: "Gelato", description: "Automation and off-chain computation for dApps" },
  { name: "The Graph", description: "Indexing protocol for querying blockchain data" },
];

const unclassified = [
  { name: "Amertis", description: "Description pending (likely a new project)" },
  { name: "Azaar", description: "Description pending (possibly a DeFi or NFT project)" },
  { name: "Clober", description: "Options or derivatives exchange" },
  { name: "NovaNet", description: "Description pending (could be infrastructure)" },
  { name: "Zestify", description: "Description pending (possibly a DeFi app)" },
];

// Combine all dApps into a single array for polling
export const dApps = [
  ...aiAndData,
  ...defi,
  ...gamingAndBetting,
  ...socialIdentityNFT,
  ...infraAndTooling,
  ...unclassified,
];

// Tokens in the Monad Ecosystem
export const tokens = [
  { name: "MON", description: "Native token of the Monad blockchain" },
  { name: "mUSD", description: "Stablecoin pegged to USD for DeFi on Monad" },
  { name: "mBTC", description: "Wrapped Bitcoin token for use in Monad DeFi" },
  { name: "mETH", description: "Wrapped Ethereum token for cross-chain applications" },
  { name: "AICT", description: "Governance token for AiCraft.fun" },
  { name: "BICO", description: "Governance token for Biconomy" },
  { name: "BAL", description: "Governance token for Balancer" },
  { name: "RBC", description: "Governance token for Rubic" },
  { name: "PINGU", description: "Utility token for Pingu Exchange" },
  { name: "PLAY", description: "Reward token for PLAY Network" },
  { name: "RUG", description: "Meme token for Rug Rumble game" },
  { name: "LINK", description: "Utility token for Chainlink oracles" },
  { name: "GEL", description: "Utility token for Gelato automation" },
  { name: "UNI", description: "Governance token for Uniswap" },
  { name: "COMP", description: "Governance token for Compound" },
];

// NFTs in the Monad Ecosystem
export const nfts = [
  { name: "Monad Pioneers", description: "Exclusive NFTs for early Monad adopters" },
  { name: "AiCraft Agents", description: "NFT-based AI agents from AiCraft.fun" },
  { name: "Rug Rumble Cards", description: "Collectible cards for Rug Rumble game" },
  { name: "PixelPals Pets", description: "NFT pets for the PixelPals game" },
  { name: "Chaquen Artworks", description: "Cultural NFTs from the Chaquen platform" },
  { name: "Poply Creations", description: "User-generated NFTs on the Poply platform" },
  { name: "Soulbound IDs", description: "Non-transferable identity NFTs from Soulbound" },
  { name: "NFTVerse Collectibles", description: "Rare collectibles from NFTVerse marketplace" },
  { name: "CryptoQuest Heroes", description: "NFT characters for the CryptoQuest RPG" },
  { name: "Redbrick Avatars", description: "Customizable avatars for Redbrick communities" },
];

// Comparison Questions for Polls
export const comparisonQuestions = [
  // dApp Questions
  "Which dApp offers the best user experience?",
  "Which dApp is more innovative in the Monad ecosystem?",
  "Which dApp would you use daily for DeFi activities?",
  "Which dApp has the most potential for AI integration?",
  "Which dApp is better for gaming and entertainment?",
  "Which dApp provides the best infrastructure for developers?",
  "Which dApp would you recommend for NFT collectors?",
  "Which dApp is more likely to succeed in the long term?",
  "Which dApp offers the most secure transactions?",
  "Which dApp is more fun to interact with?",
  "Which dApp has the best community support?",
  "Which dApp would you trust with your funds?",
  "Which dApp is more user-friendly for beginners?",
  "Which dApp has the most exciting roadmap?",
  "Which dApp is better for social engagement?",

  // Token Questions
  "Which token has the most utility in the Monad ecosystem?",
  "Which token would you stake for the best rewards?",
  "Which token is more likely to increase in value?",
  "Which token offers the best governance features?",
  "Which token would you use for daily transactions?",
  "Which token is more stable for DeFi applications?",
  "Which token has the strongest community backing?",
  "Which token would you hold for the long term?",
  "Which token is better for cross-chain swaps?",
  "Which token has the most innovative use case?",
  "Which token would you use in a game or betting platform?",
  "Which token offers the best incentives for holders?",
  "Which token is more likely to be adopted widely?",
  "Which token has the best liquidity on Monad?",
  "Which token would you trust for secure transactions?",

  // NFT Questions
  "Which NFT collection has the best artwork?",
  "Which NFT would you want to own as a collectible?",
  "Which NFT offers the most utility in games?",
  "Which NFT is more likely to increase in value?",
  "Which NFT collection has the best community?",
  "Which NFT would you use as a profile picture?",
  "Which NFT offers the most unique features?",
  "Which NFT is better for social status in Web3?",
  "Which NFT collection is more innovative?",
  "Which NFT would you gift to a friend?",
  "Which NFT has the most cultural significance?",
  "Which NFT offers the best play-to-earn rewards?",
  "Which NFT is more exclusive and rare?",
  "Which NFT would you trade for another asset?",
  "Which NFT collection would you invest in long-term?",
];