const CACHE_VERSION = '2026.06.13-terrain';

const contexts = {
  restaurant: { label: 'Restaurant', emoji: '🍽️', words: /restaurant|menu|order|coffee|food|drink|table|bill|check|tip|eat|reservation|server|waiter/i, replies: ['Could you repeat slowly, please?', 'I would like this one, please.', 'Can we have the check, please?'] },
  hotel: { label: 'Hôtel', emoji: '🏨', words: /hotel|room|reservation|check in|check-in|luggage|breakfast|key|front desk/i, replies: ['I have a reservation.', 'Could you help me, please?', 'What time is check-out?'] },
  car: { label: 'Voiture', emoji: '🚗', words: /car|rental|parking|gas|fuel|insurance|driver|license|toll|vehicle/i, replies: ['I rented this car.', 'I need help with the car.', 'Where can I park?'] },
  store: { label: 'Magasin', emoji: '🛍️', words: /store|shop|price|size|buy|return|receipt|cashier|discount/i, replies: ['How much is it?', 'Do you have another size?', 'Can I get a receipt?'] },
  border: { label: 'Police / Douane', emoji: '🛂', words: /passport|customs|border|police|officer|visa|purpose|stay|declare|id/i, replies: ['Yes, of course.', 'I am a tourist.', 'Could you repeat slowly, please?'] },
  emergency: { label: 'Urgence', emoji: '🚑', words: /emergency|help|hurt|pain|doctor|hospital|ambulance|allergy|lost|stolen|accident/i, replies: ['I need help now, please.', 'Please call an ambulance.', 'I do not feel well.'] },
  direction: { label: 'Direction', emoji: '🧭', words: /where|direction|address|street|subway|bus|train|airport|walk|far/i, replies: ['Can you show me on the map?', 'Is it far from here?', 'Which way should I go?'] },
  payment: { label: 'Paiement', emoji: '💳', words: /pay|card|cash|apple pay|google pay|receipt|declined|tip|charge|payment/i, replies: ['Can I pay by card?', 'Could I have the receipt?', 'Can we try again?'] },
};

const offlinePairs = [
  [/passport|customs|border|visa|purpose/i, 'Il demande votre passeport ou des informations de douane.', contexts.border.replies],
  [/restaurant|menu|order|check|bill|table/i, 'Il parle du menu, de votre commande ou de l’addition.', contexts.restaurant.replies],
  [/hotel|room|reservation|check in|luggage/i, 'Il parle de votre hôtel, de votre chambre ou de votre réservation.', contexts.hotel.replies],
  [/car|rental|parking|gas|insurance/i, 'Il parle de la voiture, du parking, de l’essence ou de la location.', contexts.car.replies],
  [/emergency|hurt|doctor|hospital|ambulance/i, 'Il s’agit peut-être d’une urgence ou d’un problème médical.', contexts.emergency.replies],
  [/where|direction|subway|bus|airport|address/i, 'Il donne ou demande une direction.', contexts.direction.replies],
  [/pay|card|cash|receipt|declined|payment/i, 'Il parle du paiement, de la carte ou du reçu.', contexts.payment.replies],
  [/price|size|store|shop|return|buy/i, 'Il parle d’un achat en magasin.', contexts.store.replies],
];

const frToEnDictionary = [
  [/passeport/i, 'Yes, of course. Here is my passport.'],
  [/touriste|vacances/i, 'I am visiting as a tourist.'],
  [/addition|payer|carte/i, 'Can I pay by card, please?'],
  [/urgence|aide/i, 'I need help now, please.'],
  [/médecin|hôpital|mal/i, 'I need a doctor, please.'],
  [/chemin|adresse|où/i, 'Can you show me on the map, please?'],
  [/hôtel|réservation/i, 'I have a reservation.'],
  [/répéter|lentement/i, 'Could you repeat slowly, please?'],
];

const state = { activeContext: 'restaurant', lastTranslation: '', lastAnswer: '', waitingWorker: null };

const $ = (selector) => document.querySelector(selector);
const elements = {
  homeScreen: $('#homeScreen'), listenPanel: $('#listenPanel'), speakPanel: $('#speakPanel'), contextGrid: $('#contextGrid'),
  sourceText: $('#sourceText'), micButton: $('#micButton'), translateButton: $('#translateButton'), status: $('#status'), heardEnglish: $('#heardEnglish'), translationOutput: $('#translationOutput'), copyTranslation: $('#copyTranslation'), restartListen: $('#restartListen'), replyList: $('#replyList'),
  answerText: $('#answerText'), answerMicButton: $('#answerMicButton'), translateAnswerButton: $('#translateAnswerButton'), answerOutput: $('#answerOutput'), speakAnswer: $('#speakAnswer'), copyAnswer: $('#copyAnswer'), restartSpeak: $('#restartSpeak'), updateButton: $('#updateButton'),
};

function showMode(mode) {
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
  try {
    const response = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, direction, context }) });
    if (response.ok) return { ...(await response.json()), simulated: false };
  } catch (error) {
    console.info('API indisponible, utilisation du secours local.', error);
  }
  return offlineTranslate(text, direction, context);
}

function offlineTranslate(text, direction, context) {
  if (direction === 'en-fr') {
    const match = offlinePairs.find(([pattern]) => pattern.test(text));
    return { translation: match?.[1] || `Mode secours local : phrase anglaise détectée, traduction approximative.`, replies: match?.[2] || contexts[context].replies, simulated: true };
  }
  const match = frToEnDictionary.find(([pattern]) => pattern.test(text));
  return { translation: match?.[1] || `Please help me with this: ${text}`, replies: contexts[context].replies, simulated: true };
}

async function translateIncoming() {
  const text = elements.sourceText.value.trim();
  if (!text) return focusWithStatus(elements.sourceText, 'Dictez ou écrivez la phrase anglaise entendue.');
  state.activeContext = detectContext(text);
  renderContexts();
  updateStatus('Traduction en cours…');
  const result = await requestTranslation(text, 'en-fr', state.activeContext);
  state.lastTranslation = result.translation;
  elements.heardEnglish.textContent = text;
  elements.translationOutput.textContent = result.translation;
  elements.copyTranslation.disabled = false;
  renderReplies(result.replies);
  updateStatus(result.simulated ? 'Mode secours local : traduction limitée, sans IA.' : 'Traduction IA prête.');
}

async function translateAnswer() {
  const text = elements.answerText.value.trim();
  if (!text) return focusWithStatus(elements.answerText, 'Dictez ou écrivez votre réponse en français.');
  updateStatus('Traduction en cours…');
  const result = await requestTranslation(text, 'fr-en', state.activeContext);
  state.lastAnswer = result.translation;
  elements.answerOutput.textContent = result.translation;
  elements.speakAnswer.disabled = false;
  elements.copyAnswer.disabled = false;
  updateStatus(result.simulated ? 'Mode secours local : phrase simple générée sans IA.' : 'Réponse IA prête.');
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
  replies.slice(0, 3).forEach((reply) => {
    const card = document.createElement('article');
    card.className = 'reply-card';
    const phrase = document.createElement('p');
    phrase.textContent = reply;
    const actions = document.createElement('div');
    actions.className = 'mini-actions';
    const listen = document.createElement('button');
    listen.className = 'primary';
    listen.type = 'button';
    listen.textContent = '🔊 Audio';
    listen.addEventListener('click', () => speak(reply, 'en-US'));
    const copy = document.createElement('button');
    copy.className = 'secondary';
    copy.type = 'button';
    copy.textContent = 'Copier';
    copy.addEventListener('click', () => copyText(reply));
    actions.append(listen, copy);
    card.append(phrase, actions);
    elements.replyList.append(card);
  });
}

function speak(text, lang) {
  if (!text) return;
  if (!('speechSynthesis' in window)) return updateStatus('Audio non disponible sur ce navigateur.');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
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
  elements.heardEnglish.textContent = '—';
  elements.translationOutput.textContent = 'La traduction apparaîtra ici.';
  elements.copyTranslation.disabled = true;
  state.lastTranslation = '';
  updateStatus('Prêt.');
  elements.sourceText.focus();
}

function restartSpeak() {
  elements.answerText.value = '';
  elements.answerOutput.textContent = 'La phrase anglaise apparaîtra ici.';
  elements.speakAnswer.disabled = true;
  elements.copyAnswer.disabled = true;
  state.lastAnswer = '';
  updateStatus('Prêt.');
  elements.answerText.focus();
}

function focusWithStatus(element, message) { updateStatus(message); element.focus(); }
function updateStatus(message) { elements.status.textContent = message; }

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
