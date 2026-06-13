import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

const port = process.env.PORT || 4173;
const root = process.cwd();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
};

const aiTranslationInstructions = [
  'Return spoken American English.',
  'Use a short, polite, practical sentence.',
  'Do not translate literally.',
  'Do not use British English.',
  'Do not use formal classroom English.',
  'Adapt the wording to the context.',
].join(' ');

const contextReplies = {
  restaurant: ['Could you say that again, please?', 'Can I get this one, please?', 'Can I get the check, please?'],
  hotel: ['I have a reservation.', 'Can you help me, please?', 'What time is check-out?'],
  car: ['I need to pick up my rental car.', 'Where can I get gas?', 'Where’s the parking lot?'],
  store: ['How much is this?', 'Do you have this in another size?', 'Can I get a receipt?'],
  border: ['Sure. Here’s my passport.', 'I don’t understand.', 'Could you speak slowly, please?'],
  emergency: ['I need help.', 'Please call an ambulance.', 'I’m hurt.'],
  direction: ['Where’s the exit?', 'Should I go left or right?', 'Do I go straight ahead?'],
  payment: ['Can I pay by card?', 'Can I pay cash?', 'Can I get a receipt?'],
};

const replyFrenchTranslations = new Map([
  ['Could you say that again, please?', 'Pouvez-vous répéter, s’il vous plaît ?'],
  ['Could you repeat that slowly, please?', 'Pouvez-vous répéter lentement, s’il vous plaît ?'],
  ['Could you speak slowly, please?', 'Pouvez-vous parler lentement, s’il vous plaît ?'],
  ['Can I get this one, please?', 'Je voudrais celui-ci, s’il vous plaît.'],
  ['Can I get the check, please?', 'Je voudrais payer l’addition, s’il vous plaît.'],
  ['I have a reservation.', 'J’ai une réservation.'],
  ['Can you help me, please?', 'Pouvez-vous m’aider, s’il vous plaît ?'],
  ['What time is check-out?', 'À quelle heure faut-il libérer la chambre ?'],
  ['I need to pick up my rental car.', 'Je dois récupérer ma voiture de location.'],
  ['Where can I get gas?', 'Où puis-je trouver de l’essence ?'],
  ['I need help with the car.', 'J’ai besoin d’aide avec la voiture.'],
  ['Where’s the parking lot?', 'Où est le parking ?'],
  ['How much is this?', 'Combien ça coûte ?'],
  ['Do you have another size?', 'Avez-vous une autre taille ?'],
  ['Can I get a receipt?', 'Puis-je avoir un reçu ?'],
  ['Yes, of course.', 'Oui, bien sûr.'],
  ['Sure. Here’s my passport.', 'Oui, bien sûr. Voici mon passeport.'],
  ['I don’t understand.', 'Je ne comprends pas.'],
  ['I’m visiting as a tourist.', 'Je suis touriste.'],
  ['I need help.', 'J’ai besoin d’aide.'],
  ['Please call an ambulance.', 'Appelez une ambulance, s’il vous plaît.'],
  ['I’m hurt.', 'Je suis blessé.'],
  ['Can you show me on the map?', 'Pouvez-vous me montrer sur la carte ?'],
  ['Is it far from here?', 'Est-ce loin d’ici ?'],
  ['Should I go left or right?', 'Je dois aller à gauche ou à droite ?'],
  ['Do I go straight ahead?', 'Je dois aller tout droit ?'],
  ['Can I pay by card?', 'Puis-je payer par carte ?'],
  ['Can I get a receipt?', 'Puis-je avoir le reçu ?'],
  ['Can I pay cash?', 'Puis-je payer en espèces ?'],
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
  [/bonjour.*comment.*allez|comment.*allez.*vous/i, 'Hi, how are you doing?', 'Hello, how are you?'],
  [/payer.*addition|addition/i, 'Can I get the check, please?', 'I would like to pay the bill, please.'],
  [/toilettes?|wc/i, 'Where’s the restroom?', 'Where are the toilets?'],
  [/payer.*carte|carte/i, 'Can I pay by card?', 'I would like to pay by card.'],
  [/fran[cç]ais.*parle pas bien anglais|parle pas bien anglais/i, 'I’m French. I don’t speak English very well.', 'I am French; I do not speak English very well.'],
  [/r[ée]p[ée]ter.*lentement|lentement.*r[ée]p[ée]ter/i, 'Could you repeat that slowly, please?', 'Could you repeat slowly, please?'],
  [/eau/i, 'Can I get some water, please?', 'I would like some water, please.'],
  [/sortie/i, 'I’m looking for the exit.', 'I am looking for the exit.'],
  [/voiture de location|r[ée]cup[ée]rer.*voiture/i, 'I need to pick up my rental car.', 'I need to retrieve my rental car.'],
  [/parking/i, 'Where’s the parking lot?', 'Where is the parking?'],
  [/pouvez-vous m[’']aider|aidez-moi|aide/i, 'Can you help me, please?', 'Could you help me?'],
  [/passeport/i, 'Sure. Here’s my passport.', 'Yes, of course. Here is my passport.'],
  [/touriste|vacances/i, 'I’m visiting as a tourist.', 'I am visiting as a tourist.'],
  [/urgence/i, 'I need help.', 'I need help now, please.'],
  [/ambulance/i, 'Please call an ambulance.', 'Please call an ambulance.'],
  [/bless[ée]|mal/i, 'I’m hurt.', 'I am hurt.'],
  [/m[ée]decin|h[ôo]pital/i, 'I need a doctor, please.', 'I need a doctor, please.'],
  [/chemin|adresse|o[ùu]/i, 'Can you show me on the map, please?', 'Can you show me on the map, please?'],
  [/h[ôo]tel|r[ée]servation/i, 'I have a reservation.', 'I have a reservation.'],
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

const parasitePrefixPatterns = [
  /^please\s+help\s+me\s+with\s+this\s*:?\s*/i,
  /^help\s+me\s+with\s+this\s*:?\s*/i,
  /^translate\s+this\s*:?\s*/i,
  /^say\s+this\s*:?\s*/i,
  /^the\s+translation\s+is\s*:?\s*/i,
  /^here\s+is\s+the\s+translation\s*:?\s*/i,
  /^in\s+american\s+english\s*:?\s*/i,
  /^(?:assistant|ai|instruction|response|answer|output)\s*:?\s*/i,
];

export function cleanTranslationText(text = '') {
  let cleaned = String(text).trim();
  let previous = '';
  while (cleaned && cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned.trim().replace(/^[\s"'“”‘’`]+|[\s"'“”‘’`]+$/g, '').trim();
    parasitePrefixPatterns.forEach((pattern) => {
      cleaned = cleaned.replace(pattern, '').trim();
    });
    cleaned = cleaned.replace(/^[:\-–—]+\s*/, '').trim();
  }
  return cleaned;
}

function buildSuggestions(context) {
  return (contextReplies[context] || contextReplies.restaurant).map((americanEnglishText) => {
    const cleanAmericanEnglishText = cleanTranslationText(americanEnglishText);
    return {
      americanEnglishText: cleanAmericanEnglishText,
      frenchText: replyFrenchTranslations.get(cleanAmericanEnglishText) || 'Traduction française à confirmer.',
    };
  });
}

function translateLocal(text, direction, context) {
  const sourceLanguage = direction === 'fr-en' ? 'fr-FR' : 'en-US';
  const targetLanguage = direction === 'fr-en' ? 'en-US' : 'fr-FR';
  const base = { sourceText: text, sourceLanguage, targetLanguage, suggestions: buildSuggestions(context), context, mode: 'local' };

  if (direction === 'en-fr') {
    const match = enToFrDictionary.find(([pattern]) => pattern.test(text));
    return { ...base, frenchText: match?.[1] || 'Mode secours local : phrase anglaise détectée, traduction approximative.', frenchMeaning: match?.[1] || 'Sens approximatif détecté localement.', literalEnglishText: text, americanEnglishText: cleanTranslationText(text) };
  }

  const match = frToEnDictionary.find(([pattern]) => pattern.test(text));
  return { ...base, frenchText: text, frenchMeaning: text, literalEnglishText: match?.[2] || text, americanEnglishText: cleanTranslationText(match?.[1] || text) };
}

async function handleTranslate(request, response) {
  const { text, direction, context = 'restaurant' } = await readBody(request);
  if (!text || !['fr-en', 'en-fr'].includes(direction)) {
    sendJson(response, 400, { error: 'Requête invalide.' });
    return;
  }

  const cleanText = direction === 'fr-en' ? cleanTranslationText(text) : text.trim();
  // Instructions pour brancher une IA serveur : aiTranslationInstructions impose un anglais américain oral, court, poli, pratique, contextuel et non littéral.
  sendJson(response, 200, translateLocal(cleanText, direction, context));
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
  server.listen(port, () => {
    console.log(`US Translator disponible sur http://localhost:${port}`);
  });
}

export { buildSuggestions, translateLocal };
