import { ethers } from "ethers";

const contractAddress = "0x85A1150f49A0e534a13D6b59740E80c45ab0Aa47";
const contractABI = [
  "function castVote(string memory item) public",
  "function getVoteCount(string memory item) public view returns (uint256)",
  "event VoteCast(string item, uint256 voteCount)",
];

export const getContract = async () => {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask!");
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};