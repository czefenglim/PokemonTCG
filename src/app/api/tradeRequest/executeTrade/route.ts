// import { ethers } from "ethers";
// import tradeAbi from "../../../lib/tradeCardABI.json";

// async function executeTradeOnChain(trade) {
//   const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
//   const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
//   const tradeContract = new ethers.Contract(process.env.TRADE_CONTRACT_ADDRESS, tradeAbi, signer);

//   const tx = await tradeContract.executeTrade(
//     trade.senderId,
//     trade.receiverId,
//     trade.senderTokenId,
//     trade.receiverTokenId
//   );

//   await tx.wait();
// }
