require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { ethers } = require("ethers");

// Check if PRIVATE_KEY is loaded
if (!process.env.PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY is not defined in the .env file");
  process.exit(1);
}

try {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  console.log("Wallet Address:", wallet.address);
} catch (error) {
  console.error("Error deriving wallet address:", error.message);
  process.exit(1);
}