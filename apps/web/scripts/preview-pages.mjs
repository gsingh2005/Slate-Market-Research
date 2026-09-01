import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const defaultPort = Number(process.env.PORT || 4173);
const defaultPrefix = "/Slate-Market-Research";
const defaultOutputDirectory = resolve(fileURLToPath(new URL("../out/", import.meta.url)));
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function send(response, status, message) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

function isWithin(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

async function resolveExportedFile(pathname, prefix, outputDirectory) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return { status: 400 };
  }
  if (!decodedPath.startsWith(`${prefix}/`)) return { status: 404 };

  const relativePath = decodedPath.slice(prefix.length);
  let candidate = resolve(outputDirectory, `.${relativePath}`);
  if (!isWithin(outputDirectory, candidate)) return { status: 400 };

  try {
    if ((await stat(candidate)).isDirectory()) candidate = resolve(candidate, "index.html");
    if (!isWithin(outputDirectory, candidate) || !(await stat(candidate)).isFile()) {
      return { status: 404 };
    }
  } catch {
    return { status: 404 };
  }
  return { status: 200, file: candidate };
}

export function createPreviewServer({
  prefix = defaultPrefix,
  outputDirectory = defaultOutputDirectory,
} = {}) {
  const normalizedOutputDirectory = resolve(outputDirectory);
  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (requestUrl.pathname === prefix) {
      response.writeHead(308, { Location: `${prefix}/` });
      response.end();
      return;
    }

    const resolved = await resolveExportedFile(
      requestUrl.pathname,
      prefix,
      normalizedOutputDirectory,
    );
    if (resolved.status !== 200 || !resolved.file) {
      send(response, resolved.status, resolved.status === 400 ? "Invalid path" : "Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(resolved.file)] || "application/octet-stream",
    });
    const stream = createReadStream(resolved.file);
    stream.on("error", () => {
      if (!response.headersSent) send(response, 500, "Unable to read preview file");
      else response.destroy();
    });
    stream.pipe(response);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createPreviewServer().listen(defaultPort, "127.0.0.1", () => {
    console.log(`Previewing http://localhost:${defaultPort}${defaultPrefix}/`);
  });
}
