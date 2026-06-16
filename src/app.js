import { offlineCategories, offlinePhrases } from './offlinePhrases.js';
import { requestTranslation as requestTranslationFromService } from './translationService.js';
const CACHE_VERSION = 'us-translator-engine-v2';

const contexts = {
  restaurant: { label: 'Restaurant', emoji: '🍽️', words: /restaurant|menu|order|coffee|food|drink|table|bill|check|tip|eat|reservation|server|waiter|restroom/i, replies: ['Could you say that again, please?', 'Can I get this one, please?', 'Can I get the check, please?'] },
  hotel: { label: 'Hôtel', emoji: '🏨', words: /hotel|room|reservation|check in|check-in|luggage|breakfast|key|key card|front desk/i, replies: ['I have a reservation.', 'Can you help me, please?', 'What time is check-out?'] },
  car: { label: 'Voiture', emoji: '🚗', words: /car|rental|parking lot|parking|gas|fuel|insurance|driver|license|toll|vehicle/i, replies: ['I need to pick up my rental car.', 'Where can I get gas?', 'Where’s the parking lot?'] },
  store: { label: 'Magasin', emoji: '🛍️', words: /store|shop|price|size|buy|return|receipt|card|cash|cashier|discount/i, replies: ['How much is this?', 'Do you have this in another size?', 'Can I get a receipt?'] },
  border: { label: 'Police / Douane', emoji: '🛂', words: /passport|customs|border|police|officer|visa|purpose|stay|declare|id|driver|license/i, replies: ['Sure. Here’s my passport.', 'I don’t understand.', 'Could you speak slowly, please?'] },
  emergency: { label: 'Urgence', emoji: '🚑', words: /emergency|help|hurt|pain|doctor|hospital|ambulance|allergy|lost|stolen|accident/i, replies: ['I need help.', 'Please call an ambulance.', 'I’m hurt.'] },
  direction: { label: 'Direction', emoji: '🧭', words: /where|direction|address|street|subway|bus|train|airport|walk|far|exit|entrance|left|right|straight/i, replies: ['Where’s the exit?', 'Should I go left or right?', 'Do I go straight ahead?'] },
  payment: { label: 'Paiement', emoji: '💳', words: /pay|card|cash|check|apple pay|google pay|receipt|declined|tip|charge|payment/i, replies: ['Can I pay by card?', 'Can I pay cash?', 'Can I get a receipt?'] },
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
  ['Where’s the parking lot?', 'Où est le parking ?'],
  ['How much is this?', 'Combien ça coûte ?'],
  ['Do you have another size?', 'Avez-vous une autre taille ?'],
  ['Can I get a receipt?', 'Puis-je avoir un reçu ?'],
  ['Yes, here it is.', 'Oui, le voici.'],
  ['I don’t have it with me.', 'Je ne l’ai pas sur moi.'],
  ['Can you explain why, please?', 'Pouvez-vous expliquer pourquoi, s’il vous plaît ?'],
  ['Sure. Here’s my passport.', 'Oui, bien sûr. Voici mon passeport.'],
  ['I don’t understand.', 'Je ne comprends pas.'],
  ['I’m visiting as a tourist.', 'Je suis touriste.'],
  ['I need help.', 'J’ai besoin d’aide.'],
  ['Please call an ambulance.', 'Appelez une ambulance, s’il vous plaît.'],
  ['I’m hurt.', 'Je suis blessé.'],
  ['Where’s the exit?', 'Où est la sortie ?'],
  ['Is it far from here?', 'Est-ce loin d’ici ?'],
  ['Should I go left or right?', 'Je dois aller à gauche ou à droite ?'],
  ['Do I go straight ahead?', 'Je dois aller tout droit ?'],
  ['Can I pay by card?', 'Puis-je payer par carte ?'],
  ['Can I pay cash?', 'Puis-je payer en espèces ?'],
  ['Can we try again?', 'Pouvons-nous réessayer ?'],
  ['Could you write that down, please?', 'Pouvez-vous l’écrire, s’il vous plaît ?'],
  ['I don’t understand English very well.', 'Je ne comprends pas très bien l’anglais.'],
  ['Yes, here it is.', 'Oui, le voici.'],
]);

const enToFrDictionary = [
  [/^can i see your driver[’']?s license\??$/i, 'Puis-je voir votre permis de conduire ?'],
  [/^can i see your passport\??$/i, 'Puis-je voir votre passeport ?'],
  [/^do you have a reservation\??$/i, 'Avez-vous une réservation ?'],
  [/^what[’']?s your name\??$/i, 'Quel est votre nom ?'],
  [/^can you sign here\??$/i, 'Pouvez-vous signer ici ?'],
  [/^would you like a receipt\??$/i, 'Voulez-vous un reçu ?'],
  [/^cash or card\??$/i, 'Espèces ou carte ?'],
  [/^your card was declined\.?$/i, 'Votre carte a été refusée.'],
  [/^the tip is not included\.?$/i, 'Le pourboire n’est pas inclus.'],
  [/^check-in is at three\.?$/i, 'L’arrivée se fait à 15 h.'],
  [/^check-out is at eleven\.?$/i, 'Le départ se fait à 11 h.'],
  [/^we need your id\.?$/i, 'Nous avons besoin de votre pièce d’identité.'],
  [/^the parking lot is over there\.?$/i, 'Le parking est là-bas.'],
  [/^the restroom is over there\.?$/i, 'Les toilettes sont là-bas.'],
  [/^please wait here\.?$/i, 'Veuillez attendre ici.'],
  [/^follow me,? please\.?$/i, 'Suivez-moi, s’il vous plaît.'],
];

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

function cleanTranslationText(text = '') {
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

function normalizeSuggestions(replies = []) {
  return replies.slice(0, 3).map((reply) => {
    if (typeof reply === 'string') {
      const americanEnglishText = cleanTranslationText(reply);
      return { americanEnglishText, frenchText: replyFrenchTranslations.get(americanEnglishText) || 'Traduction française à confirmer.' };
    }
    const americanEnglishText = cleanTranslationText(reply.americanEnglishText || reply.text || '');
    return {
      americanEnglishText,
      frenchText: reply.frenchText || replyFrenchTranslations.get(americanEnglishText) || 'Traduction française à confirmer.',
    };
  });
}

const listenUnavailableMessage = 'Phrase non disponible hors réseau. Demandez à la personne de répéter ou d’écrire la phrase.';
const recognitionProblemMessage = 'Phrase mal reconnue. Réessayez ou demandez à la personne de parler plus lentement.';
const rescueReplies = [
  'Could you repeat that slowly, please?',
  'Could you write that down, please?',
  'I don’t understand English very well.',
];

function normalizeEnglishKey(text = '') {
  return cleanTranslationText(text)
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasRecognitionProblem(text = '') {
  const key = normalizeEnglishKey(text);
  if (!key) return false;
  return /\bnot sons\b/.test(key) || /\b(?:sons|sun|suns) in my house\b/.test(key);
}
function buildUnavailableEnglishTranslation(base, recognitionProblem = false) {
  const errorMessage = recognitionProblem ? recognitionProblemMessage : listenUnavailableMessage;
  return {
    ...base,
    hasTranslation: false,
    canSpeak: false,
    recognitionProblem,
    error: true,
    errorMessage,
    message: errorMessage,
    frenchText: '',
    frenchMeaning: '',
    literalEnglishText: '',
    americanEnglishText: cleanTranslationText(base.sourceText || ''),
    suggestions: normalizeSuggestions(rescueReplies),
  };
}

const unavailableFallbackMessage = 'Phrase non disponible hors réseau. Essayez une phrase plus simple ou connectez l’IA.';

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

const normalizedFrToEnDictionary = new Map(Array.from(frToEnDictionary, ([key, value]) => [normalizeFrenchKey(key), value]));

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

function cleanSpokenFrenchSource(text = '') {
  return cleanTranslationText(text).replace(/^(?:🇫🇷\s*)?ce que j[’']ai dit\s*:?\s*/i, '').trim();
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

const emptyTranslationState = { hasTranslation: false, canSpeak: false, errorMessage: '', americanEnglishText: '' };
const state = { activeContext: 'restaurant', lastTranslation: '', lastAnswer: '', answerTranslation: { ...emptyTranslationState }, waitingWorker: null, currentMode: 'home', americanVoice: null, autoSpeak: false, activeRecognition: null, offlineCategoryFilter: 'all' };

const $ = (selector) => document.querySelector(selector);
const elements = {
  homeScreen: $('#homeScreen'), listenPanel: $('#listenPanel'), speakPanel: $('#speakPanel'), contextGrid: $('#contextGrid'),
  sourceText: $('#sourceText'), micButton: $('#micButton'), translateButton: $('#translateButton'), status: $('#status'), heardEnglish: $('#heardEnglish'), translationOutput: $('#translationOutput'), listenError: $('#listenError'), copyTranslation: $('#copyTranslation'), restartListen: $('#restartListen'), replyList: $('#replyList'),
  answerText: $('#answerText'), answerFrenchOutput: $('#answerFrenchOutput'), answerMicButton: $('#answerMicButton'), translateAnswerButton: $('#translateAnswerButton'), answerStatus: $('#answerStatus'), answerListenTitle: $('#answerListenTitle'), answerOutput: $('#answerOutput'), answerError: $('#answerError'), speakAnswer: $('#speakAnswer'), copyAnswer: $('#copyAnswer'), restartSpeak: $('#restartSpeak'), updateButton: $('#updateButton'), autoSpeakToggle: $('#autoSpeakToggle'), openOfflineLibrary: $('#openOfflineLibrary'), offlinePanel: $('#offlinePanel'), backFromOffline: $('#backFromOffline'), offlineSearch: $('#offlineSearch'), offlineCategoryList: $('#offlineCategoryList'), offlinePhraseList: $('#offlinePhraseList'),
};

function showMode(mode) {
  state.currentMode = mode;
  elements.homeScreen.classList.toggle('hidden', mode !== 'home');
  elements.listenPanel.classList.toggle('hidden', mode !== 'listen');
  elements.speakPanel.classList.toggle('hidden', mode !== 'speak');
  elements.offlinePanel.classList.toggle('hidden', mode !== 'offline');
  if (mode === 'listen') elements.micButton.focus();
  if (mode === 'speak') elements.answerMicButton.focus();
  if (mode === 'offline') { renderOfflineLibrary(); elements.offlineSearch.focus(); }
}

function detectContext(text = '') {
  return Object.entries(contexts).find(([, context]) => context.words.test(text))?.[0] || state.activeContext;
}

async function requestTranslation(text, direction, context = state.activeContext) {
  return requestTranslationFromService(text, direction, context);
}

async function translateIncoming() {
  const text = elements.sourceText.value.trim();
  if (!text) return focusWithStatus(elements.sourceText, 'Dictez ou écrivez la phrase anglaise entendue.');
  state.activeContext = detectContext(text);
  renderContexts();
  updateStatus('Je traduis…');
  const result = await requestTranslation(text, 'en-fr', state.activeContext);
  const hasTranslation = result.hasTranslation === true && Boolean(result.frenchText);
  state.lastTranslation = hasTranslation ? result.frenchText : '';
  elements.heardEnglish.textContent = `🇺🇸 ${result.americanEnglishText || result.sourceText || text}`;
  elements.translationOutput.classList.toggle('hidden', !hasTranslation);
  elements.listenError.classList.toggle('hidden', hasTranslation);
  elements.copyTranslation.disabled = !hasTranslation;
  if (hasTranslation) {
    elements.translationOutput.textContent = `🇫🇷 ${result.frenchText}`;
    elements.listenError.textContent = '';
  } else {
    elements.translationOutput.textContent = '';
    elements.listenError.textContent = result.errorMessage || listenUnavailableMessage;
  }
  renderReplies(result.suggestions);
  updateStatus(hasTranslation ? (result.simulated ? 'Prêt — mode secours local.' : 'Prêt.') : (result.errorMessage || listenUnavailableMessage));
}

async function translateAnswer() {
  const text = cleanSpokenFrenchSource(elements.answerText.value);
  if (!text) return focusWithStatus(elements.answerText, 'Dictez ou écrivez votre réponse en français.');
  updateStatus('Je traduis…');
  const result = await requestTranslation(text, 'fr-en', state.activeContext);
  const validation = validateAmericanEnglishResult(text, result.americanEnglishText);
  const hasTranslation = result.hasTranslation === true && result.canSpeak === true && validation.canSpeak;
  const cleanAnswer = hasTranslation ? validation.americanEnglishText : '';
  state.lastAnswer = cleanAnswer;
  state.answerTranslation = {
    hasTranslation,
    canSpeak: hasTranslation,
    errorMessage: hasTranslation ? '' : (result.errorMessage || result.message || unavailableFallbackMessage),
    americanEnglishText: cleanAnswer,
  };
  elements.answerFrenchOutput.textContent = text;
  const cannotSpeak = !state.answerTranslation.hasTranslation || !state.answerTranslation.canSpeak;
  elements.answerListenTitle.classList.toggle('hidden', cannotSpeak);
  elements.answerOutput.classList.toggle('hidden', cannotSpeak);
  elements.answerError.classList.toggle('hidden', !cannotSpeak);
  if (cannotSpeak) {
    elements.answerOutput.textContent = '';
    elements.answerError.textContent = state.answerTranslation.errorMessage;
    elements.speakAnswer.disabled = true;
    elements.copyAnswer.disabled = true;
    updateStatus(state.answerTranslation.errorMessage);
    return;
  }
  elements.answerError.textContent = '';
  elements.answerOutput.textContent = `🇺🇸 Anglais américain naturel :
${cleanAnswer}

🇫🇷 Sens :
${result.frenchMeaning || text}`;
  elements.speakAnswer.disabled = false;
  elements.copyAnswer.disabled = false;
  updateStatus(result.simulated ? 'Mode hors réseau — phrase locale' : 'Prêt.');
  if (state.autoSpeak) speak(cleanAnswer, 'en-US');
}

function renderContexts() {
  elements.contextGrid.innerHTML = '';
  Object.entries(contexts).forEach(([key, context]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `context-chip ${key === state.activeContext ? 'active' : ''}`;
    button.textContent = `${context.emoji} ${context.label}`;
    button.addEventListener('click', () => { state.activeContext = key; renderContexts(); renderReplies(context.replies); });
    elements.contextGrid.append(button);
  });
}

function renderReplies(replies) {
  elements.replyList.innerHTML = '';
  normalizeSuggestions(replies).forEach((reply) => {
    const card = document.createElement('article');
    card.className = 'reply-card';
    const phrase = document.createElement('p');
    phrase.innerHTML = `<span class="language-line english-line">🇺🇸 ${reply.americanEnglishText}</span><span class="language-line">🇫🇷 ${reply.frenchText}</span>`;
    const actions = document.createElement('div');
    actions.className = 'mini-actions';
    const listen = document.createElement('button');
    listen.className = 'primary';
    listen.type = 'button';
    listen.textContent = '🔊 Faire écouter';
    listen.addEventListener('click', () => speak(reply.americanEnglishText, 'en-US'));
    const copy = document.createElement('button');
    copy.className = 'secondary';
    copy.type = 'button';
    copy.textContent = 'Copier';
    copy.addEventListener('click', () => copyText(`${reply.americanEnglishText} / ${reply.frenchText}`));
    actions.append(listen, copy);
    card.append(phrase, actions);
    elements.replyList.append(card);
  });
}


function renderOfflineLibrary() {
  elements.offlineCategoryList.innerHTML = '';
  const categories = { all: 'Toutes', ...offlineCategories };
  Object.entries(categories).forEach(([key, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `context-chip ${state.offlineCategoryFilter === key ? 'active' : ''}`;
    button.textContent = label;
    button.addEventListener('click', () => { state.offlineCategoryFilter = key; renderOfflineLibrary(); });
    elements.offlineCategoryList.append(button);
  });

  const query = elements.offlineSearch.value.trim();
  const normalizedQuery = normalizeFrenchKey(query);
  const phrases = offlinePhrases.filter((phrase) => {
    const categoryOk = state.offlineCategoryFilter === 'all' || phrase.category === state.offlineCategoryFilter;
    if (!categoryOk) return false;
    if (!normalizedQuery) return true;
    return [phrase.frenchMeaning, phrase.americanEnglishText, ...(phrase.frenchVariants || []), ...(phrase.keywords || [])].some((value) => normalizeFrenchKey(value).includes(normalizedQuery));
  });

  elements.offlinePhraseList.innerHTML = '';
  phrases.forEach((phrase) => {
    const card = document.createElement('article');
    card.className = 'reply-card offline-phrase-card';
    const content = document.createElement('p');
    content.innerHTML = `<span class="language-line">🇫🇷 ${phrase.frenchMeaning}</span><span class="language-line english-line">🇺🇸 ${phrase.americanEnglishText}</span><span class="offline-badge">${offlineCategories[phrase.category]}</span>`;
    const actions = document.createElement('div');
    actions.className = 'mini-actions';
    const listen = document.createElement('button');
    listen.className = 'primary';
    listen.type = 'button';
    listen.textContent = '🔊 Écouter';
    listen.addEventListener('click', () => speak(phrase.americanEnglishText, 'en-US'));
    const use = document.createElement('button');
    use.className = 'secondary';
    use.type = 'button';
    use.textContent = 'Utiliser';
    use.addEventListener('click', () => { showMode('speak'); elements.answerText.value = phrase.frenchVariants[0]; translateAnswer(); });
    actions.append(listen, use);
    card.append(content, actions);
    elements.offlinePhraseList.append(card);
  });
}

function preloadVoices() {
  if (!('speechSynthesis' in window)) return;
  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    state.americanVoice = voices.find((voice) => voice.lang === 'en-US' && /Samantha|Google US English|Microsoft.*(Jenny|Aria|Guy)/i.test(voice.name))
      || voices.find((voice) => voice.lang === 'en-US')
      || voices.find((voice) => voice.lang?.startsWith('en-'))
      || null;
  };
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

function speak(text, lang) {
  if (!text) return;
  const cleanText = cleanTranslationText(text);
  if (lang !== 'en-US') return updateStatus('Audio désactivé : lecture autorisée uniquement en anglais américain.');
  if (!validateAmericanEnglishResult('', cleanText).canSpeak) return updateStatus('Audio désactivé : aucune vraie phrase anglaise disponible.');
  if (!('speechSynthesis' in window)) return updateStatus('Audio non disponible sur ce navigateur.');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'en-US';
  utterance.voice = state.americanVoice;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function startVoiceInput(target, lang, afterResult) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return updateStatus('Micro non compatible ici. Écrivez la phrase.');
  state.activeRecognition?.abort?.();
  let finalTranscript = '';
  let translated = false;
  const recognition = new SpeechRecognition();
  state.activeRecognition = recognition;
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onstart = () => updateStatus('J’écoute…');
  recognition.onerror = () => updateStatus('Micro impossible. Écrivez la phrase.');
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ').trim();
    target.value = transcript;
    if (event.results[event.results.length - 1].isFinal) finalTranscript = transcript;
  };
  recognition.onend = () => {
    if (state.activeRecognition === recognition) state.activeRecognition = null;
    const text = (finalTranscript || target.value).trim();
    if (!text || translated) return updateStatus('Prêt.');
    translated = true;
    target.value = text;
    afterResult?.();
  };
  recognition.start();
}

async function copyText(text) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  updateStatus('Texte copié.');
}

function restartListen() {
  elements.sourceText.value = '';
  elements.heardEnglish.textContent = '🇺🇸 —';
  elements.translationOutput.classList.remove('hidden');
  elements.listenError.classList.add('hidden');
  elements.listenError.textContent = '';
  elements.translationOutput.textContent = '🇫🇷 La traduction apparaîtra ici.';
  elements.copyTranslation.disabled = true;
  state.lastTranslation = '';
  updateStatus('Prêt.');
  elements.micButton.focus();
}

function restartSpeak() {
  elements.answerText.value = '';
  elements.answerFrenchOutput.textContent = 'La phrase française apparaîtra ici.';
  elements.answerListenTitle.classList.remove('hidden');
  elements.answerOutput.classList.remove('hidden');
  elements.answerError.classList.add('hidden');
  elements.answerError.textContent = '';
  elements.answerOutput.textContent = '🇺🇸 Anglais américain naturel apparaîtra ici.';
  elements.speakAnswer.disabled = true;
  elements.copyAnswer.disabled = true;
  state.lastAnswer = '';
  state.answerTranslation = { ...emptyTranslationState };
  updateStatus('Prêt.');
  elements.answerMicButton.focus();
}

function focusWithStatus(element, message) { updateStatus(message); element.focus(); }
function updateStatus(message) {
  if (elements.status) elements.status.textContent = message;
  if (elements.answerStatus) elements.answerStatus.textContent = message;
}

$('#openListenMode').addEventListener('click', () => showMode('listen'));
$('#openSpeakMode').addEventListener('click', () => showMode('speak'));
elements.openOfflineLibrary.addEventListener('click', () => showMode('offline'));
$('#backFromListen').addEventListener('click', () => showMode('home'));
$('#backFromSpeak').addEventListener('click', () => showMode('home'));
elements.backFromOffline.addEventListener('click', () => showMode('home'));
elements.offlineSearch.addEventListener('input', renderOfflineLibrary);
elements.translateButton.addEventListener('click', translateIncoming);
elements.micButton.addEventListener('click', () => startVoiceInput(elements.sourceText, 'en-US', translateIncoming));
elements.answerMicButton.addEventListener('click', () => startVoiceInput(elements.answerText, 'fr-FR', translateAnswer));
elements.translateAnswerButton.addEventListener('click', translateAnswer);
elements.autoSpeakToggle.addEventListener('click', () => {
  state.autoSpeak = !state.autoSpeak;
  elements.autoSpeakToggle.textContent = `Lecture automatique : ${state.autoSpeak ? 'ON' : 'OFF'}`;
  elements.autoSpeakToggle.setAttribute('aria-pressed', String(state.autoSpeak));
});
elements.speakAnswer.addEventListener('click', () => {
  if (!state.answerTranslation.hasTranslation || !state.answerTranslation.canSpeak) return updateStatus('Audio désactivé : aucune vraie phrase anglaise disponible.');
  speak(state.answerTranslation.americanEnglishText, 'en-US');
});
elements.copyTranslation.addEventListener('click', () => copyText(state.lastTranslation));
elements.copyAnswer.addEventListener('click', () => copyText(state.lastAnswer));
elements.restartListen.addEventListener('click', restartListen);
elements.restartSpeak.addEventListener('click', restartSpeak);
elements.updateButton.addEventListener('click', () => state.waitingWorker?.postMessage({ type: 'SKIP_WAITING' }) || location.reload());

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register('sw.js?v=' + CACHE_VERSION).catch(() => null);
    if (!registration) return;
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          state.waitingWorker = worker;
          elements.updateButton.classList.remove('hidden');
        }
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
  });
}

preloadVoices();
renderContexts();
renderReplies(contexts[state.activeContext].replies);
