// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PokemonCard1155 is ERC1155, Ownable {
    using Strings for uint256;

    // e.g. "ipfs://bafy.../"
    string private _baseURI;

    // Dynamic maximum Pokemon ID based on your Pokemon list
    uint256 public maxPokemonId;

    // Track total supply of each Pokemon
    mapping(uint256 => uint256) public totalSupply;

    // Events
    event CardMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount
    );
    event BaseURIUpdated(string newBaseURI);
    event MaxPokemonIdUpdated(uint256 newMaxId);

    constructor(
        string memory baseURI_,
        uint256 _maxPokemonId
    )
        ERC1155("") // we override uri() below
        Ownable(msg.sender)
    {
        _setBaseURI(baseURI_);
        require(_maxPokemonId > 0, "Max Pokemon ID must be > 0");
        maxPokemonId = _maxPokemonId;
    }

    // --------------------
    // METADATA
    // --------------------

    /// @notice ERC-1155 metadata URI. Returns folder-style: ipfs://<cid>/<id>.json
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string.concat(_baseURI, tokenId.toString(), ".json");
    }

    /// @notice Owner can update base folder (must end with "/")
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _setBaseURI(newBaseURI);
        emit BaseURIUpdated(newBaseURI);
    }

    function getBaseURI() external view returns (string memory) {
        return _baseURI;
    }

    function _setBaseURI(string memory newBaseURI) internal {
        bytes memory b = bytes(newBaseURI);
        require(b.length > 0, "baseURI empty");
        require(b[b.length - 1] == "/", "baseURI must end with '/'");
        // (Optional) enforce IPFS scheme off-chain; many marketplaces accept ipfs://
        _baseURI = newBaseURI;
    }

    // --------------------
    // ADMIN / SUPPLY
    // --------------------

    /// @notice Increase the max Pokemon ID (can't decrease for safety)
    function setMaxPokemonId(uint256 _newMax) external onlyOwner {
        require(_newMax >= maxPokemonId, "cannot decrease");
        maxPokemonId = _newMax;
        emit MaxPokemonIdUpdated(_newMax);
    }

    /// @notice Admin mint to any address
    function mintCard(
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "zero address");
        require(tokenId > 0 && tokenId <= maxPokemonId, "invalid tokenId");
        require(amount > 0, "amount > 0");

        _mint(to, tokenId, amount, "");
        totalSupply[tokenId] += amount;
        emit CardMinted(to, tokenId, amount);
    }

    /// @notice Public pack opening: mint multiple ids to caller
    function mintCardsForPack(
        uint256[] memory tokenIds,
        uint256[] memory amounts
    ) external {
        require(tokenIds.length == amounts.length, "length mismatch");
        require(tokenIds.length > 0 && tokenIds.length <= 10, "count 1..10");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            uint256 amt = amounts[i];
            require(amt > 0, "amount > 0");
            require(id > 0 && id <= maxPokemonId, "invalid tokenId");
        }

        _mintBatch(msg.sender, tokenIds, amounts, "");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            totalSupply[tokenIds[i]] += amounts[i];
            emit CardMinted(msg.sender, tokenIds[i], amounts[i]);
        }
    }

    // --------------------
    // VIEWS / HELPERS
    // --------------------

    /// @notice Pseudo-random IDs for packs (not for security-critical randomness)
    function getRandomPokemonIds(
        uint256 count,
        uint256 seed
    ) external view returns (uint256[] memory) {
        require(count > 0 && count <= 10, "count 1..10");
        require(maxPokemonId > 0, "no Pokemon");

        uint256[] memory randomIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 randomId = (uint256(
                keccak256(
                    abi.encodePacked(seed, i, block.timestamp, block.prevrandao)
                )
            ) % maxPokemonId) + 1;
            randomIds[i] = randomId;
        }
        return randomIds;
    }

    function getRandomPokemonIdsWithMax(
        uint256 count,
        uint256 seed,
        uint256 customMaxId
    ) external view returns (uint256[] memory) {
        require(count > 0 && count <= 10, "count 1..10");
        require(
            customMaxId > 0 && customMaxId <= maxPokemonId,
            "bad customMax"
        );

        uint256[] memory randomIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 randomId = (uint256(
                keccak256(
                    abi.encodePacked(seed, i, block.timestamp, block.prevrandao)
                )
            ) % customMaxId) + 1;
            randomIds[i] = randomId;
        }
        return randomIds;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return totalSupply[tokenId] > 0;
    }

    function getUserBalances(
        address account,
        uint256[] memory tokenIds
    ) external view returns (uint256[] memory) {
        require(account != address(0), "invalid account");
        require(tokenIds.length > 0, "no token IDs");

        uint256[] memory balances = new uint256[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            balances[i] = balanceOf(account, tokenIds[i]);
        }
        return balances;
    }

    // --------------------
    // WITHDRAW
    // --------------------

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "no funds");
        (bool ok, ) = payable(owner()).call{value: balance}("");
        require(ok, "withdraw failed");
    }
}
