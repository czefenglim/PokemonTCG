// scripts/deploy.js
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function mustEndWithSlash(uri) {
  if (!uri.endsWith('/')) throw new Error(`Base URI must end with '/': ${uri}`);
  return uri;
}

async function main() {
  console.log('🚀 Starting Pokemon Card deployment...');

  // Load pokemon count
  const pokemonListPath = path.join(__dirname, '../src/lib/pokemon-list.json');
  if (!fs.existsSync(pokemonListPath)) {
    throw new Error(`❌ Pokemon list not found at: ${pokemonListPath}`);
  }
  const pokemonList = JSON.parse(fs.readFileSync(pokemonListPath, 'utf8'));
  const maxPokemonId = pokemonList.length;
  console.log(`🎯 Found ${maxPokemonId} Pokemon in the list`);

  const network = await ethers.provider.getNetwork();

  // Resolve baseURI (prefer .env, fallback to your CID)
  const baseURI = mustEndWithSlash(
    process.env.NEXT_PUBLIC_BASE_URI ||
      'ipfs://QmUGayY6ZKVhCFS6NhqPQczfhg2BkBSmWQK1H1WJEhN7Xy/'
  );

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log(
    'Account balance:',
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    'ETH'
  );
  console.log('Deploying contract...');

  // Deploy PokemonCard1155
  const PokemonCard1155 = await hre.ethers.getContractFactory(
    'PokemonCard1155'
  );

  const contract = await PokemonCard1155.deploy(baseURI, maxPokemonId);

  await contract.waitForDeployment();

  console.log(`🃏 PokemonCard1155 deployed to: ${contract.target}`);

  // Deploy TradeContract
  const TradeContract = await hre.ethers.getContractFactory('TradeContract');

  const tradeContract = await TradeContract.deploy(
    contract.target,
    deployer.address
  );

  await tradeContract.waitForDeployment();

  console.log(`🔄 TradeContract deployed to: ${tradeContract.target}`);

  // 📦 Load Pokémon JSON and set token IDs (only if localhost / dev)
  // try {
  //   const pokemonPath = path.join(__dirname, '../src/lib/pokemon-list.json');
  //   const pokemonData = JSON.parse(fs.readFileSync(pokemonPath, 'utf8'));
  //   const tokenIds = pokemonData.map((p) => p.tokenId);

  //   if (tokenIds.length > 0) {
  //     console.log(`🎯 Found ${tokenIds.length} Pokémon in JSON file`);
  //     const tx = await contract.setValidTokenIds(
  //       tokenIds.slice(0, 1000) // keep safe batch
  //     );
  //     await tx.wait();
  //     console.log(`✅ Pokémon IDs set successfully!`);
  //   }
  // } catch (err) {
  //   console.log('⚠️ Could not load Pokémon JSON:', err.message);
  // }

  // // ✅ Verify contracts if testnet
  // if (network.chainId !== 31337n && network.chainId !== 1337n) {
  //   console.log('Waiting for block confirmations...');
  //   console.log('Base URI:', BASE_URI);
  //   await new Promise((r) => setTimeout(r, 30000));

  //   try {
  //     console.log('Verifying PokemonCard1155...');
  //     await hre.run('verify:verify', {
  //       address: contract.target,
  //       constructorArguments: [BASE_URI],
  //     });
  //   } catch (e) {
  //     console.log('Verification failed:', e.message);
  //   }

  //   try {
  //     console.log('Verifying TradeContract...');
  //     await hre.run('verify:verify', {
  //       address: tradeContract.target,
  //       constructorArguments: [contract.target, deployer.address],
  //     });
  //   } catch (e) {
  //     console.log('Verification failed:', e.message);
  //   }
  // }

  // 💾 Save deployment info
  if (!fs.existsSync('./deployments')) fs.mkdirSync('./deployments');
  const deploymentPath = `./deployments/${network.name}-deployment.json`;
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(
      {
        network: network.name,
        chainId: network.chainId.toString(),
        deployer: deployer.address,
        contracts: {
          PokemonCard1155: { address: contract.target, args: [baseURI] },
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
  console.log('🎉 Deployed at:', contractAddress);

  // Save deployment info
  // const deploymentInfo = {
  //   contractAddress,
  //   contractName: 'PokemonCard1155',
  //   network: (hre.network && hre.network.name) || 'localhost',
  //   baseURI,
  //   maxPokemonId,
  //   totalPokemonCount: maxPokemonId,
  //   deployedAt: new Date().toISOString(),
  //   deployer: deployer.address,
  // };
  // fs.writeFileSync(
  //   path.join(__dirname, '../contract-deployment.json'),
  //   JSON.stringify(deploymentInfo, null, 2)
  // );
  // console.log('💾 Saved contract-deployment.json');

  // Upsert .env with address & base URI
  const envPath = path.join(__dirname, '../.env');
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  function upsert(key, value) {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(env)) env = env.replace(re, `${key}=${value}`);
    else env += (env.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`;
  }

  upsert('NEXT_PUBLIC_CONTRACT_ADDRESS', contractAddress);
  upsert('NEXT_PUBLIC_BASE_URI', baseURI);

  fs.writeFileSync(envPath, env);
  console.log(
    '✅ .env updated (NEXT_PUBLIC_CONTRACT_ADDRESS, NEXT_PUBLIC_BASE_URI)'
  );

  console.log('\n✅ Deployment complete. Ready for pack opening!');
}

main().catch((e) => {
  console.error('❌ Deployment failed:', e);
  process.exit(1);
});
