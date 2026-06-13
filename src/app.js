const HISTORY_KEY = 'us-translator-history';
const contexts = {
  restaurant: { label: 'Restaurant', emoji: '🍽️', words: /restaurant|menu|order|coffee|food|drink|table|bill|check|tip|eat|reservation|serveur/i, replies: ['Yes, that is perfect, thank you.', 'Could I have a glass of water, please?', 'Can we have the check, please?'] },
  hotel: { label: 'Hôtel', emoji: '🏨', words: /hotel|room|reservation|check in|check-in|luggage|breakfast|key|front desk/i, replies: ['I have a reservation under my name.', 'Could you help me with my luggage?', 'What time is check-out, please?'] },
  car: { label: 'Voiture', emoji: '🚗', words: /car|rental|parking|gas|fuel|insurance|driver|license|toll|vehicle/i, replies: ['I rented this car today.', 'Where is the nearest gas station?', 'I need help with the rental car.'] },
  store: { label: 'Magasin', emoji: '🛍️', words: /store|shop|price|size|buy|return|receipt|fitting|cashier|discount/i, replies: ['How much is it, please?', 'Do you have this in another size?', 'Can I get a receipt, please?'] },
  border: { label: 'Police / douane', emoji: '🛂', words: /passport|customs|border|police|officer|visa|purpose|stay|declare|id/i, replies: ['I am visiting the United States as a tourist.', 'I am staying at this hotel.', 'Could you repeat slowly, please?'] },
  emergency: { label: 'Urgence', emoji: '🚑', words: /emergency|help|hurt|pain|doctor|hospital|ambulance|allergy|lost|stolen|accident/i, replies: ['I need help right now, please.', 'Please call an ambulance.', 'I do not feel well.'] },
  direction: { label: 'Direction', emoji: '🧭', words: /where|direction|address|street|subway|bus|train|airport|walk|far/i, replies: ['Can you show me on the map?', 'Is it far from here?', 'Which way should I go?'] },
  payment: { label: 'Paiement', emoji: '💳', words: /pay|card|cash|apple pay|google pay|receipt|declined|tip|charge|payment/i, replies: ['Can I pay by card?', 'Could I have the receipt, please?', 'The payment did not work. Can we try again?'] },
};

const state = {
  direction: 'en-fr',
  history: JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'),
  lastTranslation: '',
  lastAnswer: '',
  activeContext: 'restaurant',
};

const elements = {
  conversationPreset: document.querySelector('#conversationPreset'),
  sourceText: document.querySelector('#sourceText'),
  micButton: document.querySelector('#micButton'),
  translateButton: document.querySelector('#translateButton'),
  status: document.querySelector('#status'),
  translationOutput: document.querySelector('#translationOutput'),
  speakTranslation: document.querySelector('#speakTranslation'),
  copyTranslation: document.querySelector('#copyTranslation'),
  answerText: document.querySelector('#answerText'),
  answerMicButton: document.querySelector('#answerMicButton'),
  translateAnswerButton: document.querySelector('#translateAnswerButton'),
  answerOutput: document.querySelector('#answerOutput'),
  speakAnswer: document.querySelector('#speakAnswer'),
  copyAnswer: document.querySelector('#copyAnswer'),
  clearButton: document.querySelector('#clearButton'),
  contextGrid: document.querySelector('#contextGrid'),
  replyList: document.querySelector('#replyList'),
  historyList: document.querySelector('#historyList'),
  clearHistory: document.querySelector('#clearHistory'),
};

const offlinePairs = [
  [/passport|customs|border|visa|purpose/i, 'Il vous demande votre passeport ou des informations de douane.', ['Yes, of course. Here is my passport.', 'I am visiting as a tourist.', 'I am staying for a short vacation.']],
  [/restaurant|menu|order|check|bill|table/i, 'Il parle de votre commande, de la table, du menu ou de l’addition.', contexts.restaurant.replies],
  [/hotel|room|reservation|check in|luggage/i, 'Il parle de votre hôtel, de votre chambre ou de votre réservation.', contexts.hotel.replies],
  [/car|rental|parking|gas|insurance/i, 'Il parle de la voiture, du parking, de l’essence ou de la location.', contexts.car.replies],
  [/emergency|hurt|doctor|hospital|ambulance/i, 'Il s’agit peut-être d’une urgence ou d’un problème médical.', contexts.emergency.replies],
  [/where|direction|subway|bus|airport|address/i, 'Il donne ou demande une direction.', contexts.direction.replies],
  [/pay|card|cash|receipt|declined|payment/i, 'Il parle du paiement, de la carte ou du reçu.', contexts.payment.replies],
  [/price|size|store|shop|return|buy/i, 'Il parle d’un achat en magasin.', contexts.store.replies],
];

const frToEnDictionary = [
  [/passeport/i, 'Yes, of course. Here is my passport.'],
  [/touriste|vacances/i, 'I am visiting the United States as a tourist.'],
  [/addition|payer/i, 'Can I pay by card, please?'],
  [/urgence|aide/i, 'I need help right now, please.'],
  [/médecin|hôpital|mal/i, 'I need a doctor, please.'],
  [/chemin|adresse|où/i, 'Can you show me on the map, please?'],
  [/hôtel|réservation/i, 'I have a reservation under my name.'],
];

function detectContext(text = '') {
  return Object.entries(contexts).find(([, context]) => context.words.test(text))?.[0] || state.activeContext;
}

async function requestTranslation(text, direction, context = state.activeContext) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, direction, context }),
    });
    if (response.ok) return { ...(await response.json()), simulated: false };
  } catch (error) {
    console.info('API indisponible, utilisation du secours local.', error);
  }
  return offlineTranslate(text, direction, context);
}

function offlineTranslate(text, direction, context) {
  if (direction === 'en-fr') {
    const match = offlinePairs.find(([pattern]) => pattern.test(text));
    return { translation: match?.[1] || `Traduction locale approximative : ${text}`, replies: match?.[2] || contexts[context].replies, simulated: true };
  }
  const match = frToEnDictionary.find(([pattern]) => pattern.test(text));
  return { translation: match?.[1] || `In American English: ${text}`, replies: contexts[context].replies, simulated: true };
}

async function translateIncoming() {
  const text = elements.sourceText.value.trim();
  if (!text) return focusWithStatus(elements.sourceText, 'Dictez ou écrivez la phrase anglaise entendue.');
  state.activeContext = detectContext(text);
  renderContexts();
  updateStatus('Traduction en cours…');
  const result = await requestTranslation(text, 'en-fr', state.activeContext);
  state.lastTranslation = result.translation;
  elements.translationOutput.textContent = result.translation;
  elements.speakTranslation.disabled = false;
  elements.copyTranslation.disabled = false;
  renderReplies(result.replies);
  addToHistory(text, result.translation, 'en-fr');
  updateStatus(result.simulated ? 'Secours local utilisé : connectez /api/translate pour une vraie IA.' : 'Traduction IA prête.');
}

async function translateAnswer() {
  const text = elements.answerText.value.trim();
  if (!text) return focusWithStatus(elements.answerText, 'Écrivez ou dictez votre réponse en français.');
  updateStatus('Traduction de votre réponse…');
  const result = await requestTranslation(text, 'fr-en', state.activeContext);
  state.lastAnswer = result.translation;
  elements.answerOutput.textContent = result.translation;
  elements.speakAnswer.disabled = false;
  elements.copyAnswer.disabled = false;
  addToHistory(text, result.translation, 'fr-en');
  updateStatus(result.simulated ? 'Réponse prête avec le secours local.' : 'Réponse IA prête.');
}

function renderContexts() {
  elements.contextGrid.innerHTML = '';
  Object.entries(contexts).forEach(([key, context]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `context-chip ${key === state.activeContext ? 'active' : ''}`;
    button.textContent = `${context.emoji} ${context.label}`;
    button.addEventListener('click', () => {
      state.activeContext = key;
      renderContexts();
      renderReplies(context.replies);
    });
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
    const use = document.createElement('button');
    use.className = 'ghost';
    use.type = 'button';
    use.textContent = 'Utiliser';
    use.addEventListener('click', () => {
      elements.answerText.value = reply;
      state.lastAnswer = reply;
      elements.answerOutput.textContent = reply;
      elements.speakAnswer.disabled = false;
      elements.copyAnswer.disabled = false;
    });
    const listen = document.createElement('button');
    listen.className = 'audio';
    listen.type = 'button';
    listen.textContent = '🔊';
    listen.setAttribute('aria-label', `Écouter : ${reply}`);
    listen.addEventListener('click', () => speak(reply, 'en-US'));
    actions.append(use, listen);
    card.append(phrase, actions);
    elements.replyList.append(card);
  });
}

function addToHistory(source, translation, direction) {
  state.history = [{ source, translation, direction }, ...state.history].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  elements.historyList.innerHTML = '';
  state.history.forEach((entry) => {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${escapeHtml(entry.translation)}</strong><span>${escapeHtml(entry.source)}</span>`;
    elements.historyList.append(item);
  });
}

function speak(text, lang) {
  if (!('speechSynthesis' in window)) return updateStatus('La lecture audio n’est pas disponible sur ce navigateur.');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function startVoiceInput(target, lang) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return updateStatus('Micro non compatible ici. Utilisez la zone de texte.');
  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.onstart = () => updateStatus('J’écoute… parlez maintenant.');
  recognition.onerror = () => updateStatus('Impossible d’utiliser le micro. Vous pouvez écrire la phrase.');
  recognition.onresult = (event) => {
    target.value = event.results[0][0].transcript;
    updateStatus('Phrase captée. Appuyez sur Traduire.');
  };
  recognition.start();
}

async function copyText(text) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  updateStatus('Texte copié.');
}

function clearConversation() {
  elements.sourceText.value = '';
  elements.answerText.value = '';
  elements.translationOutput.textContent = 'La traduction apparaîtra ici en grand.';
  elements.answerOutput.textContent = 'Votre réponse traduite apparaîtra ici.';
  state.lastTranslation = '';
  state.lastAnswer = '';
  elements.speakTranslation.disabled = true;
  elements.copyTranslation.disabled = true;
  elements.speakAnswer.disabled = true;
  elements.copyAnswer.disabled = true;
  updateStatus('Conversation effacée.');
}

function focusWithStatus(element, message) {
  updateStatus(message);
  element.focus();
}

function updateStatus(message) { elements.status.textContent = message; }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }

elements.translateButton.addEventListener('click', translateIncoming);
elements.micButton.addEventListener('click', () => startVoiceInput(elements.sourceText, 'en-US'));
elements.answerMicButton.addEventListener('click', () => startVoiceInput(elements.answerText, 'fr-FR'));
elements.translateAnswerButton.addEventListener('click', translateAnswer);
elements.speakTranslation.addEventListener('click', () => speak(state.lastTranslation, 'fr-FR'));
elements.speakAnswer.addEventListener('click', () => speak(state.lastAnswer, 'en-US'));
elements.copyTranslation.addEventListener('click', () => copyText(state.lastTranslation));
elements.copyAnswer.addEventListener('click', () => copyText(state.lastAnswer));
elements.clearButton.addEventListener('click', clearConversation);
elements.clearHistory.addEventListener('click', () => {
  state.history = [];
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});
elements.conversationPreset.addEventListener('click', () => focusWithStatus(elements.sourceText, 'Mode conversation : écoutez une phrase anglaise, puis traduisez-la.'));

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

renderContexts();
renderReplies(contexts[state.activeContext].replies);
renderHistory();
