import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const prisma = new PrismaClient();
  try {
    const { requestId, action } = await req.json();

    if (!["accepted", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.tradeRequest.update({
      where: { id: requestId },
      data: {
        senderStatus: action,
      },
    });

    return NextResponse.json({
      message: `Trade ${action} by sender`,
      updated,
    });
  } catch (error) {
    console.error("Error in respondToSentRequest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// import { PrismaClient } from "@prisma/client";
// import { NextResponse } from "next/server";
// import { ethers } from "ethers";
// import tradeAbi from "../../../lib/tradeCardABI.json";

// // Environment config
// const tradeContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
// const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// // Center/owner wallet private key (⚠️ Secure this in env file!)
// const signer = new ethers.Wallet(
//   "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
//   provider
// );

// export async function POST(req: Request) {
//   const prisma = new PrismaClient();
//   try {
//     const { requestId, action, tokenId } = await req.json();

//     // 1. Optionally record the response in DB (can skip if you don’t need tracking)
//     await prisma.tradeRequest.update({
//       where: { id: requestId },
//       data: {
//         senderStatus: action,
//         offeredCardId: tokenId,
//       },
//     });

//     // 2. Attempt to call `completeSwap` (it should fail if NFTs not both received)
//     // const tradeContract = new ethers.Contract(
//     //   tradeContractAddress,
//     //   tradeAbi,
//     //   signer
//     // );

//     // try {
//     //   const tx = await tradeContract.completeSwap(); // assuming no params needed
//     //   await tx.wait();
//     //   console.log("Swap executed");
//     // } catch (err) {
//     //   console.log("Swap not ready yet:", err.reason || err.message);
//     // }

//     return NextResponse.json({
//       message: `Trade ${action} recorded.`,
//     });
//   } catch (error) {
//     console.error("Error in respondToSentRequest:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
