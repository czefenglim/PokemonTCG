// deploy-battle-wager.cjs

const hre = require("hardhat");

async function main() {
  // Get the Pokemon Card contract address from your existing deployment
  const pokemonCardAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Your deployed address

  console.log("Deploying PokemonCardWager contract...");
  console.log("Pokemon Card Contract Address:", pokemonCardAddress);

  // Verify the Pokemon Card contract exists first
  const code = await hre.ethers.provider.getCode(pokemonCardAddress);
  if (code === "0x") {
    console.error("❌ Pokemon Card contract not found at:", pokemonCardAddress);
    console.log("Please deploy the Pokemon Card contract first using:");
    console.log("npx hardhat run scripts/deploy.cjs --network localhost");
    process.exit(1);
  }
  console.log("✅ Pokemon Card contract verified");

  const PokemonCardWager = await hre.ethers.getContractFactory(
    "PokemonCardWager"
  );
  const cardWager = await PokemonCardWager.deploy(pokemonCardAddress);

  await cardWager.waitForDeployment();

  console.log(`PokemonCardWager deployed to: ${cardWager.target}`);
  console.log("Transaction hash:", cardWager.deploymentTransaction().hash);

  // Verify the deployment properly
  console.log("\nVerifying deployment...");
  try {
    const deployedPokemonCardAddress = await cardWager.pokemonCard1155();
    console.log("✅ Linked Pokemon Card Contract:", deployedPokemonCardAddress);

    // Test nextWagerId
    const nextWagerId = await cardWager.nextWagerId();
    console.log("✅ Initial nextWagerId:", nextWagerId.toString());

    console.log("\n🎉 Deployment successful!");
    console.log("📋 Update your .env file with:");
    console.log(`WAGER_CONTRACT_ADDRESS=${cardWager.target}`);
    console.log(`NEXT_PUBLIC_WAGER_CONTRACT_ADDRESS=${cardWager.target}`);
  } catch (error) {
    console.error("❌ Deployment verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
