import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanTranslationText, translateLocal } from '../server.js';

const forbiddenPrefix = /^(please help me with this|help me with this|translate this|say this|the translation is|here is the translation|in american english|assistant|ai|instruction|response|answer|output)\b/i;

test('cleanTranslationText removes parasite prefixes and quotes', () => {
  assert.equal(cleanTranslationText('  "Please help me with this: bonjour comment allez-vous"  '), 'bonjour comment allez-vous');
  assert.equal(cleanTranslationText('Translate this: je voudrais payer l’addition'), 'je voudrais payer l’addition');
  assert.equal(cleanTranslationText('In American English: où sont les toilettes'), 'où sont les toilettes');
});

test('French-to-American-English local translations stay clean', () => {
  const cases = [
    ['bonjour comment allez-vous', 'Hi, how are you doing?'],
    ['Please help me with this: bonjour comment allez-vous', 'Hi, how are you doing?'],
    ['Translate this: je voudrais payer l’addition', 'Can I get the check, please?'],
    ['In American English: où sont les toilettes', 'Where’s the restroom?'],
  ];

  for (const [input, expected] of cases) {
    const result = translateLocal(cleanTranslationText(input), 'fr-en', 'restaurant');
    assert.equal(result.americanEnglishText, expected);
    assert.doesNotMatch(result.americanEnglishText, forbiddenPrefix);
  }
});

test('suggested replies never include technical parasite prefixes', () => {
  const result = translateLocal('bonjour comment allez-vous', 'fr-en', 'restaurant');
  for (const suggestion of result.suggestions) {
    assert.doesNotMatch(suggestion.americanEnglishText, forbiddenPrefix);
  }
});
