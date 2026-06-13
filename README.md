# US Translator

US Translator est une application web **mobile-first** pensée pour un voyageur francophone aux États-Unis. Elle aide à comprendre une phrase en anglais américain, traduire une phrase française, écouter la traduction et choisir rapidement une réponse possible.

## Fonctionnalités

- Traduction **français → anglais américain** et **anglais américain → français**.
- Saisie au clavier ou avec le bouton **micro** via la Web Speech API du navigateur.
- Affichage de la traduction en grand texte lisible.
- Bouton **Faire écouter** avec synthèse vocale du navigateur.
- 2 ou 3 réponses possibles générées selon le contexte détecté : restaurant, hôtel, magasin, transport ou situation générique.
- Audio pour chaque réponse proposée.
- Historique local des 5 dernières traductions.
- Interface en français, gros boutons, design responsive pour smartphone.
- Aucune clé API côté navigateur.

## Installation

Prérequis : Node.js 18 ou plus.

```bash
npm install
npm start
```

Ouvrez ensuite `http://localhost:4173` dans un navigateur.

## Utilisation

1. Choisissez le sens de traduction.
2. Écrivez une phrase ou appuyez sur **Parler**.
3. Appuyez sur **Traduire**.
4. Lisez ou faites écouter la traduction.
5. Utilisez une des réponses possibles si elle correspond à la situation.

## Version actuelle

Cette première version est fonctionnelle sans service externe. Le fichier `src/app.js` contient un moteur local volontairement simple qui simule la traduction pour des contextes fréquents et prépare l’écran final de l’application.

Quand l’API serveur n’est pas configurée, le navigateur tente `POST /api/translate`, reçoit une réponse `501`, puis bascule automatiquement vers le moteur local. Cela permet de tester l’interface complète sans exposer de clé API.

## Architecture sécurisée prévue pour une API IA/traduction

- Le navigateur appelle uniquement `POST /api/translate`.
- La clé API doit rester dans une variable d’environnement serveur, par exemple `TRANSLATION_API_KEY`.
- Le fichier `server.js` contient le point d’extension où connecter un fournisseur IA ou traduction.
- Ne jamais appeler un fournisseur IA directement depuis `src/app.js`, car le code navigateur est visible par tout le monde.

## Scripts

```bash
npm start
npm run check
```

- `npm start` lance le serveur local.
- `npm run check` vérifie la syntaxe JavaScript du serveur et de l’application.
