import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = process.env.PORT || 4173;
const root = process.cwd();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

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
  const { text, direction } = await readBody(request);
  if (!text || !['fr-en', 'en-fr'].includes(direction)) {
    sendJson(response, 400, { error: 'Requête invalide.' });
    return;
  }

  // Architecture prête pour une API serveur sécurisée : appelez ici votre fournisseur IA
  // avec process.env.TRANSLATION_API_KEY, jamais depuis le navigateur.
  sendJson(response, 501, { error: 'Service IA non configuré côté serveur.' });
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

createServer(async (request, response) => {
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
}).listen(port, () => {
  console.log(`US Translator disponible sur http://localhost:${port}`);
});
