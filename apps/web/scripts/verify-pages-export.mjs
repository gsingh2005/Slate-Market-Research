import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile("out/index.html", "utf8");
assert.match(index, /\/Slate-Market-Research\/_next\//);
assert.match(index, /href="\/Slate-Market-Research\/"/);
console.log("GitHub Pages export verified: out/index.html uses the repository base path.");
