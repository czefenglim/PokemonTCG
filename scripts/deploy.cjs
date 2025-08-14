const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting Pokemon Card deployment...");

  // 📖 Read Pokemon list to get dynamic count
  const pokemonListPath = path.join(__dirname, "../src/lib/pokemon-list.json");
  console.log(`📋 Reading Pokemon list from: ${pokemonListPath}`);

  if (!fs.existsSync(pokemonListPath)) {
    throw new Error(`❌ Pokemon list not found at: ${pokemonListPath}`);
  }

  const pokemonListData = fs.readFileSync(pokemonListPath, "utf8");
  const pokemonList = JSON.parse(pokemonListData);

  // Get the actual count of Pokemon
  const maxPokemonId = pokemonList.length;
  console.log(`🎯 Found ${maxPokemonId} Pokemon in the list`);

  // 🔗 Deploy contract
  console.log("📦 Deploying PokemonCard1155 contract...");

  const [deployer] = await ethers.getSigners();
  console.log("💼 Deploying with account:", deployer.address);

  const PokemonCard1155 = await ethers.getContractFactory("PokemonCard1155");

  const baseURI = "http://localhost:3000/api/pokemon/";
  console.log(`🔗 Base URI: ${baseURI}`);
  console.log(`🎯 Max Pokemon ID: ${maxPokemonId}`);

  console.log("⏳ Deploying contract (this may take a moment)...");

  // Deploy with both baseURI and dynamic maxPokemonId
  const contract = await PokemonCard1155.deploy(baseURI, maxPokemonId);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("🎉 Contract deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);

  // Save deployment info to JSON
  const deploymentInfo = {
    contractAddress,
    contractName: "PokemonCard1155",
    network: "localhost",
    baseURI,
    maxPokemonId,
    totalPokemonCount: maxPokemonId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  const deploymentPath = path.join(__dirname, "../contract-deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to: contract-deployment.json");

  // ✅ Auto-update .env with contract address
  const envPath = path.join(__dirname, "../.env");
  let envContents = "";

  if (fs.existsSync(envPath)) {
    envContents = fs.readFileSync(envPath, "utf8");
    if (envContents.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
      envContents = envContents.replace(
        /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/g,
        `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContents += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`;
    }
  } else {
    envContents = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`;
  }

  fs.writeFileSync(envPath, envContents);
  console.log(
    `\n✅ Updated .env with new contract address: ${contractAddress}`
  );

  console.log("\n🎯 NEXT STEPS:");
  console.log("1. Start your frontend with: npm run dev");
  console.log(
    "2. Your app will use the updated contract address automatically"
  );
  console.log(`3. Random Pokemon generation will use IDs 1-${maxPokemonId}`);
  console.log(
    "4. Users can now interact with the deployed Pokemon card contract!"
  );
}

main()
  .then(() => {
    console.log("\n✅ Deployment completed successfully!");
    console.log("🎮 Ready for pack opening!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
