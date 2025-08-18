import { ethers } from 'ethers';
import tradeAbi from '@/lib/data/tradeCardABI.json';

// === CONFIGURATION ===
const RPC_URL = process.env.RPC_URL as string; // Local Hardhat node
const PRIVATE_KEY = process.env.PRIVATE_KEY as string; // Your private key
const TRADE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TRADE_CONTRACT as string;

// === INITIALIZATION ===
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const tradeContract = new ethers.Contract(
  TRADE_CONTRACT_ADDRESS,
  tradeAbi,
  wallet
);

// === FUNCTION TO CANCEL A TRADE ===
async function cancelTrade(address1: string, address2: string): Promise<void> {
  try {
    const tradeId = generateTradeId(address1, address2);
    const trade = await tradeContract.trades(tradeId);
    console.log('📄 Trade details before cancellation:', trade);

    // Call the cancelTrade method (sender must be wallet.address)

    const tx = await tradeContract.cancelTrade(address1, address2);
    console.log('⏳ Cancel transaction sent! Hash:', tx.hash);
    await tx.wait();
    console.log('✅ Trade cancelled successfully!');
  } catch (error) {
    console.error('❌ Error during trade cancellation:', error);
  }
}

// Helper to generate trade ID (same as in smart contract)
function generateTradeId(addr1: string, addr2: string): string {
  const [first, second] =
    addr1.toLowerCase() < addr2.toLowerCase() ? [addr1, addr2] : [addr2, addr1];

  return ethers.keccak256(
    ethers.solidityPacked(['address', 'address'], [first, second])
  );
}

export { cancelTrade };
