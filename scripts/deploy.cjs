// const hre = require("hardhat");

// async function main() {
//   const [, deployer] = await ethers.getSigners();

//   const PokemonCard1155 = await hre.ethers.getContractFactory(
//     "PokemonCard1155"
//   );

//   // Deploy the contract
//   const contract = await PokemonCard1155.deploy();

//   // Output the deployed address
//   console.log(`PokemonCard1155 deployed to: ${contract.target}`);

//   // TradeCards.sol

//   const TradeContract = await hre.ethers.getContractFactory("TradeContract");
//   const tradeContract = await TradeContract.deploy(
//     contract.target,
//     deployer.address
//   );
//   await tradeContract.waitForDeployment(); // ✅ not .deployed()
//   console.log("TradeContract deployed to:", tradeContract.target);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

const hre = require("hardhat");
const { ethers } = hre;
require("dotenv").config();

async function main() {
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(
    `Deploying to network: ${network.name} (Chain ID: ${network.chainId})`
  );

  // Get the deployer account (using index 0 instead of 1)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy PokemonCard1155 contract
  const PokemonCard1155 = await hre.ethers.getContractFactory(
    "PokemonCard1155"
  );
  const contract = await PokemonCard1155.deploy();
  await contract.waitForDeployment();

  console.log(`PokemonCard1155 deployed to: ${contract.target}`);

  // Deploy TradeContract
  const TradeContract = await hre.ethers.getContractFactory("TradeContract");
  const tradeContract = await TradeContract.deploy(
    contract.target,
    deployer.address
  );
  await tradeContract.waitForDeployment();

  console.log("TradeContract deployed to:", tradeContract.target);

  // Verify contracts on testnet (skip for local hardhat network)
  if (network.chainId !== 31337n && network.chainId !== 1337n) {
    // Not local hardhat network
    console.log("Waiting for block confirmations...");

    // Wait for a few confirmations
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    console.log("Verifying PokemonCard1155 contract...");
    try {
      await hre.run("verify:verify", {
        address: contract.target,
        constructorArguments: [],
      });
      console.log("PokemonCard1155 verified successfully!");
    } catch (error) {
      console.log("PokemonCard1155 verification failed:", error.message);
    }

    console.log("Verifying TradeContract...");
    try {
      await hre.run("verify:verify", {
        address: tradeContract.target,
        constructorArguments: [contract.target, deployer.address],
      });
      console.log("TradeContract verified successfully!");
    } catch (error) {
      console.log("TradeContract verification failed:", error.message);
    }
  }

  // Save deployment info
  const fs = require("fs");

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }

  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contracts: {
      PokemonCard1155: {
        address: contract.target,
        constructorArgs: [],
      },
      TradeContract: {
        address: tradeContract.target,
        constructorArgs: [contract.target, deployer.address],
      },
    },
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const filename = `./deployments/${network.name}-deployment.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n✅ Deployment Summary:`);
  console.log(`📁 Deployment info saved to: ${filename}`);
  console.log(`🃏 PokemonCard1155: ${contract.target}`);
  console.log(`🔄 TradeContract: ${tradeContract.target}`);
  console.log(`🌐 Network: ${network.name} (${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
