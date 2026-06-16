import { englishDirectPhrases, englishObjects, frenchDirectPhrases, frenchObjects } from './offlinePhrases.js';

export const ERROR_MESSAGE = 'Phrase non disponible hors réseau. Essayez une phrase plus simple ou connectez l’IA.';

const politeEdges = [
  'bonjour', 'bonsoir', 'salut', 'excusez moi', 's il vous plait', 'sil vous plait', 's il te plait', 'merci',
];

export function cleanTranslationText(text = '') {
  let cleaned = String(text).trim();
  let previous = '';
  const prefixes = [/^please\s+help\s+me\s+with\s+this\s*:?\s*/i, /^help\s+me\s+with\s+this\s*:?\s*/i, /^translate\s+this\s*:?\s*/i, /^say\s+this\s*:?\s*/i, /^in\s+american\s+english\s*:?\s*/i];
  while (cleaned && cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned.replace(/^[\s"'“”‘’`]+|[\s"'“”‘’`]+$/g, '').trim();
    prefixes.forEach((pattern) => { cleaned = cleaned.replace(pattern, '').trim(); });
    cleaned = cleaned.replace(/^[:\-–—]+\s*/, '').trim();
  }
  return cleaned;
}

export function normalizeText(text = '') {
  return cleanTranslationText(text)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'\s-]+/g, ' ')
    .replace(/['-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeFrench(text = '') {
  let value = normalizeText(text);
  value = value.replace(/\bj\s+(?=ai|aurais|espere|aimerais)/g, 'j ');
  let changed = true;
  while (changed && value) {
    changed = false;
    for (const edge of politeEdges) {
      const start = `${edge} `;
      const end = ` ${edge}`;
      if (value === edge) return edge;
      if (value.startsWith(start)) { value = value.slice(start.length).trim(); changed = true; }
      if (value.endsWith(end)) { value = value.slice(0, -end.length).trim(); changed = true; }
    }
  }
  return value;
}

const normMap = (object) => new Map(Object.entries(object).map(([key, value]) => [normalizeFrench(key), value]));
const directFr = normMap(frenchDirectPhrases);
const objectsFr = new Map(Object.entries(frenchObjects).map(([key, value]) => [normalizeFrench(key), value]));
const directEn = new Map(Object.entries(englishDirectPhrases).map(([key, value]) => [normalizeText(key), value]));
const objectsEn = new Map(Object.entries(englishObjects).map(([key, value]) => [normalizeText(key), value]));

const badResult = /traduction ia non connectée|phrase non disponible en mode secours local|mode secours local|translation unavailable|ai not connected|erreur technique|erreur/i;

function objectFr(fragment) { return objectsFr.get(normalizeFrench(fragment)); }
function objectEn(fragment) { return objectsEn.get(normalizeText(fragment)); }

function unavailable(sourceText) {
  return { hasTranslation: false, canSpeak: false, sourceText, frenchText: '', americanEnglishText: '', frenchMeaning: '', direction: '', source: 'offline', confidence: 0, errorMessage: ERROR_MESSAGE, suggestions: [] };
}

function available({ sourceText, frenchText, americanEnglishText, frenchMeaning, direction, confidence = 1, suggestions = [] }) {
  if (!americanEnglishText || badResult.test(americanEnglishText)) return unavailable(sourceText);
  return { hasTranslation: true, canSpeak: direction === 'fr-to-en', sourceText, frenchText, americanEnglishText, frenchMeaning, direction, source: 'offline', confidence, errorMessage: '', suggestions };
}

export function translateFrenchToEnglish(text) {
  const sourceText = cleanTranslationText(text);
  if (!sourceText || badResult.test(sourceText)) return unavailable(sourceText);
  const key = normalizeFrench(sourceText);
  const direct = directFr.get(key);
  if (direct) return available({ sourceText, frenchText: sourceText, americanEnglishText: direct[0], frenchMeaning: direct[1], direction: 'fr-to-en' });

  const patterns = [
    [/^il me faudrait (?:des |du |de la |de l |d )?(.+)$/, (o) => `Could I get some ${o}, please?`],
    [/^j aurais besoin (?:de |d )(.+)$/, (o) => `I need ${o}, please.`],
    [/^je voudrais (?:des |du |de la |de l |d |un |une |le |la |les )?(.+)$/, (o) => `I’d like ${o}, please.`],
    [/^est ce que je peux avoir (?:des |du |de la |de l |d |un |une |le |la |les )?(.+)$/, (o) => `Could I get ${o}, please?`],
    [/^pouvez vous me donner (?:des |du |de la |de l |d |un |une |le |la |les )?(.+)$/, (o) => `Could I get ${o}, please?`],
    [/^ou sont les (.+)$/, (o) => `Where is the ${o}?`],
    [/^ou est le (.+)$/, (o) => `Where is the ${o}?`],
    [/^je cherche (?:le |la |les |l )?(.+)$/, (o) => `I’m looking for ${o}.`],
  ];
  for (const [regex, render] of patterns) {
    const match = key.match(regex);
    if (!match) continue;
    const found = objectFr(match[1]);
    if (found) return available({ sourceText, frenchText: sourceText, americanEnglishText: render(found.en), frenchMeaning: sourceText, direction: 'fr-to-en', confidence: 0.86 });
  }
  return unavailable(sourceText);
}

const rescueSuggestions = [
  { americanEnglishText: 'Could you repeat that slowly, please?', frenchText: 'Pouvez-vous répéter lentement, s’il vous plaît ?' },
  { americanEnglishText: 'Could you write that down, please?', frenchText: 'Pouvez-vous l’écrire, s’il vous plaît ?' },
  { americanEnglishText: 'I don’t understand English very well.', frenchText: 'Je ne comprends pas très bien l’anglais.' },
];

export function translateEnglishToFrench(text) {
  const sourceText = cleanTranslationText(text);
  if (!sourceText || badResult.test(sourceText)) return { ...unavailable(sourceText), suggestions: rescueSuggestions };
  const key = normalizeText(sourceText);
  const direct = directEn.get(key);
  if (direct) return { ...available({ sourceText, frenchText: direct, americanEnglishText: sourceText, frenchMeaning: direct, direction: 'en-to-fr' }), canSpeak: false, suggestions: rescueSuggestions };
  const patterns = [
    [/^i don t want (.+) in my house$/, (p) => `Je ne veux pas que ${p} soit chez moi.`],
    [/^i don t want (.+) here$/, (p) => `Je ne veux pas que ${p} soit ici.`],
    [/^i need (.+)$/, (o) => `J’ai besoin de ${o}.`],
    [/^i would like (.+)$/, (o) => `Je voudrais ${o}.`],
    [/^can i get (.+)$/, (o) => `Puis-je avoir ${o} ?`],
    [/^can i have (.+)$/, (o) => `Puis-je avoir ${o} ?`],
  ];
  for (const [regex, render] of patterns) {
    const match = key.match(regex);
    if (!match) continue;
    const translated = objectEn(match[1]);
    if (translated) return { ...available({ sourceText, frenchText: render(translated), americanEnglishText: sourceText, frenchMeaning: render(translated), direction: 'en-to-fr', confidence: 0.86 }), canSpeak: false, suggestions: rescueSuggestions };
  }
  return { ...unavailable(sourceText), suggestions: rescueSuggestions };
}
