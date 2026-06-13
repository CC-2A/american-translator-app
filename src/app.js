const state = {
  direction: 'fr-en',
  history: JSON.parse(localStorage.getItem('us-translator-history') || '[]'),
  lastTranslation: '',
};

const elements = {
  frToEn: document.querySelector('#frToEn'),
  enToFr: document.querySelector('#enToFr'),
  sourceLabel: document.querySelector('#sourceLabel'),
  sourceText: document.querySelector('#sourceText'),
  micButton: document.querySelector('#micButton'),
  translateButton: document.querySelector('#translateButton'),
  status: document.querySelector('#status'),
  translationOutput: document.querySelector('#translationOutput'),
  speakTranslation: document.querySelector('#speakTranslation'),
  replyList: document.querySelector('#replyList'),
  historyList: document.querySelector('#historyList'),
  clearHistory: document.querySelector('#clearHistory'),
};

const offlineTranslations = [
  { fr: /commander|café|restaurant|menu|addition/i, en: 'I would like to order a coffee, please.', replies: ['Yes, that is all, thank you.', 'Could I see the menu, please?', 'Can I pay by card?'] },
  { fr: /hôtel|chambre|réservation|valise/i, en: 'Hello, I have a reservation under my name.', replies: ['Could I check in now?', 'What time is breakfast?', 'Can you call a taxi for me?'] },
  { fr: /prix|coûte|vendeur|magasin|acheter/i, en: 'How much does this cost?', replies: ['Do you have a smaller size?', 'I will take it, thank you.', 'Can I pay with my phone?'] },
  { fr: /chemin|où|adresse|métro|bus|aller/i, en: 'Excuse me, how do I get there?', replies: ['Is it far from here?', 'Can you show me on the map?', 'Thank you for your help.'] },
  { en: /order|coffee|restaurant|menu|check/i, fr: 'Je voudrais commander un café, s’il vous plaît.', replies: ['Oui, ce sera tout, merci.', 'Puis-je voir le menu, s’il vous plaît ?', 'Puis-je payer par carte ?'] },
  { en: /hotel|room|reservation|luggage/i, fr: 'Bonjour, j’ai une réservation à mon nom.', replies: ['Puis-je m’enregistrer maintenant ?', 'À quelle heure est le petit-déjeuner ?', 'Pouvez-vous appeler un taxi pour moi ?'] },
  { en: /price|cost|store|buy|size/i, fr: 'Combien cela coûte-t-il ?', replies: ['Avez-vous une taille plus petite ?', 'Je vais le prendre, merci.', 'Puis-je payer avec mon téléphone ?'] },
  { en: /where|address|subway|bus|get there/i, fr: 'Excusez-moi, comment puis-je y aller ?', replies: ['Est-ce loin d’ici ?', 'Pouvez-vous me montrer sur la carte ?', 'Merci pour votre aide.'] },
];

const defaults = {
  'fr-en': {
    output: (text) => `In American English: ${text}`,
    replies: ['Could you repeat that, please?', 'I understand, thank you.', 'Could you speak more slowly?'],
  },
  'en-fr': {
    output: (text) => `En français : ${text}`,
    replies: ['Pouvez-vous répéter, s’il vous plaît ?', 'Je comprends, merci.', 'Pouvez-vous parler plus lentement ?'],
  },
};

function setDirection(direction) {
  state.direction = direction;
  elements.frToEn.classList.toggle('active', direction === 'fr-en');
  elements.enToFr.classList.toggle('active', direction === 'en-fr');
  elements.sourceLabel.textContent = direction === 'fr-en' ? 'Votre phrase en français' : 'Phrase entendue en anglais américain';
  elements.sourceText.placeholder = direction === 'fr-en'
    ? 'Ex. Je voudrais commander un café, s\'il vous plaît.'
    : 'Ex. Could you tell me where the subway is?';
}

function findOfflineResult(text) {
  const key = state.direction === 'fr-en' ? 'fr' : 'en';
  const resultKey = state.direction === 'fr-en' ? 'en' : 'fr';
  const match = offlineTranslations.find((item) => item[key]?.test(text));
  if (!match) {
    return {
      translation: defaults[state.direction].output(text),
      replies: defaults[state.direction].replies,
      simulated: true,
    };
  }
  return { translation: match[resultKey], replies: match.replies, simulated: false };
}

async function translateText() {
  const text = elements.sourceText.value.trim();
  if (!text) {
    updateStatus('Écrivez ou dictez une phrase pour commencer.');
    elements.sourceText.focus();
    return;
  }

  updateStatus('Traduction en cours…');
  const result = await getTranslation(text);
  state.lastTranslation = result.translation;
  elements.translationOutput.textContent = result.translation;
  elements.speakTranslation.disabled = false;
  renderReplies(result.replies);
  addToHistory(text, result.translation);
  updateStatus(result.simulated ? 'Version locale : traduction simulée prête.' : 'Traduction prête.');
}

async function getTranslation(text) {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, direction: state.direction }),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.info('API indisponible, utilisation du moteur local.', error);
  }
  return findOfflineResult(text);
}

function renderReplies(replies) {
  elements.replyList.innerHTML = '';
  replies.slice(0, 3).forEach((reply) => {
    const card = document.createElement('article');
    card.className = 'reply-card';
    const textBlock = document.createElement('div');
    const phrase = document.createElement('p');
    phrase.textContent = reply;
    const hint = document.createElement('small');
    hint.textContent = 'Réponse suggérée selon le contexte';
    textBlock.append(phrase, hint);
    const button = document.createElement('button');
    button.className = 'audio';
    button.type = 'button';
    button.textContent = '🔊';
    button.setAttribute('aria-label', `Écouter : ${reply}`);
    button.addEventListener('click', () => speak(reply));
    card.append(textBlock, button);
    elements.replyList.append(card);
  });
}

function addToHistory(source, translation) {
  state.history = [{ source, translation, direction: state.direction }, ...state.history].slice(0, 5);
  localStorage.setItem('us-translator-history', JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  elements.historyList.innerHTML = '';
  state.history.forEach((entry) => {
    const item = document.createElement('li');
    const translation = document.createElement('strong');
    translation.textContent = entry.translation;
    const source = document.createElement('span');
    source.textContent = entry.source;
    item.append(translation, source);
    elements.historyList.append(item);
  });
}

function speak(text) {
  if (!('speechSynthesis' in window)) {
    updateStatus('La lecture audio n’est pas disponible sur ce navigateur.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.direction === 'fr-en' ? 'en-US' : 'fr-FR';
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
}

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    updateStatus('Micro non compatible ici. Utilisez la zone de texte.');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = state.direction === 'fr-en' ? 'fr-FR' : 'en-US';
  recognition.interimResults = false;
  recognition.onstart = () => updateStatus('J’écoute… parlez maintenant.');
  recognition.onerror = () => updateStatus('Impossible d’utiliser le micro. Vous pouvez écrire la phrase.');
  recognition.onresult = (event) => {
    elements.sourceText.value = event.results[0][0].transcript;
    updateStatus('Phrase captée. Appuyez sur Traduire.');
  };
  recognition.start();
}

function updateStatus(message) {
  elements.status.textContent = message;
}

elements.frToEn.addEventListener('click', () => setDirection('fr-en'));
elements.enToFr.addEventListener('click', () => setDirection('en-fr'));
elements.translateButton.addEventListener('click', translateText);
elements.micButton.addEventListener('click', startVoiceInput);
elements.speakTranslation.addEventListener('click', () => speak(state.lastTranslation));
elements.clearHistory.addEventListener('click', () => {
  state.history = [];
  localStorage.removeItem('us-translator-history');
  renderHistory();
});

setDirection(state.direction);
renderHistory();
