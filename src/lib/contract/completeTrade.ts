import { ethers } from 'ethers';
import tradeAbi from '../../lib/tradeCardABI.json';

// === CONFIGURATION ===
const RPC_URL = process.env.RPC_URL as string; // Local Hardhat node
const PRIVATE_KEY = process.env.PRIVATE_KEY as string; // Your private key
const TRADE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TRADE_CONTRACT as string; // Deployed TradeContract

// === INITIALIZATION ===
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const tradeContract = new ethers.Contract(
  TRADE_CONTRACT_ADDRESS,
  tradeAbi,
  wallet
);

// === FUNCTION TO GENERATE TRADE ID ===
function generateTradeId(addr1: string, addr2: string): string {
  const [first, second] =
    addr1.toLowerCase() < addr2.toLowerCase() ? [addr1, addr2] : [addr2, addr1];

  return ethers.keccak256(
    ethers.solidityPacked(['address', 'address'], [first, second])
  );
}

// === FUNCTION TO COMPLETE SWAP ===
async function completeTrade(sender: string, receiver: string): Promise<void> {
  try {
    // Just for debugging: you can still compute tradeId to read trade info
    const tradeId = generateTradeId(sender, receiver);
    const trade = await tradeContract.trades(tradeId);
    console.log('📄 Retrieved trade data:', trade);

    if (trade.senderDeposited && trade.receiverDeposited) {
      const tx = await tradeContract.completeSwap(sender, receiver);
      console.log('⏳ Transaction sent! Hash:', tx.hash);
      await tx.wait();
      console.log('✅ Trade completed successfully!');
    } else {
      console.log('❌ Trade not completed: Both parties must deposit.');
    }
    // Call completeSwap with the two addresses
  } catch (error) {
    console.error('❌ Error during trade:', error);
  }
}

export { completeTrade };
