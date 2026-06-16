import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cleanTranslationText, translateOffline } from './src/translationService.js';

const port = process.env.PORT || 4173;
const root = process.cwd();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
};

export function translateLocal(text, direction, context = 'restaurant') {
  return { ...translateOffline(text, direction), context, mode: 'local', simulated: true };
}

export function buildSuggestions() {
  return translateOffline('', 'en-fr').suggestions;
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function handleTranslate(request, response) {
  const { text, direction, context = 'restaurant' } = await readBody(request);
  if (!text || !['fr-en', 'en-fr'].includes(direction)) {
    sendJson(response, 400, { error: 'Requête invalide.' });
    return;
  }
  sendJson(response, 200, translateLocal(cleanTranslationText(text), direction, context));
}

async function serveStatic(request, response) {
  const requestedPath = new URL(request.url, `http://${request.headers.host}`).pathname;
  const safePath = normalize(requestedPath === '/' ? '/index.html' : requestedPath).replace(/^[/\\]+/, '');
  const filePath = join(root, safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const file = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(file);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url === '/api/translate') {
      await handleTranslate(request, response);
      return;
    }
    await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: 'Erreur serveur.' });
  }
});

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  server.listen(port, () => console.log(`US Translator disponible sur http://localhost:${port}`));
}

export { cleanTranslationText };
