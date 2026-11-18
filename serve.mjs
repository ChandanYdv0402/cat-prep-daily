import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectCoding } from "./coding-sources.mjs";

const project = dirname(fileURLToPath(import.meta.url));
const root = join(project, "dist");
const storage = join(project, ".dashboard-data");
const historyFile = join(storage, "coding.json");
const port = Number(process.env.DASHBOARD_PORT || 4175);
const interval = 5 * 60_000;
const contentTypes = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8",
};

let refresh;
let nextRefresh = 0;
let coding = null;

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return fallback;
  }
}

async function refreshCoding() {
  coding ??= await readJson(historyFile, {});
  if (Date.now() < nextRefresh) return coding;
  const legacy = coding.activity?.codechef ? null : await readJson(join(storage, "codechef.json"), null);
  const updated = await collectCoding(coding, legacy?.entries);
  await mkdir(storage, { recursive: true });
  await writeFile(historyFile + ".tmp", JSON.stringify(updated) + "\n", "utf8");
  await rename(historyFile + ".tmp", historyFile);
  coding = updated;
  nextRefresh = Date.now() + (updated.failed.length ? 60_000 : interval);
  return coding;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    if (url.pathname === "/api/coding" && request.method === "GET") {
      if (request.headers["sec-fetch-site"] === "cross-site") {
        response.writeHead(403).end();
        return;
      }
      refresh ??= refreshCoding().finally(() => { refresh = null; });
      const result = await refresh;
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
        .end(JSON.stringify(result));
      return;
    }
    const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const file = resolve(root, "." + requestedPath);
    const path = relative(root, file);
    if (!path || path.startsWith("..") || resolve(root, path) !== file || !contentTypes[extname(file)]) {
      response.writeHead(404).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": contentTypes[extname(file)], "Content-Length": info.size, "Cache-Control": "no-cache" });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).on("error", () => response.destroy()).pipe(response);
  } catch (error) {
    if (response.headersSent) response.destroy();
    else response.writeHead(error.code === "ENOENT" || error instanceof URIError ? 404 : 500).end();
  }
});

server.listen(port, "127.0.0.1", () => console.log("Chandan's dashboard: http://127.0.0.1:" + port + "/"));
