// testRpc.js
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider(
    "https://eth-sepolia.g.alchemy.com/v2/OBJCtEDGEqGvHHDqrjl0F"
  );
  const privateKey =
    "c09635326aa1c48e94540f75fc5e4812ae14310af861599a4adca465bbf9823c"; // replace carefully
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Wallet address:", wallet.address);
  const balance = await wallet.provider.getBalance(wallet.address);

  console.log("Balance:", ethers.formatEther(balance), "ETH");

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice;

  const txResponse = await wallet.sendTransaction({
    to: wallet.address,
    value: ethers.parseEther("0.00001"),
    gasPrice: gasPrice,
    gasLimit: 21000,
  });

  console.log("Transaction sent. Hash:", txResponse.hash);

  const receipt = await txResponse.wait();
  console.log("Transaction mined in block:", receipt.blockNumber);
}

main().catch(console.error);
