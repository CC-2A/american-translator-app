const CACHE_VERSION = '2026.06.13-natural-american-english';

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
  ['Yes, here it is.', 'Oui, le voici.'],
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

const state = { activeContext: 'restaurant', lastTranslation: '', lastAnswer: '', waitingWorker: null, currentMode: 'home' };

const $ = (selector) => document.querySelector(selector);
const elements = {
  homeScreen: $('#homeScreen'), listenPanel: $('#listenPanel'), speakPanel: $('#speakPanel'), contextGrid: $('#contextGrid'),
  sourceText: $('#sourceText'), micButton: $('#micButton'), translateButton: $('#translateButton'), status: $('#status'), heardEnglish: $('#heardEnglish'), translationOutput: $('#translationOutput'), copyTranslation: $('#copyTranslation'), restartListen: $('#restartListen'), replyList: $('#replyList'),
  answerText: $('#answerText'), answerFrenchOutput: $('#answerFrenchOutput'), answerMicButton: $('#answerMicButton'), translateAnswerButton: $('#translateAnswerButton'), answerStatus: $('#answerStatus'), answerOutput: $('#answerOutput'), speakAnswer: $('#speakAnswer'), copyAnswer: $('#copyAnswer'), restartSpeak: $('#restartSpeak'), updateButton: $('#updateButton'),
};

function showMode(mode) {
  state.currentMode = mode;
  elements.homeScreen.classList.toggle('hidden', mode !== 'home');
  elements.listenPanel.classList.toggle('hidden', mode !== 'listen');
  elements.speakPanel.classList.toggle('hidden', mode !== 'speak');
  if (mode === 'listen') elements.sourceText.focus();
  if (mode === 'speak') elements.answerText.focus();
}

function detectContext(text = '') {
  return Object.entries(contexts).find(([, context]) => context.words.test(text))?.[0] || state.activeContext;
}

async function requestTranslation(text, direction, context = state.activeContext) {
  const languages = direction === 'fr-en' ? { source: 'fr-FR', target: 'en-US' } : { source: 'en-US', target: 'fr-FR' };
  try {
    const response = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, direction, context, ...languages }) });
    if (response.ok) {
      const payload = await response.json();
      return { ...payload, simulated: payload.mode === 'local' };
    }
  } catch (error) {
    console.info('API indisponible, utilisation du secours local.', error);
  }
  return offlineTranslate(text, direction, context);
}

function offlineTranslate(text, direction, context) {
  const sourceLanguage = direction === 'fr-en' ? 'fr-FR' : 'en-US';
  const targetLanguage = direction === 'fr-en' ? 'en-US' : 'fr-FR';
  const fallbackSuggestions = normalizeSuggestions(contexts[context]?.replies || contexts.restaurant.replies);

  if (direction === 'en-fr') {
    const match = enToFrDictionary.find(([pattern]) => pattern.test(text));
    return {
      sourceText: text,
      sourceLanguage,
      targetLanguage,
      frenchText: match?.[1] || 'Mode secours local : phrase anglaise détectée, traduction approximative.',
      americanEnglishText: text,
      literalEnglishText: text,
      frenchMeaning: match?.[1] || 'Sens approximatif détecté localement.',
      context,
      suggestions: fallbackSuggestions,
      mode: 'local',
      simulated: true,
    };
  }

  const match = frToEnDictionary.find(([pattern]) => pattern.test(text));
  return {
    sourceText: text,
    sourceLanguage,
    targetLanguage,
    frenchText: text,
    americanEnglishText: cleanTranslationText(match?.[1] || text),
    literalEnglishText: match?.[2] || text,
    frenchMeaning: text,
    context,
    suggestions: fallbackSuggestions,
    mode: 'local',
    simulated: true,
  };
}

async function translateIncoming() {
  const text = elements.sourceText.value.trim();
  if (!text) return focusWithStatus(elements.sourceText, 'Dictez ou écrivez la phrase anglaise entendue.');
  state.activeContext = detectContext(text);
  renderContexts();
  updateStatus('Traduction en cours…');
  const result = await requestTranslation(text, 'en-fr', state.activeContext);
  state.lastTranslation = result.frenchText;
  elements.heardEnglish.textContent = `🇺🇸 ${result.americanEnglishText}`;
  elements.translationOutput.textContent = `🇫🇷 ${result.frenchText}`;
  elements.copyTranslation.disabled = false;
  renderReplies(result.suggestions);
  updateStatus(result.simulated ? 'Mode secours local : traduction limitée, sans IA.' : 'Traduction IA prête.');
}

async function translateAnswer() {
  const text = cleanTranslationText(elements.answerText.value);
  if (!text) return focusWithStatus(elements.answerText, 'Dictez ou écrivez votre réponse en français.');
  updateStatus('Traduction en cours…');
  const result = await requestTranslation(text, 'fr-en', state.activeContext);
  const cleanAnswer = cleanTranslationText(result.americanEnglishText);
  state.lastAnswer = cleanAnswer;
  elements.answerFrenchOutput.textContent = `🇫🇷 Ce que j’ai dit : ${result.frenchText}`;
  elements.answerOutput.textContent = `🇺🇸 Anglais américain naturel :\n${cleanAnswer}`;
  elements.speakAnswer.disabled = false;
  elements.copyAnswer.disabled = false;
  updateStatus(result.simulated ? 'Mode secours local : anglais américain généré sans IA. Appuyez sur FAIRE ÉCOUTER.' : 'Anglais américain prêt. Appuyez sur FAIRE ÉCOUTER.');
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

function speak(text, lang) {
  if (!text) return;
  if (!('speechSynthesis' in window)) return updateStatus('Audio non disponible sur ce navigateur.');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanTranslationText(text));
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function startVoiceInput(target, lang, afterResult) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return updateStatus('Micro non compatible ici. Écrivez la phrase.');
  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.onstart = () => updateStatus('J’écoute…');
  recognition.onerror = () => updateStatus('Micro impossible. Écrivez la phrase.');
  recognition.onresult = (event) => { target.value = event.results[0][0].transcript; afterResult?.(); };
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
  elements.translationOutput.textContent = '🇫🇷 La traduction apparaîtra ici.';
  elements.copyTranslation.disabled = true;
  state.lastTranslation = '';
  updateStatus('Prêt.');
  elements.sourceText.focus();
}

function restartSpeak() {
  elements.answerText.value = '';
  elements.answerFrenchOutput.textContent = '🇫🇷 La phrase française apparaîtra ici.';
  elements.answerOutput.textContent = '🇺🇸 Anglais américain naturel apparaîtra ici.';
  elements.speakAnswer.disabled = true;
  elements.copyAnswer.disabled = true;
  state.lastAnswer = '';
  updateStatus('Prêt.');
  elements.answerText.focus();
}

function focusWithStatus(element, message) { updateStatus(message); element.focus(); }
function updateStatus(message) {
  if (elements.status) elements.status.textContent = message;
  if (elements.answerStatus) elements.answerStatus.textContent = message;
}

$('#openListenMode').addEventListener('click', () => showMode('listen'));
$('#openSpeakMode').addEventListener('click', () => showMode('speak'));
$('#backFromListen').addEventListener('click', () => showMode('home'));
$('#backFromSpeak').addEventListener('click', () => showMode('home'));
elements.translateButton.addEventListener('click', translateIncoming);
elements.micButton.addEventListener('click', () => startVoiceInput(elements.sourceText, 'en-US', translateIncoming));
elements.answerMicButton.addEventListener('click', () => startVoiceInput(elements.answerText, 'fr-FR', translateAnswer));
elements.translateAnswerButton.addEventListener('click', translateAnswer);
elements.speakAnswer.addEventListener('click', () => speak(state.lastAnswer, 'en-US'));
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

renderContexts();
renderReplies(contexts[state.activeContext].replies);
