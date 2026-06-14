import { findOfflinePhrase } from './src/offlinePhrases.js';
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

const unavailableFallbackMessage = 'Traduction IA non connectée. Cette phrase n’est pas disponible en mode secours local.';

const frToEnDictionary = new Map([
  ['bonjour j’espère que tout va bien pour vous', ['Hi, I hope you’re doing well.', 'Hi, I hope you are doing well.']],
  ['bonjour j’espère que vous allez bien', ['Hi, I hope you’re doing well.', 'Hi, I hope you are doing well.']],
  ['bonsoir comment allez-vous', ['Good evening, how are you doing?', 'Good evening, how are you?']],
  ['bonjour comment allez-vous', ['Hi, how are you doing?', 'Hello, how are you?']],
  ['comment allez-vous', ['How are you doing?', 'How are you?']],
  ['j’espère que tout va bien pour vous', ['I hope you’re doing well.', 'I hope you are doing well.']],
  ['j’espère que vous allez bien', ['I hope you’re doing well.', 'I hope you are doing well.']],
  ['j’espère que tout va bien', ['I hope everything is going well.', 'I hope everything is going well.']],
  ['je vous remercie', ['Thank you.', 'Thank you.']],
  ['merci pour votre aide', ['Thank you for your help.', 'Thank you for your help.']],
  ['bonjour', ['Hi.', 'Hello.']],
  ['bonsoir', ['Good evening.', 'Good evening.']],
  ['merci', ['Thank you.', 'Thank you.']],
  ['merci beaucoup', ['Thank you very much.', 'Thank you very much.']],
  ['au revoir', ['Goodbye.', 'Goodbye.']],
  ['je ne comprends pas', ['I don’t understand.', 'I do not understand.']],
  ['pouvez-vous répéter lentement s’il vous plaît', ['Could you repeat that slowly, please?', 'Could you repeat slowly, please?']],
  ['je suis français je ne parle pas bien anglais', ['I’m French. I don’t speak English very well.', 'I am French; I do not speak English very well.']],
  ['je voudrais payer l’addition s’il vous plaît', ['Can I get the check, please?', 'I would like to pay the bill, please.']],
  ['où sont les toilettes', ['Where’s the restroom?', 'Where are the toilets?']],
  ['je voudrais de l’eau s’il vous plaît', ['Can I get some water, please?', 'I would like some water, please.']],
  ['je voudrais payer par carte', ['Can I pay by card?', 'I would like to pay by card.']],
  ['pouvez-vous m’aider', ['Can you help me, please?', 'Could you help me?']],
  ['je cherche la sortie', ['I’m looking for the exit.', 'I am looking for the exit.']],
  ['où est le parking', ['Where’s the parking lot?', 'Where is the parking lot?']],
  ['je dois récupérer ma voiture de location', ['I need to pick up my rental car.', 'I need to retrieve my rental car.']],
  ['j’ai une réservation', ['I have a reservation.', 'I have a reservation.']],
  ['je voudrais une chambre', ['I’d like a room.', 'I would like a room.']],
  ['j’ai besoin d’aide', ['I need help.', 'I need help.']],
  ['appelez une ambulance', ['Please call an ambulance.', 'Please call an ambulance.']],
]);

function buildUnavailableTranslation(base) {
  return {
    ...base,
    hasTranslation: false,
    canSpeak: false,
    error: true,
    errorMessage: unavailableFallbackMessage,
    message: unavailableFallbackMessage,
    literalEnglishText: '',
    americanEnglishText: '',
  };
}

function buildAvailableTranslation(base, sourceText, match, offlineMatch = null) {
  const validation = validateAmericanEnglishResult(sourceText, match[0]);
  if (!validation.canSpeak) return buildUnavailableTranslation(base);
  return {
    ...base,
    hasTranslation: true,
    canSpeak: true,
    errorMessage: '',
    literalEnglishText: match[1],
    americanEnglishText: validation.americanEnglishText,
    offlinePhraseId: offlineMatch?.phrase?.id || '',
    confidence: offlineMatch?.confidence || 1,
  };
}

function getLocalFrenchMatch(text) {
  const key = normalizeFrenchKey(text);
  const directMatch = normalizedFrToEnDictionary.get(key);
  if (directMatch) return directMatch;

  const greetingMatch = key.match(/^(bonjour|salut|bonsoir) (.+)$/);
  if (!greetingMatch) return null;
  const [, greeting, rest] = greetingMatch;
  const restMatch = normalizedFrToEnDictionary.get(rest);
  if (!restMatch) return null;
  const greetingText = greeting === 'bonsoir' ? 'Good evening' : 'Hi';
  const joinGreeting = (phrase) => `${greetingText}, ${/^I(?:\b|[’'])/.test(phrase) ? phrase : phrase.charAt(0).toLowerCase() + phrase.slice(1)}`;
  return [joinGreeting(restMatch[0]), joinGreeting(restMatch[1])];
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


function normalizeFrenchKey(text = '') {
  return cleanTranslationText(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9’' ]+/g, ' ')
    .replace(/[’']/g, '’')
    .replace(/\bj\s+(?=ai|espere|avais|aimerais|habite|arrive)/g, 'j’')
    .replace(/\s+/g, ' ')
    .trim();
}

const unavailableTranslationPatterns = [
  /traduction ia non connectée/i,
  /phrase non disponible en mode secours/i,
  /mode secours local/i,
  /erreur/i,
  /api non connectée/i,
  /api non disponible/i,
  /translation unavailable/i,
  /ai not connected/i,
];

function hasTechnicalPrefix(text = '') {
  const value = String(text).trim();
  return parasitePrefixPatterns.some((pattern) => pattern.test(value)) || unavailableTranslationPatterns.some((pattern) => pattern.test(value));
}

function hasLikelyFrenchContent(text = '') {
  const value = String(text).toLowerCase();
  const frenchWords = value.match(/\b(?:bonjour|bonsoir|merci|beaucoup|au revoir|je|j’ai|voudrais|pouvez|vous|s’il|pla[iî]t|toilettes|parking|sortie|r[ée]servation|voiture|location|fran[cç]ais|anglais|comprends|r[ée]p[ée]ter|lentement|addition|eau|carte|aider|cherche|chambre|besoin|aide|appelez|ambulance|o[ùu]|sont|est|dois|r[ée]cup[ée]rer)\b/g) || [];
  return /[àâçéèêëîïôùûüÿœ]/i.test(value) || frenchWords.length >= 2;
}

function isSameOrNearlySame(source = '', result = '') {
  const normalize = (value) => cleanTranslationText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const sourceNorm = normalize(source);
  const resultNorm = normalize(result);
  if (!sourceNorm || !resultNorm) return false;
  return sourceNorm === resultNorm || sourceNorm.includes(resultNorm) || resultNorm.includes(sourceNorm);
}

function validateAmericanEnglishResult(sourceText, resultText) {
  const cleaned = cleanTranslationText(resultText);
  if (!cleaned || hasTechnicalPrefix(resultText) || hasLikelyFrenchContent(cleaned) || isSameOrNearlySame(sourceText, cleaned)) {
    return { canSpeak: false, americanEnglishText: '' };
  }
  return { canSpeak: true, americanEnglishText: cleaned };
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

const normalizedFrToEnDictionary = new Map(Array.from(frToEnDictionary, ([key, value]) => [normalizeFrenchKey(key), value]));

function translateLocal(text, direction, context) {
  const sourceLanguage = direction === 'fr-en' ? 'fr-FR' : 'en-US';
  const targetLanguage = direction === 'fr-en' ? 'en-US' : 'fr-FR';
  const base = { sourceText: text, sourceLanguage, targetLanguage, suggestions: buildSuggestions(context), context, mode: 'local' };

  if (direction === 'en-fr') {
    const match = enToFrDictionary.find(([pattern]) => pattern.test(text));
    return { ...base, frenchText: match?.[1] || 'Mode secours local : phrase anglaise détectée, traduction approximative.', frenchMeaning: match?.[1] || 'Sens approximatif détecté localement.', literalEnglishText: text, americanEnglishText: cleanTranslationText(text) };
  }

  const localizedBase = { ...base, frenchText: text, frenchMeaning: text };
  const offlineMatch = findOfflinePhrase(text, { category: context });
  if (!offlineMatch) return buildUnavailableTranslation(localizedBase);
  return buildAvailableTranslation(localizedBase, text, [offlineMatch.phrase.americanEnglishText, offlineMatch.phrase.frenchMeaning], offlineMatch);
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
