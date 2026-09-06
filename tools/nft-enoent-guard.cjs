// Next 15.5 still traces Pages Router internals (_app/_document/_error) even in
// App Router-only apps. Collecting build traces reads those .nft.json files
// without treating ENOENT as empty, and on Windows they can vanish while static
// generation runs in parallel. Traces are unused here (no output: 'standalone').
const fs = require("node:fs");

const PAGES_NFT = /[/\\]server[/\\]pages[/\\]_(?:app|document|error)\.js\.nft\.json$/;
const originalReadFile = fs.promises.readFile.bind(fs.promises);

fs.promises.readFile = async function readFile(path, options) {
  try {
    return await originalReadFile(path, options);
  } catch (error) {
    if (error && error.code === "ENOENT" && PAGES_NFT.test(String(path))) {
      return Buffer.from(JSON.stringify({ version: 1, files: [] }));
    }
    throw error;
  }
};
