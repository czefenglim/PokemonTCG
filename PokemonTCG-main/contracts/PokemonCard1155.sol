// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract PokemonCard1155 is ERC1155 {
    constructor()
        ERC1155(
            "ipfs://bafybeidtehcwyiqom4kc2klbnfa2hau4s5iob2zf3ue5o6mtndaumu2hlq/"
        )
    {}

    /**
     * Override uri() to return:
     * ipfs://<CID>/<padded numeric ID>/metadata.json
     * e.g., tokenId 1 => 001/metadata.json
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "ipfs://bafybeidtehcwyiqom4kc2klbnfa2hau4s5iob2zf3ue5o6mtndaumu2hlq/",
                    padId(tokenId),
                    "/metadata.json"
                )
            );
    }

    /**
     * Helper to pad numeric IDs to 3 digits.
     * e.g.,
     * 1   => "001"
     * 12  => "012"
     * 123 => "123"
     */
    function padId(uint256 id) internal pure returns (string memory) {
        if (id < 10) {
            return string(abi.encodePacked("00", _toString(id)));
        } else if (id < 100) {
            return string(abi.encodePacked("0", _toString(id)));
        } else {
            return _toString(id);
        }
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

    function mintCard(uint256 id, uint256 amount) public {
        _mint(msg.sender, id, amount, "");
    }

    function mintBatchCards(
        uint256[] memory ids,
        uint256[] memory amounts
    ) public {
        _mintBatch(msg.sender, ids, amounts, "");
    }
}
