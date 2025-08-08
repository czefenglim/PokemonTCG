// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract PokemonCardWager {
    IERC1155 public pokemonCard1155;

    struct Wager {
        address player1;
        address player2;
        uint256[] tokenIds;
        uint256[] amounts;
        bool player1Joined;
        bool player2Joined;
        bool completed;
    }

    uint256 public nextWagerId;
    mapping(uint256 => Wager) public wagers;

    // Events that your frontend expects
    event WagerCreated(uint256 indexed wagerId, address indexed player1);
    event WagerJoined(uint256 indexed wagerId, address indexed player2);
    event WagerResolved(uint256 indexed wagerId, address indexed winner);

    constructor(address _pokemonCard1155) {
        pokemonCard1155 = IERC1155(_pokemonCard1155);
    }

    function createWager(uint256[] calldata tokenIds, uint256[] calldata amounts) external returns (uint256) {
        require(tokenIds.length == amounts.length, "Mismatched array lengths");

        // Transfer cards to the contract
        pokemonCard1155.safeBatchTransferFrom(msg.sender, address(this), tokenIds, amounts, "");

        uint256 wagerId = nextWagerId;
        
        wagers[wagerId] = Wager({
            player1: msg.sender,
            player2: address(0),
            tokenIds: tokenIds,
            amounts: amounts,
            player1Joined: true,
            player2Joined: false,
            completed: false
        });

        // Emit the event that your frontend is looking for
        emit WagerCreated(wagerId, msg.sender);

        nextWagerId++;
        return wagerId;
    }

    function joinWager(uint256 wagerId, uint256[] calldata tokenIds, uint256[] calldata amounts) external {
        Wager storage wager = wagers[wagerId];
        require(!wager.completed, "Wager completed");
        require(!wager.player2Joined, "Already joined");
        require(wager.player1 != address(0), "Invalid wager");
        require(tokenIds.length == wager.tokenIds.length, "Invalid token count");

        // Match token IDs and amounts
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenIds[i] == wager.tokenIds[i], "Token ID mismatch");
            require(amounts[i] == wager.amounts[i], "Amount mismatch");
        }

        pokemonCard1155.safeBatchTransferFrom(msg.sender, address(this), tokenIds, amounts, "");

        wager.player2 = msg.sender;
        wager.player2Joined = true;

        // Emit the join event
        emit WagerJoined(wagerId, msg.sender);
    }

    function resolveWager(uint256 wagerId, address winner) external {
        Wager storage wager = wagers[wagerId];
        require(!wager.completed, "Wager already completed");
        require(wager.player1Joined && wager.player2Joined, "Wager not ready");
        require(winner == wager.player1 || winner == wager.player2, "Invalid winner");

        wager.completed = true;

        // Total both players' cards and send to winner
        uint256[] memory doubledAmounts = new uint256[](wager.amounts.length);
        for (uint256 i = 0; i < wager.amounts.length; i++) {
            doubledAmounts[i] = wager.amounts[i] * 2;
        }

        pokemonCard1155.safeBatchTransferFrom(address(this), winner, wager.tokenIds, doubledAmounts, "");

        // Emit the resolution event
        emit WagerResolved(wagerId, winner);
    }

    // Required to receive ERC1155 tokens
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    
}