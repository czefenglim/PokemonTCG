// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TradeContract is Ownable, ERC1155Holder {
    address public tokenContract;
    
    enum TradeStatus { PENDING, COMPLETED, CANCELLED }
    
    struct PendingTrade {
        address sender;
        address receiver;
        uint256 senderTokenId;
        uint256 receiverTokenId;
        bool senderDeposited;
        bool receiverDeposited;
        uint256 senderFee;
        uint256 receiverFee;
        TradeStatus status;
    }

    uint256 public tradeFee = 0.0001 ether;
    mapping(bytes32 => PendingTrade) public trades;
    
    event TradeInitiated(bytes32 indexed tradeId, address indexed sender, address indexed receiver);
    event TradeUpdated(bytes32 indexed tradeId, address indexed sender, address indexed receiver); 
    event TradeCompleted(bytes32 indexed tradeId);
    event TradeCancelled(bytes32 indexed tradeId, address indexed refundReceiver);
    event FeeRefunded(address indexed receiver, uint256 amount);

    constructor(address _tokenContract, address initialOwner) Ownable(initialOwner) {
        tokenContract = _tokenContract;
    }

    function depositNFT(
        address from,
        address counterparty,
        uint256 tokenId,
        bool isSender
    ) external payable {
        require(msg.sender == from, "Caller must be the depositor");
        require(msg.value == tradeFee, "Incorrect ETH fee");

        IERC1155 nft = IERC1155(tokenContract);
        // bytes32 tradeId = getTradeId(counterparty, from); // Reverse address order
        bytes32 tradeId = getTradeId(from, counterparty);

        PendingTrade storage trade = trades[tradeId];

        nft.safeTransferFrom(from, address(this), tokenId, 1, "");

        if (isSender) {
            // Sender deposits SECOND
            
            trade.sender = from;
            trade.senderTokenId = tokenId;
            trade.senderDeposited = true;
            trade.senderFee = msg.value;
        } else {
            // Receiver deposits FIRST
            
            trade.receiver = from;  // The one actually depositing
            trade.receiverTokenId = tokenId;
            trade.receiverDeposited = true;
            trade.receiverFee = msg.value;
            // Counterparty becomes implicit sender
            trade.sender = counterparty; 
        }

        emit TradeUpdated(tradeId, trade.sender, trade.receiver);
    }

    function cancelTrade(address sender, address receiver) external {
        bytes32 tradeId = getTradeId(sender, receiver);
        PendingTrade storage trade = trades[tradeId];

        require(trade.sender != address(0), "Trade does not exist");
        require(trade.status == TradeStatus.PENDING, "Trade not in pending state");

        trade.status = TradeStatus.CANCELLED;

        IERC1155 nft = IERC1155(tokenContract);

        if (trade.senderDeposited) {
            nft.safeTransferFrom(address(this), trade.sender, trade.senderTokenId, 1, "");
            if (trade.senderFee > 0) {
                payable(trade.sender).transfer(trade.senderFee);
                emit FeeRefunded(trade.sender, trade.senderFee);
            }
        }

        if (trade.receiverDeposited) {
            nft.safeTransferFrom(address(this), trade.receiver, trade.receiverTokenId, 1, "");
            if (trade.receiverFee > 0) {
                payable(trade.receiver).transfer(trade.receiverFee);
                emit FeeRefunded(trade.receiver, trade.receiverFee);
            }
        }

        emit TradeCancelled(tradeId, msg.sender);
        delete trades[tradeId];
    }


    function completeSwap(address sender, address receiver) external onlyOwner {
        bytes32 tradeId = getTradeId(sender, receiver);
        PendingTrade storage trade = trades[tradeId];

        require(trade.status == TradeStatus.PENDING, "Trade not in pending state");
        require(trade.senderDeposited && trade.receiverDeposited, "Both parties must deposit");
        require(trade.senderFee == tradeFee && trade.receiverFee == tradeFee, "Incorrect fee amounts");

        IERC1155 nft = IERC1155(tokenContract);

        // Swap NFTs
        nft.safeTransferFrom(address(this), trade.receiver, trade.senderTokenId, 1, "");
        nft.safeTransferFrom(address(this), trade.sender, trade.receiverTokenId, 1, "");

        // Transfer accumulated fees to owner (0.2 ETH total)
        uint256 totalFees = trade.senderFee + trade.receiverFee;
        payable(owner()).transfer(totalFees);

        trade.status = TradeStatus.COMPLETED;
        emit TradeCompleted(tradeId);
        delete trades[tradeId];
    }

    // Helper function to check if both parties have deposited
    function isTradeReady(bytes32 tradeId) public view returns (bool) {
        PendingTrade memory trade = trades[tradeId];
        return trade.senderDeposited && trade.receiverDeposited;
    }

    function getTradeId(address a, address b) public pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] memory ids,
        uint256[] memory values,
        bytes memory data
    ) public pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function tradeExists(address a, address b) public view returns (bool) {
        bytes32 tradeId = getTradeId(a, b);
        PendingTrade memory trade = trades[tradeId];
        return trade.sender != address(0) || trade.receiver != address(0);
    }


    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Function to withdraw fees collected from trades
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function getRefundAmount(bytes32 tradeId, address user) public view returns (uint256) {
        PendingTrade memory trade = trades[tradeId];
        if (trade.sender == user) return trade.senderFee;
        if (trade.receiver == user) return trade.receiverFee;
        return 0;
    }

    receive() external payable {}
}