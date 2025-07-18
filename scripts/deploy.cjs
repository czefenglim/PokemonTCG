const hre = require("hardhat");

async function main() {
  const PokemonCard1155 = await hre.ethers.getContractFactory(
    "PokemonCard1155"
  );

  // Deploy the contract
  const contract = await PokemonCard1155.deploy();

  // Output the deployed address
  console.log(`PokemonCard1155 deployed to: ${contract.target}`);

  // TradeCards.sol

  const TradeCards = await hre.ethers.getContractFactory("TradeCards");
  const tradeContract = await TradeCards.deploy();
  await tradeContract.waitForDeployment();
  console.log(`TradeCards deployed to: ${tradeContract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
