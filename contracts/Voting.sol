// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    mapping(string => uint256) public votes;
    event VoteCast(string item, uint256 voteCount);

    function castVote(string memory item) public {
        votes[item]++;
        emit VoteCast(item, votes[item]);
    }

    function getVoteCount(string memory item) public view returns (uint256) {
        return votes[item];
    }
}