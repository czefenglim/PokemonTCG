const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
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

  // const contract = await PokemonCard1155.deploy(BASE_URI);

  const feeData = await ethers.provider.getFeeData();

  const contract = await PokemonCard1155.deploy(BASE_URI, {
    gasPrice: feeData.gasPrice,
    gasLimit: 5_000_000, // example, adjust as needed
  });

  const tx = contract.deploymentTransaction();
  console.log("Deploy tx hash:", tx.hash);

  await contract.waitForDeployment({ timeout: 60000 });

  console.log(`🃏 PokemonCard1155 deployed to: ${contract.target}`);

  // Deploy TradeContract
  const TradeContract = await hre.ethers.getContractFactory("TradeContract");
  // const tradeContract = await TradeContract.deploy(
  //   contract.target,
  //   deployer.address
  // );
  const tradeContract = await TradeContract.deploy(
    contract.target,
    deployer.address,
    {
      gasPrice: feeData.gasPrice,
      gasLimit: 5000000, // adjust if needed
    }
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
}

main().catch((err) => {
  console.error("💥 Deployment failed:", err);
  process.exit(1);
});
