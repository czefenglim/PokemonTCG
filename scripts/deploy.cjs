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

  // Resolve baseURI (prefer .env, fallback to your CID)
  const baseURI = mustEndWithSlash(
    process.env.NEXT_PUBLIC_BASE_URI ||
      'ipfs://QmUGayY6ZKVhCFS6NhqPQczfhg2BkBSmWQK1H1WJEhN7Xy/'
  );

  const [deployer] = await ethers.getSigners();
  console.log('💼 Deployer:', deployer.address);
  console.log('🔗 Base URI:', baseURI);

  const PokemonCard1155 = await ethers.getContractFactory('PokemonCard1155');
  console.log('⏳ Deploying…');
  const contract = await PokemonCard1155.deploy(baseURI, maxPokemonId);
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log('🎉 Deployed at:', contractAddress);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    contractName: 'PokemonCard1155',
    network: (hre.network && hre.network.name) || 'localhost',
    baseURI,
    maxPokemonId,
    totalPokemonCount: maxPokemonId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };
  fs.writeFileSync(
    path.join(__dirname, '../contract-deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log('💾 Saved contract-deployment.json');

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
