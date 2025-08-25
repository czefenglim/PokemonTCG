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

  const pokemonListPath = path.join(
    __dirname,
    '../src/lib/data/pokemon-list.json'
  );
  if (!fs.existsSync(pokemonListPath)) {
    throw new Error(`❌ Pokemon list not found at: ${pokemonListPath}`);
  }
  let pokemonList = JSON.parse(fs.readFileSync(pokemonListPath, 'utf8'));
  // keep only the first 50 for dev
  pokemonList = pokemonList.slice(0, 50);
  const maxPokemonId = pokemonList.length;
  console.log(`🎯 Found ${maxPokemonId} Pokemon in the list`);

  const network = await ethers.provider.getNetwork();

  const baseURI = mustEndWithSlash(
    process.env.NEXT_PUBLIC_BASE_URI ||
      'ipfs://bafybeihfoywwwh7ng4ltgfhsrl4ic6j3awgk4xyt5jykpob7yqwtzmu3ry/'
  );

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log(
    'Account balance:',
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    'ETH'
  );

  // --- Deploy PokemonCard1155 ---
  const PokemonCard1155 = await ethers.getContractFactory('PokemonCard1155'); // <- use ethers, not hre
  const nft = await PokemonCard1155.deploy(baseURI, maxPokemonId);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress(); // or nft.target in ethers v6
  console.log(`🃏 PokemonCard1155 deployed to: ${nftAddress}`);

  // --- Deploy TradeContract ---
  const TradeContract = await ethers.getContractFactory('TradeContract');
  const trade = await TradeContract.deploy(nftAddress, deployer.address);
  await trade.waitForDeployment();
  const tradeContractAddress = await trade.getAddress(); // <-- DEFINE THIS
  console.log(`🔄 TradeContract deployed to: ${tradeContractAddress}`);

  // --- Save deployments JSON ---
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
          PokemonCard1155: {
            address: nftAddress,
            args: [baseURI, maxPokemonId],
          },
          TradeContract: {
            address: tradeContractAddress,
            args: [nftAddress, deployer.address],
          },
        },
        deployedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`\n✅ Deployment info saved to: ${deploymentPath}`);

  // --- Upsert .env(.local) ---
  const envPath = path.join(__dirname, '../.env'); // or '../.env.local' (recommended for Next.js)
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  function upsert(key, value) {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(env)) env = env.replace(re, `${key}=${value}`);
    else env += (env.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`;
  }

  upsert('NEXT_PUBLIC_CONTRACT_ADDRESS', nftAddress);
  upsert('NEXT_PUBLIC_TRADE_CONTRACT', tradeContractAddress);
  upsert('NEXT_PUBLIC_BASE_URI', baseURI);

  fs.writeFileSync(envPath, env);
  console.log(
    '✅ .env updated (NEXT_PUBLIC_CONTRACT_ADDRESS, NEXT_PUBLIC_TRADE_CONTRACT, NEXT_PUBLIC_BASE_URI)'
  );

  console.log('\n✅ Deployment complete. Ready for pack opening!');
}

main().catch((e) => {
  console.error('❌ Deployment failed:', e);
  process.exit(1);
});
