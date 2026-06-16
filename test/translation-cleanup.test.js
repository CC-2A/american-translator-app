import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanTranslationText, translateLocal } from '../server.js';

const forbiddenPrefix = /^(please help me with this|help me with this|translate this|say this|the translation is|here is the translation|in american english|assistant|ai|instruction|response|answer|output)\b/i;
const unavailable = 'Traduction IA non connectée. Cette phrase n’est pas disponible en mode secours local.';

test('cleanTranslationText removes parasite prefixes and quotes', () => {
  assert.equal(cleanTranslationText('  "Please help me with this: bonjour comment allez-vous"  '), 'bonjour comment allez-vous');
  assert.equal(cleanTranslationText('Translate this: je voudrais payer l’addition'), 'je voudrais payer l’addition');
  assert.equal(cleanTranslationText('In American English: où sont les toilettes'), 'où sont les toilettes');
});

test('French-to-American-English local translations stay clean and speakable only when known', () => {
  const cases = [
    ['bonjour comment allez-vous', 'Hi, how are you doing?'],
    ['bonjour j’espère que tout va bien pour vous', 'Hi, I hope you’re doing well.'],
    ['j’espère que tout va bien pour vous', 'I hope you’re doing well.'],
    ['bonjour j’espère que vous allez bien', 'Hi, I hope you’re doing well.'],
    ['Please help me with this: bonjour comment allez-vous', 'Hi, how are you doing?'],
    ['Translate this: je voudrais payer l’addition s’il vous plaît', 'Can I get the check, please?'],
    ['In American English: où sont les toilettes', 'Where’s the restroom?'],
  ];

  for (const [input, expected] of cases) {
    const result = translateLocal(cleanTranslationText(input), 'fr-en', 'restaurant');
    assert.equal(result.error, undefined);
    assert.equal(result.hasTranslation, true);
    assert.equal(result.canSpeak, true);
    assert.equal(result.americanEnglishText, expected);
    assert.doesNotMatch(result.americanEnglishText, forbiddenPrefix);
    assert.notEqual(result.americanEnglishText.toLowerCase(), cleanTranslationText(input).toLowerCase());
  }
});

test('unknown French phrase returns controlled unavailable fallback with audio disabled', () => {
  const result = translateLocal('phrase française inconnue', 'fr-en', 'restaurant');
  assert.equal(result.error, true);
  assert.equal(result.message, unavailable);
  assert.equal(result.errorMessage, unavailable);
  assert.equal(result.hasTranslation, false);
  assert.equal(result.americanEnglishText, '');
  assert.equal(result.frenchText, 'phrase française inconnue');
  assert.equal(result.canSpeak, false);
});


test('unavailable messages are never valid American English for speech', () => {
  const blockedMessages = [
    'Traduction IA non connectée',
    'Phrase non disponible en mode secours',
    'Mode secours local',
    'Erreur',
    'API non disponible',
    'Translation unavailable',
    'AI not connected',
  ];

  for (const message of blockedMessages) {
    const result = translateLocal(message, 'fr-en', 'restaurant');
    assert.equal(result.error, true, message);
    assert.equal(result.americanEnglishText, '', message);
    assert.equal(result.hasTranslation, false, message);
    assert.equal(result.canSpeak, false, message);
  }
});

test('minimum local French dictionary covers required traveler phrases', () => {
  const cases = new Map([
    ['bonjour', 'Hi.'],
    ['bonsoir', 'Good evening.'],
    ['merci', 'Thank you.'],
    ['merci beaucoup', 'Thank you very much.'],
    ['au revoir', 'Goodbye.'],
    ['je ne comprends pas', 'I don’t understand.'],
    ['pouvez-vous répéter lentement s’il vous plaît', 'Could you repeat that slowly, please?'],
    ['je suis français, je ne parle pas bien anglais', 'I’m French. I don’t speak English very well.'],
    ['je voudrais payer l’addition s’il vous plaît', 'Can I get the check, please?'],
    ['où sont les toilettes', 'Where’s the restroom?'],
    ['je voudrais de l’eau s’il vous plaît', 'Can I get some water, please?'],
    ['je voudrais payer par carte', 'Can I pay by card?'],
    ['pouvez-vous m’aider', 'Can you help me, please?'],
    ['je cherche la sortie', 'I’m looking for the exit.'],
    ['où est le parking', 'Where’s the parking lot?'],
    ['je dois récupérer ma voiture de location', 'I need to pick up my rental car.'],
    ['j’ai une réservation', 'I have a reservation.'],
    ['je voudrais une chambre', 'I’d like a room.'],
    ['j’ai besoin d’aide', 'I need help.'],
    ['appelez une ambulance', 'Please call an ambulance.'],
    ['bonjour j’espère que tout va bien pour vous', 'Hi, I hope you’re doing well.'],
    ['bonjour j’espère que vous allez bien', 'Hi, I hope you’re doing well.'],
    ['bonjour comment allez-vous', 'Hi, how are you doing?'],
    ['bonsoir comment allez-vous', 'Good evening, how are you doing?'],
    ['comment allez-vous', 'How are you doing?'],
    ['j’espère que vous allez bien', 'I hope you’re doing well.'],
    ['j’espère que tout va bien', 'I hope everything is going well.'],
    ['je vous remercie', 'Thank you.'],
    ['merci pour votre aide', 'Thank you for your help.'],
  ]);

  for (const [input, expected] of cases) {
    const result = translateLocal(input, 'fr-en', 'restaurant');
    assert.equal(result.canSpeak, true, input);
    assert.equal(result.americanEnglishText, expected, input);
  }
});

test('offline mode builds essential hotel and restaurant requests from smart templates', () => {
  const cases = [
    ['il me faudrait des serviettes de bain', 'hotel', 'Could I get some bath towels, please?'],
    ['j’aurais besoin de serviettes propres', 'hotel', 'Could I get some clean towels, please?'],
    ['il manque du papier toilette', 'hotel', 'We’re out of toilet paper.'],
    ['ma carte de chambre ne fonctionne pas', 'hotel', 'My key card isn’t working.'],
    ['il me faudrait des serviettes', 'restaurant', 'Could I get some napkins, please?'],
    ['je voudrais payer l’addition', 'restaurant', 'Can I get the check, please?'],
    ['bonjour il me faudrait des serviettes de bain s’il vous plaît', 'hotel', 'Hi, could I get some bath towels, please?'],
  ];

  for (const [input, context, expected] of cases) {
    const result = translateLocal(input, 'fr-en', context);
    assert.equal(result.hasTranslation, true, input);
    assert.equal(result.canSpeak, true, input);
    assert.equal(result.americanEnglishText, expected, input);
    assert.doesNotMatch(result.americanEnglishText, /Traduction IA non connectée|mode secours/i, input);
  }
});

test('offline errors remain non-speakable and never leak into listenable output', () => {
  const result = translateLocal('phrase française inconnue sans modèle', 'fr-en', 'hotel');
  assert.equal(result.hasTranslation, false);
  assert.equal(result.canSpeak, false);
  assert.equal(result.americanEnglishText, '');
  assert.equal(result.error, true);
});


test('local normalization handles punctuation, accents, whitespace, and greeting prefixes', () => {
  const cases = [
    ['  Bonjour,   j espere que tout va bien pour vous !!! ', 'Hi, I hope you’re doing well.'],
    ['BONJOUR, COMMENT ALLEZ VOUS ?', 'Hi, how are you doing?'],
    ['Salut j’espère que vous allez bien', 'Hi, I hope you’re doing well.'],
    ['Bonsoir, comment allez vous ?', 'Good evening, how are you doing?'],
  ];

  for (const [input, expected] of cases) {
    const result = translateLocal(input, 'fr-en', 'restaurant');
    assert.equal(result.hasTranslation, true, input);
    assert.equal(result.canSpeak, true, input);
    assert.equal(result.americanEnglishText, expected, input);
  }
});

test('suggested replies never include technical parasite prefixes', () => {
  const result = translateLocal('bonjour comment allez-vous', 'fr-en', 'restaurant');
  for (const suggestion of result.suggestions) {
    assert.doesNotMatch(suggestion.americanEnglishText, forbiddenPrefix);
  }
});

test('English listen mode translates only exact offline dictionary phrases', () => {
  const cases = new Map([
    ['Can I see your driver’s license?', 'Puis-je voir votre permis de conduire ?'],
    ['Cash or card?', 'Espèces ou carte ?'],
    ['Do you have a reservation?', 'Avez-vous une réservation ?'],
  ]);

  for (const [input, expected] of cases) {
    const result = translateLocal(input, 'en-fr', 'restaurant');
    assert.equal(result.hasTranslation, true, input);
    assert.equal(result.frenchText, expected, input);
    assert.equal(result.errorMessage, '', input);
    assert.doesNotMatch(result.frenchText, /Mode secours local|Phrase non disponible|Phrase mal reconnue/i, input);
  }
});

test('English listen mode blocks incoherent or unavailable phrases from main translation', () => {
  const badRecognition = translateLocal('I would like not sons in my house', 'en-fr', 'hotel');
  assert.equal(badRecognition.hasTranslation, false);
  assert.equal(badRecognition.recognitionProblem, true);
  assert.equal(badRecognition.frenchText, '');
  assert.match(badRecognition.errorMessage, /Phrase mal reconnue|Phrase non disponible hors réseau/);

  const unknown = translateLocal('This phrase is not in the offline dictionary.', 'en-fr', 'hotel');
  assert.equal(unknown.hasTranslation, false);
  assert.equal(unknown.recognitionProblem, false);
  assert.equal(unknown.frenchText, '');
  assert.equal(unknown.errorMessage, 'Phrase non disponible hors réseau. Demandez à la personne de répéter ou d’écrire la phrase.');

  for (const result of [badRecognition, unknown]) {
    assert.equal(result.canSpeak, false);
    assert.doesNotMatch(result.frenchText, /Mode secours local|Phrase non disponible|Phrase mal reconnue/i);
    assert.deepEqual(result.suggestions.map((suggestion) => suggestion.americanEnglishText), [
      'Could you repeat that slowly, please?',
      'Could you write that down, please?',
      'I don’t understand English very well.',
    ]);
  }
});
