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
  '.svg': 'image/svg+xml; charset=utf-8',
};

const contextReplies = {
  restaurant: ['Could you repeat slowly, please?', 'I would like this one, please.', 'Can we have the check, please?'],
  hotel: ['I have a reservation.', 'Could you help me, please?', 'What time is check-out?'],
  car: ['I rented this car.', 'I need help with the car.', 'Where can I park?'],
  store: ['How much is it?', 'Do you have another size?', 'Can I get a receipt?'],
  border: ['Yes, of course.', 'I am a tourist.', 'Could you repeat slowly, please?'],
  emergency: ['I need help now, please.', 'Please call an ambulance.', 'I do not feel well.'],
  direction: ['Can you show me on the map?', 'Is it far from here?', 'Which way should I go?'],
  payment: ['Can I pay by card?', 'Could I have the receipt?', 'Can we try again?'],
};

const replyFrenchTranslations = new Map([
  ['Could you repeat slowly, please?', 'Pouvez-vous répéter lentement, s’il vous plaît ?'],
  ['I would like this one, please.', 'Je voudrais celui-ci, s’il vous plaît.'],
  ['Can we have the check, please?', 'Pouvons-nous avoir l’addition, s’il vous plaît ?'],
  ['I have a reservation.', 'J’ai une réservation.'],
  ['Could you help me, please?', 'Pouvez-vous m’aider, s’il vous plaît ?'],
  ['What time is check-out?', 'À quelle heure faut-il libérer la chambre ?'],
  ['I rented this car.', 'J’ai loué cette voiture.'],
  ['I need help with the car.', 'J’ai besoin d’aide avec la voiture.'],
  ['Where can I park?', 'Où puis-je me garer ?'],
  ['How much is it?', 'Combien ça coûte ?'],
  ['Do you have another size?', 'Avez-vous une autre taille ?'],
  ['Can I get a receipt?', 'Puis-je avoir un reçu ?'],
  ['Yes, of course.', 'Oui, bien sûr.'],
  ['I am a tourist.', 'Je suis touriste.'],
  ['I need help now, please.', 'J’ai besoin d’aide maintenant, s’il vous plaît.'],
  ['Please call an ambulance.', 'Appelez une ambulance, s’il vous plaît.'],
  ['I do not feel well.', 'Je ne me sens pas bien.'],
  ['Can you show me on the map?', 'Pouvez-vous me montrer sur la carte ?'],
  ['Is it far from here?', 'Est-ce loin d’ici ?'],
  ['Which way should I go?', 'Par où dois-je aller ?'],
  ['Can I pay by card?', 'Puis-je payer par carte ?'],
  ['Could I have the receipt?', 'Puis-je avoir le reçu ?'],
  ['Can we try again?', 'Pouvons-nous réessayer ?'],
]);

const enToFrDictionary = [
  [/can i see your driver[’']?s license|driver[’']?s license|driver license|driver.*license/i, 'Puis-je voir votre permis de conduire ?'],
  [/passport|customs|border|visa|purpose/i, 'Il demande votre passeport ou des informations de douane.'],
  [/restaurant|menu|order|check|bill|table/i, 'Il parle du menu, de votre commande ou de l’addition.'],
  [/hotel|room|reservation|check in|luggage/i, 'Il parle de votre hôtel, de votre chambre ou de votre réservation.'],
  [/car|rental|parking|gas|insurance/i, 'Il parle de la voiture, du parking, de l’essence ou de la location.'],
  [/emergency|hurt|doctor|hospital|ambulance/i, 'Il s’agit peut-être d’une urgence ou d’un problème médical.'],
  [/where|direction|subway|bus|airport|address/i, 'Il donne ou demande une direction.'],
  [/pay|card|cash|receipt|declined|payment/i, 'Il parle du paiement, de la carte ou du reçu.'],
  [/price|size|store|shop|return|buy/i, 'Il parle d’un achat en magasin.'],
];

const frToEnDictionary = [
  [/passeport/i, 'Yes, of course. Here is my passport.'],
  [/touriste|vacances/i, 'I am visiting as a tourist.'],
  [/voudrais payer l[’']addition|payer l[’']addition|addition.*s[’']il vous plaît|addition|payer|carte/i, 'I’d like to pay the bill, please.'],
  [/urgence|aide/i, 'I need help now, please.'],
  [/médecin|hôpital|mal/i, 'I need a doctor, please.'],
  [/chemin|adresse|où/i, 'Can you show me on the map, please?'],
  [/hôtel|réservation/i, 'I have a reservation.'],
  [/répéter|lentement/i, 'Could you repeat slowly, please?'],
];

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function buildSuggestions(context) {
  return (contextReplies[context] || contextReplies.restaurant).map((americanEnglishText) => ({
    americanEnglishText,
    frenchText: replyFrenchTranslations.get(americanEnglishText) || 'Traduction française à confirmer.',
  }));
}

function translateLocal(text, direction, context) {
  const sourceLanguage = direction === 'fr-en' ? 'fr-FR' : 'en-US';
  const targetLanguage = direction === 'fr-en' ? 'en-US' : 'fr-FR';
  const base = { sourceText: text, sourceLanguage, targetLanguage, suggestions: buildSuggestions(context), mode: 'local' };

  if (direction === 'en-fr') {
    const match = enToFrDictionary.find(([pattern]) => pattern.test(text));
    return { ...base, frenchText: match?.[1] || 'Mode secours local : phrase anglaise détectée, traduction approximative.', americanEnglishText: text };
  }

  const match = frToEnDictionary.find(([pattern]) => pattern.test(text));
  return { ...base, frenchText: text, americanEnglishText: match?.[1] || `Please help me with this: ${text}` };
}

async function handleTranslate(request, response) {
  const { text, direction, context = 'restaurant' } = await readBody(request);
  if (!text || !['fr-en', 'en-fr'].includes(direction)) {
    sendJson(response, 400, { error: 'Requête invalide.' });
    return;
  }

  // Structure prête pour brancher une IA serveur : la réponse garde toujours français + anglais américain.
  sendJson(response, 200, translateLocal(text.trim(), direction, context));
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
