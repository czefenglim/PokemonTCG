// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PokemonCard1155 is ERC1155, Ownable {
    string private _baseURI;

    // Track total supply of each Pokemon
    mapping(uint256 => uint256) public totalSupply;

    // Events
    event CardMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount
    );
    event BaseURIUpdated(string newBaseURI);

    constructor(string memory baseURI) ERC1155("") Ownable(msg.sender) {
        _baseURI = baseURI;
    }

    /**
     * Public pack opening function - users can mint their own cards
     * Removed token ID validation for simplicity
     */
    function mintCardsForPack(
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external {
        require(tokenIds.length == amounts.length, "Arrays length mismatch");
        require(tokenIds.length > 0, "No tokens to mint");
        require(tokenIds.length <= 10, "Too many cards at once");

        // Basic validation only
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(amounts[i] > 0, "Amount must be greater than 0");
            require(tokenIds[i] > 0, "Token ID must be greater than 0");
        }

        // Mint the NFTs to the caller
        _mintBatch(msg.sender, tokenIds, amounts, "");

        // Update supplies and emit events
        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalSupply[tokenIds[i]] += amounts[i];
            emit CardMinted(msg.sender, tokenIds[i], amounts[i]);
        }
    }

    /**
     * Admin mint function - only owner can mint to any address
     */
    function mintCard(
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(tokenId > 0, "Token ID must be greater than 0");
        require(amount > 0, "Amount must be greater than 0");

        _mint(to, tokenId, amount, "");
        totalSupply[tokenId] += amount;
        emit CardMinted(to, tokenId, amount);
    }

    /**
     * Get random Pokemon IDs for pack opening
     */
    function getRandomPokemonIds(
        uint256 count,
        uint256 seed
    ) external view returns (uint256[] memory) {
        require(count > 0 && count <= 10, "Count must be between 1 and 10");

        uint256[] memory randomIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            // Generate random Pokemon IDs from 1 to 1000
            uint256 randomId = (uint256(
                keccak256(
                    abi.encodePacked(seed, i, block.timestamp, block.prevrandao)
                )
            ) % 1000) + 1;

            randomIds[i] = randomId;
        }

        return randomIds;
    }

    /**
     * Get Pokemon metadata URL
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseURI, _toString(tokenId)));
    }

    /**
     * Update base URI for metadata - only owner
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * Get current base URI
     */
    function getBaseURI() external view returns (string memory) {
        return _baseURI;
    }

    /**
     * Check if token has been minted (exists)
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return totalSupply[tokenId] > 0;
    }

    /**
     * Get user's balances for multiple tokens
     */
    function getUserBalances(
        address account,
        uint256[] memory tokenIds
    ) external view returns (uint256[] memory) {
        require(account != address(0), "Invalid account address");
        require(tokenIds.length > 0, "No token IDs provided");

        uint256[] memory balances = new uint256[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            balances[i] = balanceOf(account, tokenIds[i]);
        }

        return balances;
    }

    /**
     * Withdraw contract balance - only owner
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
