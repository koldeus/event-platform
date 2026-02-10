# Plateforme d'Événements Collaboratifs

Plateforme collaborative de gestion d'événements permettant de consulter, ajouter, voter et s'inscrire aux événements.

## Installation

### Prérequis

- Node.js (v14+)
- npm

### Étapes

1. Accédez au dossier du projet
```bash
cd event-platform
```

2. Installez les dépendances du serveur
```bash
cd server
npm install
```

3. Démarrez le serveur
```bash
npm start
```

Le serveur démarre sur http://localhost:3000

4. Ouvrez votre navigateur et accédez à http://localhost:3000


## Utilisation

Mode production:
```bash
cd server
npm start
```

Mode développement:
```bash
cd server
npm run dev
```

## Comptes de test

Email: alice@example.com
Mot de passe: password123

Email: bob@example.com
Mot de passe: password123


## Dépannage

Port 3000 déjà utilisé:
```bash
Windows: netstat -ano | findstr :3000
        taskkill /PID [PID] /F

Mac/Linux: lsof -i :3000
          kill -9 [PID]
```

Module not found:
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```
