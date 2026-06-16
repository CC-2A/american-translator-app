import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanTranslationText, translateLocal } from '../server.js';

const unavailable = 'Phrase non disponible hors réseau. Essayez une phrase plus simple ou connectez l’IA.';
const forbidden = /Traduction IA non connectée|Phrase non disponible en mode secours local|Mode secours local : phrase anglaise détectée|Translation unavailable|AI not connected|erreur technique/i;

test('cleanTranslationText removes parasite prefixes and quotes', () => {
  assert.equal(cleanTranslationText('  "Please help me with this: bonjour comment allez-vous"  '), 'bonjour comment allez-vous');
  assert.equal(cleanTranslationText('Translate this: je voudrais payer l’addition'), 'je voudrais payer l’addition');
  assert.equal(cleanTranslationText('In American English: où sont les toilettes'), 'où sont les toilettes');
});

test('mandatory French to American English offline phrases', () => {
  const cases = new Map([
    ['il me faudrait des serviettes de bain', 'Could I get some bath towels, please?'],
    ['bonjour il me faudrait des serviettes de bain s’il vous plaît', 'Could I get some bath towels, please?'],
    ['j’aurais besoin de serviettes propres', 'Could I get some clean towels, please?'],
    ['il manque du papier toilette', 'We’re out of toilet paper.'],
    ['ma carte de chambre ne fonctionne pas', 'My key card isn’t working.'],
    ['je voudrais payer l’addition', 'Can I get the check, please?'],
    ['où sont les toilettes', 'Where’s the restroom?'],
    ['bonjour j’espère que tout va bien pour vous', 'Hi, I hope you’re doing well.'],
    ['je dois récupérer ma voiture de location', 'I need to pick up my rental car.'],
    ['je suis français je ne parle pas bien anglais', 'I’m French. I don’t speak English very well.'],
  ]);

  for (const [input, expected] of cases) {
    const result = translateLocal(input, 'fr-en', 'hotel');
    assert.equal(result.hasTranslation, true, input);
    assert.equal(result.canSpeak, true, input);
    assert.equal(result.americanEnglishText, expected, input);
    assert.equal(result.source, 'offline', input);
    assert.doesNotMatch(result.americanEnglishText, forbidden, input);
  }
});

test('mandatory English to French offline phrases', () => {
  const cases = new Map([
    ['I don’t want my son in my house', 'Je ne veux pas que mon fils soit chez moi.'],
    ['I don’t want my daughter here', 'Je ne veux pas que ma fille soit ici.'],
    ['I need water', 'J’ai besoin d’eau.'],
    ['Can I get the check?', 'Puis-je avoir l’addition ?'],
    ['Can I see your driver’s license?', 'Puis-je voir votre permis de conduire ?'],
    ['Cash or card?', 'Espèces ou carte ?'],
    ['Do you have a reservation?', 'Avez-vous une réservation ?'],
    ['The restroom is over there', 'Les toilettes sont là-bas.'],
    ['Please wait here', 'Veuillez attendre ici.'],
    ['Follow me, please', 'Suivez-moi, s’il vous plaît.'],
  ]);

  for (const [input, expected] of cases) {
    const result = translateLocal(input, 'en-fr', 'restaurant');
    assert.equal(result.hasTranslation, true, input);
    assert.equal(result.canSpeak, false, input);
    assert.equal(result.frenchText, expected, input);
    assert.doesNotMatch(result.frenchText, forbidden, input);
  }
});

test('unknown phrase never becomes a translation or speakable audio', () => {
  const result = translateLocal('phrase française inconnue sans modèle', 'fr-en', 'hotel');
  assert.equal(result.hasTranslation, false);
  assert.equal(result.canSpeak, false);
  assert.equal(result.americanEnglishText, '');
  assert.equal(result.frenchText, '');
  assert.equal(result.errorMessage, unavailable);
  assert.doesNotMatch(result.errorMessage, forbidden);
});

test('unknown English gets coherent rescue suggestions only', () => {
  const result = translateLocal('This phrase is not in the offline dictionary.', 'en-fr', 'hotel');
  assert.equal(result.hasTranslation, false);
  assert.equal(result.canSpeak, false);
  assert.deepEqual(result.suggestions, [
    { americanEnglishText: 'Could you repeat that slowly, please?', frenchText: 'Pouvez-vous répéter lentement, s’il vous plaît ?' },
    { americanEnglishText: 'Could you write that down, please?', frenchText: 'Pouvez-vous l’écrire, s’il vous plaît ?' },
    { americanEnglishText: 'I don’t understand English very well.', frenchText: 'Je ne comprends pas très bien l’anglais.' },
  ]);
});
