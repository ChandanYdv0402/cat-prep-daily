import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectCoding } from "./coding-sources.mjs";

const project = dirname(fileURLToPath(import.meta.url));
const outputPath = process.argv[2];
if (!outputPath || process.argv.length !== 3) {
  throw new Error("Usage: node export-pages.mjs <new-output-directory>");
}
const output = resolve(outputPath);
const previous = await readFile(join(project, ".dashboard-data", "coding.json"), "utf8")
  .then(JSON.parse)
  .catch(error => {
    if (error.code === "ENOENT") return {};
    throw error;
  });
const feed = await collectCoding(previous);
if (!feed.players.some(player => Object.keys(player.stats).length)) {
  throw new Error("No publishable coding profiles were available.");
}

await mkdir(output);
await cp(join(project, "dist"), output, { recursive: true, force: false, errorOnExist: true });

const page = join(output, "index.html");
const html = await readFile(page, "utf8");
await writeFile(page, html.replace("<head>", '<head>\n  <meta name="coding-feed" content="coding-data.json">'));
await writeFile(join(output, "coding-data.json"), JSON.stringify({
  checkedAt: feed.checkedAt,
  players: feed.players,
  activity: Object.fromEntries(Object.entries(feed.activity).map(([platform, { since, counts }]) => [platform, { since, counts }])),
  contests: feed.contests,
  failed: feed.failed,
}) + "\n", "utf8");
await writeFile(join(output, ".nojekyll"), "");
console.log("Static dashboard exported to " + output);
