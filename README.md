# US Translator

US Translator est une application web **mobile-first** pour un voyageur francophone aux États-Unis. Elle sert à comprendre une phrase en anglais américain, préparer une réponse courte et polie en français, la traduire en anglais américain, puis la faire écouter.

## Fonctionnalités principales

- Mode **conversation** optimisé voyage :
  1. une personne parle anglais ;
  2. l’application affiche le sens en français ;
  3. vous choisissez une réponse courte ou dictez votre réponse en français ;
  4. l’application traduit en anglais américain ;
  5. vous pouvez faire écouter la réponse.
- Interface mobile premium : gros boutons, cartes séparées, texte très lisible, actions simples.
- Boutons **Copier** et **Effacer** pour aller vite en situation réelle.
- Réponses possibles naturelles, courtes et polies pour les contextes : restaurant, hôtel, voiture, magasin, police/douane, urgence, direction et paiement.
- Saisie au clavier ou avec le bouton **micro** via la Web Speech API du navigateur.
- Lecture audio via la synthèse vocale du navigateur.
- Historique local des 8 dernières traductions.
- PWA installable sur téléphone grâce à `manifest.json`, `icon.svg` et `sw.js`.
- Aucune clé API côté navigateur.

## GitHub Pages

L’application statique fonctionne sur GitHub Pages : `index.html`, `src/app.js`, `src/styles.css`, `manifest.json`, `icon.svg` et `sw.js` utilisent des chemins relatifs compatibles avec un déploiement dans un sous-dossier GitHub Pages.

Important : GitHub Pages ne peut pas exécuter `server.js` ni fournir `/api/translate`. Sur GitHub Pages, l’application tente quand même d’appeler `/api/translate`, puis bascule automatiquement vers le moteur local de secours si l’API n’existe pas.

## Installation locale

Prérequis : Node.js 18 ou plus.

```bash
npm install
npm start
```

Ouvrez ensuite `http://localhost:4173` dans un navigateur.

## Utilisation

1. Demandez à votre interlocuteur de parler anglais ou collez la phrase entendue.
2. Appuyez sur **Traduire** pour lire le sens en français.
3. Choisissez une réponse rapide ou dictez votre réponse en français.
4. Appuyez sur **Traduire ma réponse**.
5. Utilisez **Faire écouter** ou **Copier**.
6. Appuyez sur **Effacer** pour repartir sur une nouvelle conversation.

## PWA : ajout à l’écran d’accueil

- Android / Chrome : ouvrez le site, puis menu du navigateur → **Ajouter à l’écran d’accueil** ou **Installer l’application**.
- iPhone / Safari : ouvrez le site, bouton **Partager** → **Sur l’écran d’accueil**.

Le service worker met en cache l’interface de base. La traduction IA, quand elle sera connectée, nécessitera une connexion réseau.

## Architecture sécurisée pour une vraie IA

La traduction locale intégrée dans `src/app.js` est volontairement limitée et doit rester un **secours uniquement**. La cible de production est une API serveur sécurisée.

Règles de sécurité :

- Le navigateur appelle uniquement `POST /api/translate`.
- Ne jamais mettre de clé API dans `index.html`, `src/app.js`, `manifest.json` ou tout autre fichier public.
- La clé doit rester dans une variable d’environnement serveur, par exemple `TRANSLATION_API_KEY`.
- Ajoutez aussi le modèle ou fournisseur via variable d’environnement si nécessaire, par exemple `TRANSLATION_MODEL`.
- Le fichier `server.js` contient le point d’entrée à remplacer par l’appel réel au fournisseur IA.

Format attendu de la requête :

```http
POST /api/translate
Content-Type: application/json

{
  "text": "Can I see your passport, please?",
  "direction": "en-fr",
  "context": "border"
}
```

Format recommandé de la réponse :

```json
{
  "translation": "Puis-je voir votre passeport, s’il vous plaît ?",
  "replies": [
    "Yes, of course. Here is my passport.",
    "I am visiting as a tourist.",
    "Could you repeat slowly, please?"
  ]
}
```

Si le serveur renvoie une erreur ou n’est pas disponible, l’application utilise automatiquement son secours local.

## Scripts

```bash
npm start
npm run check
```

- `npm start` lance le serveur local.
- `npm run check` vérifie la syntaxe JavaScript du serveur et de l’application.
