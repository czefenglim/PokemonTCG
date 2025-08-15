import pinataSDK from "@pinata/sdk";
import path from "path";
import fs from "fs";
import "dotenv/config";

const pinata = new pinataSDK({
  pinataJWTKey: process.env.PINATA_JWT,
});

const metadataFolder = path.resolve("./metadata");

async function uploadPartial(limit = 500) {
  try {
    console.log("📤 Uploading partial metadata folder to Pinata...");
    console.log("📂 Uploading from path:", metadataFolder);

    // get all files
    const allFiles = fs
      .readdirSync(metadataFolder)
      .filter((f) => f.endsWith(".json"));

    // pick only the first {limit}
    const selectedFiles = allFiles.slice(0, limit);
    console.log(
      `📑 Found ${allFiles.length} files, uploading first ${selectedFiles.length}`
    );

    // prepare a temp folder
    const tempFolder = path.resolve("./metadata_temp");
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder);
    }

    // copy selected files into temp folder
    selectedFiles.forEach((file) => {
      fs.copyFileSync(
        path.join(metadataFolder, file),
        path.join(tempFolder, file)
      );
    });

    // upload the temp folder
    const result = await pinata.pinFromFS(tempFolder, {
      wrapWithDirectory: true,
    });

    console.log("✅ Upload complete!");
    console.log("CID:", result.IpfsHash);
    console.log(
      `🔗 Gateway URL: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}/`
    );

    // cleanup (optional)
    selectedFiles.forEach((file) => {
      fs.unlinkSync(path.join(tempFolder, file));
    });
    fs.rmdirSync(tempFolder);
  } catch (err) {
    console.error("❌ Upload failed:", err.message || err);
  }
}

uploadPartial(200); // upload only 999 files
