import { ERROR_MESSAGE, cleanTranslationText, translateEnglishToFrench, translateFrenchToEnglish } from './offlineMatcher.js';

export { ERROR_MESSAGE, cleanTranslationText };

export function translateOffline(text, direction) {
  if (direction === 'fr-en' || direction === 'fr-to-en') return translateFrenchToEnglish(text);
  if (direction === 'en-fr' || direction === 'en-to-fr') return translateEnglishToFrench(text);
  return { hasTranslation: false, canSpeak: false, sourceText: cleanTranslationText(text), frenchText: '', americanEnglishText: '', frenchMeaning: '', direction: '', source: 'offline', confidence: 0, errorMessage: ERROR_MESSAGE, suggestions: [] };
}

export async function requestTranslation(text, direction, context = 'restaurant') {
  try {
    const response = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, direction, context }) });
    if (response.ok) return response.json();
  } catch (error) {
    console.info('API indisponible, utilisation du moteur local.', error);
  }
  return translateOffline(text, direction);
}
