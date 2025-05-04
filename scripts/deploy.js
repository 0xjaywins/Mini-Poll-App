const hre = require("hardhat");
const prompts = require("prompts");

async function main() {
  // Prompt for the private key
  const response = await prompts({
    type: "password",
    name: "privateKey",
    message: "Enter your private key for Monad Testnet:",
    validate: (value) =>
      /^[0-9a-fA-F]{64}$/.test(value)
        ? true
        : "Private key must be a 64-character hexadecimal string",
  });

  const privateKey = response.privateKey;
  if (!privateKey) {
    console.error("No private key provided. Exiting.");
    process.exit(1);
  }

  // Use Hardhat's default provider for the selected network (monadTestnet)
  const provider = hre.ethers.provider;

  // Set up the wallet with the provided private key
  const wallet = new hre.ethers.Wallet(privateKey, provider);

  // Get the contract factory with the wallet as the signer
  const Voting = await hre.ethers.getContractFactory("Voting", wallet);

  // Deploy the contract
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  console.log("Voting contract deployed to:", await voting.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});