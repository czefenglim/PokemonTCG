// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TradeCards {
    struct Trade {
        address sender;
        address receiver;
        uint256 cardId;
        uint256 timestamp;
    }

    mapping(address => Trade[]) private trades;

    event TradeRecorded(address indexed sender, address indexed receiver, uint256 cardId, uint256 timestamp);

    function recordTrade(address receiver, uint256 cardId) external {
        Trade memory newTrade = Trade({
            sender: msg.sender,
            receiver: receiver,
            cardId: cardId,
            timestamp: block.timestamp
        });

        trades[msg.sender].push(newTrade);
        emit TradeRecorded(msg.sender, receiver, cardId, block.timestamp);
    }

    function getMyTrades() external view returns (Trade[] memory) {
        return trades[msg.sender];
    }
}
