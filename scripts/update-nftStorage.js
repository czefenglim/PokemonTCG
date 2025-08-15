import { NFTStorage, File } from "nft.storage";
import fs from "fs";
import path from "path";
import "dotenv/config";

const client = new NFTStorage({ token: process.env.NFT_STORAGE_TOKEN });
const metadataFolder = path.resolve("./metadata");

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function uploadMetadata() {
  console.log("📤 Uploading metadata folder to NFT.Storage...");
  try {
    const allFiles = fs.readdirSync(metadataFolder).map((file) => {
      const filePath = path.join(metadataFolder, file);
      const content = fs.readFileSync(filePath);
      return new File([content], file);
    });

    // split into batches of 200
    const batches = chunkArray(allFiles, 200);

    for (let i = 0; i < batches.length; i++) {
      console.log(`📦 Uploading batch ${i + 1}/${batches.length}...`);
      const cid = await client.storeDirectory(batches[i]);
      console.log(`✅ Batch ${i + 1} uploaded! CID: ${cid}`);
      console.log(`🔗 https://nftstorage.link/ipfs/${cid}/`);
    }
  } catch (err) {
    console.error("❌ Upload failed:", err.message || err);
  }
}

uploadMetadata();
