const { ethers } = require("ethers");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
console.log("Wallet Address:", wallet.address);