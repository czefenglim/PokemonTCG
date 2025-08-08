import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const jsonPath = path.resolve('./src/app/lib/pokemon-list.json');
const raw = fs.readFileSync(jsonPath, 'utf-8');
const pokemonList = JSON.parse(raw);

const outputDir = path.resolve('./metadata');

if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true });
}
fs.mkdirSync(outputDir);

function padNumber(n) {
  return String(n).padStart(3, '0');
}

function buildMetadata(pokemon) {
  return {
    name: pokemon.name,
    description: pokemon.description,
    image: pokemon.image,
    attributes: [
      { trait_type: 'Type', value: pokemon.type },
      { trait_type: 'Rarity', value: pokemon.rarity },
    ],
  };
}

function main() {
  pokemonList.forEach((p) => {
    const folderName = padNumber(p.id);
    const folderPath = path.join(outputDir, folderName);

    fs.mkdirSync(folderPath, { recursive: true });

    const metadata = buildMetadata(p);

    const metadataPath = path.join(folderPath, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    console.log(
      `✅ Generated metadata for ${p.name} -> ${folderName}/metadata.json`
    );
  });
}

main();
