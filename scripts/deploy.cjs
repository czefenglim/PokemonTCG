const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Deploying Pokemon Card Contract...');

  // Your metadata API URL
  const BASE_URI = 'http://localhost:3000/api/pokemon/';

  // Deploy contract
  const PokemonCard1155 = await ethers.getContractFactory('PokemonCard1155');
  const contract = await PokemonCard1155.deploy(BASE_URI);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log('📝 Contract deployed to:', contractAddress);
  console.log('🔗 Base URI set to:', BASE_URI);

  // Load Pokemon data from your JSON file
  try {
    const pokemonPath = path.join(__dirname, '../src/lib/pokemon-list.json');
    const pokemonData = JSON.parse(fs.readFileSync(pokemonPath, 'utf8'));
    const tokenIds = pokemonData.map((p) => p.tokenId);

    console.log(`🎯 Found ${tokenIds.length} Pokemon in JSON file`);

    if (tokenIds.length > 1000) {
      // Set first 1000 Pokemon for gas efficiency
      console.log('⚠️  Setting first 1000 Pokemon to avoid gas issues...');
      const firstBatch = tokenIds.slice(0, 1000);

      const tx = await contract.setValidTokenIds(firstBatch);
      await tx.wait();

      console.log(`✅ First 1000 Pokemon set successfully!`);
      console.log(
        `📋 Remaining ${tokenIds.length - 1000} Pokemon can be added later`
      );
    } else {
      // Set all Pokemon if reasonable number
      console.log('📦 Setting all Pokemon...');
      const tx = await contract.setValidTokenIds(tokenIds);
      await tx.wait();
      console.log('✅ All Pokemon set successfully!');
    }
  } catch (error) {
    console.log('⚠️  Could not load Pokemon data:', error.message);
    console.log('   You can set valid token IDs manually later');
  }

  // Test contract functionality
  console.log('\n🧪 Testing contract...');
  try {
    // Test 1: Check available Pokemon count
    const availableIds = await contract.getAvailableTokenIds();
    console.log(`✅ Available Pokemon: ${availableIds.length}`);

    // Test 2: Check if specific Pokemon exist
    const testIds = [1, 25, 150]; // Weedle, Pikachu, Mewtwo
    for (const id of testIds) {
      const isValid = await contract.isValidTokenId(id);
      if (isValid) {
        const uri = await contract.uri(id);
        console.log(`✅ Pokemon ${id}: ${uri}`);
      } else {
        console.log(`❌ Pokemon ${id}: Not available`);
      }
    }

    // Test 3: Test random Pokemon generation
    if (availableIds.length > 0) {
      const randomIds = await contract.getRandomPokemonIds(5, Date.now());
      console.log(
        `✅ Random Pokemon sample: ${randomIds.map((id) => id.toString())}`
      );
    }

    // Test 4: Test pack minting (to contract owner)
    console.log('\n🎁 Testing pack minting...');
    const [owner] = await ethers.getSigners();

    if (availableIds.length >= 3) {
      const testMintIds = availableIds.slice(0, 3); // First 3 Pokemon
      const amounts = [1, 1, 1]; // 1 of each

      const mintTx = await contract.mintCardsForPack(
        owner.address,
        testMintIds,
        amounts
      );
      await mintTx.wait();

      console.log(
        `✅ Test pack minted! Pokemon: ${testMintIds.map((id) =>
          id.toString()
        )}`
      );

      // Check balances
      for (const id of testMintIds) {
        const balance = await contract.balanceOf(owner.address, id);
        console.log(`   Pokemon ${id}: Balance = ${balance.toString()}`);
      }
    }
  } catch (error) {
    console.log('⚠️  Contract test failed:', error.message);
  }

  // Save deployment information
  const deploymentInfo = {
    contractAddress: contractAddress,
    contractName: 'PokemonCard1155',
    network: 'localhost',
    baseURI: BASE_URI,
    deployedAt: new Date().toISOString(),
    totalPokemon: 0, // Will be updated based on actual deployment
    gasUsed: 'N/A',
  };

  // Update with actual Pokemon count
  try {
    const finalCount = await contract.getTotalPokemonTypes();
    deploymentInfo.totalPokemon = parseInt(finalCount.toString());
  } catch (error) {
    console.log('Could not get final Pokemon count');
  }

  // Save to file
  const deploymentPath = path.join(__dirname, '../contract-deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  // Final summary
  console.log('\n🎉 Deployment Complete!');
  console.log('📋 Contract Address:', contractAddress);
  console.log('💾 Deployment info saved to: contract-deployment.json');
  console.log('\n🔧 Integration Info:');
  console.log(`   Contract Address: "${contractAddress}"`);
  console.log(`   Base URI: "${BASE_URI}"`);
  console.log(`   Available Pokemon: ${deploymentInfo.totalPokemon}`);

  console.log('\n🚀 Next Steps:');
  console.log(
    '1. Update your pack opening component with this contract address'
  );
  console.log(
    '2. Test API endpoints: curl http://localhost:3000/api/pokemon/1'
  );
  console.log('3. Test pack opening in your app');
  console.log('4. Check NFTs in MetaMask wallet');

  if (deploymentInfo.totalPokemon < 100) {
    console.log('\n💡 To add more Pokemon:');
    console.log(
      '   npx hardhat run scripts/add-more-pokemon.cjs --network localhost'
    );
  }

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Deployment failed:', error);
    process.exit(1);
  });
