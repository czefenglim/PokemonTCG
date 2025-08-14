const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");
require("dotenv").config();

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

  const network = await ethers.provider.getNetwork();
  console.log(
    `Deploying to network: ${network.name} (Chain ID: ${network.chainId})`
  );

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );
  console.log("Deploying contract...");

  // 🔗 Base URI (switch depending on network)
  const BASE_URI =
    network.chainId === 31337n
      ? "http://localhost:3000/api/pokemon/"
      : "https://ipfs.io/ipfs/QmUGayY6ZKVhCFS6NhqPQczfhg2BkBSmWQK1H1WJEhN7Xy/";

  // Deploy PokemonCard1155
  const PokemonCard1155 = await hre.ethers.getContractFactory(
    "PokemonCard1155"
  );

  const feeData = await ethers.provider.getFeeData();

  // const contract = await PokemonCard1155.deploy(BASE_URI, {
  //   gasPrice: feeData.gasPrice,
  //   gasLimit: 5_000_000, // example, adjust as needed
  // });

  const contract = await PokemonCard1155.deploy(BASE_URI, maxPokemonId);

  const tx = contract.deploymentTransaction();
  console.log("Deploy tx hash:", tx.hash);

  await contract.waitForDeployment({ timeout: 60000 });

  console.log(`🃏 PokemonCard1155 deployed to: ${contract.target}`);

  // Deploy TradeContract
  const TradeContract = await hre.ethers.getContractFactory("TradeContract");

  // const tradeContract = await TradeContract.deploy(
  //   contract.target,
  //   deployer.address,
  //   {
  //     gasPrice: feeData.gasPrice,
  //     gasLimit: 5000000, // adjust if needed
  //   }
  // );

  const tradeContract = await TradeContract.deploy(
    contract.target,
    deployer.address
  );

  await tradeContract.waitForDeployment();

  console.log(`🔄 TradeContract deployed to: ${tradeContract.target}`);

  // 📦 Load Pokémon JSON and set token IDs (only if localhost / dev)
  try {
    const pokemonPath = path.join(__dirname, "../src/lib/pokemon-list.json");
    const pokemonData = JSON.parse(fs.readFileSync(pokemonPath, "utf8"));
    const tokenIds = pokemonData.map((p) => p.tokenId);

    if (tokenIds.length > 0) {
      console.log(`🎯 Found ${tokenIds.length} Pokémon in JSON file`);
      const tx = await contract.setValidTokenIds(
        tokenIds.slice(0, 1000) // keep safe batch
      );
      await tx.wait();
      console.log(`✅ Pokémon IDs set successfully!`);
    }
  } catch (err) {
    console.log("⚠️ Could not load Pokémon JSON:", err.message);
  }

  // ✅ Verify contracts if testnet
  if (network.chainId !== 31337n && network.chainId !== 1337n) {
    console.log("Waiting for block confirmations...");
    console.log("Base URI:", BASE_URI);
    await new Promise((r) => setTimeout(r, 30000));

    try {
      console.log("Verifying PokemonCard1155...");
      await hre.run("verify:verify", {
        address: contract.target,
        constructorArguments: [BASE_URI],
      });
    } catch (e) {
      console.log("Verification failed:", e.message);
    }

    try {
      console.log("Verifying TradeContract...");
      await hre.run("verify:verify", {
        address: tradeContract.target,
        constructorArguments: [contract.target, deployer.address],
      });
    } catch (e) {
      console.log("Verification failed:", e.message);
    }
  }

  // 💾 Save deployment info
  if (!fs.existsSync("./deployments")) fs.mkdirSync("./deployments");
  const deploymentPath = `./deployments/${network.name}-deployment.json`;
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(
      {
        network: network.name,
        chainId: network.chainId.toString(),
        deployer: deployer.address,
        contracts: {
          PokemonCard1155: { address: contract.target, args: [BASE_URI] },
          TradeContract: {
            address: tradeContract.target,
            args: [contract.target, deployer.address],
          },
        },
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`\n✅ Deployment info saved to: ${deploymentPath}`);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("🎉 Contract deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);

  // Save deployment info to JSON
  const deploymentInfo = {
    contractAddress,
    contractName: "PokemonCard1155",
    network: "localhost",
    BASE_URI,
    maxPokemonId,
    totalPokemonCount: maxPokemonId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

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
