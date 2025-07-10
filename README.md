# 📧 Service de Notification par Email

Service Node.js/Express pour l'envoi d'emails de notification de tournois avec l'API Brevo (ex-Sendinblue).

## 🚀 Installation

1. **Installer les dépendances :**
```bash
npm install
```

2. **Configurer les variables d'environnement :**
```bash
cp env.example .env
```

3. **Modifier le fichier `.env` avec votre clé API Brevo :**
```env
# Configuration Brevo (ex-Sendinblue)
BREVO_API_KEY=xkeysib-your-api-key-here

# Configuration du serveur
PORT=3000
NODE_ENV=development

# Configuration de l'email par défaut
DEFAULT_FROM_EMAIL=noreply@example.com
DEFAULT_FROM_NAME=Service Tournoi
```

**Comment obtenir votre clé API Brevo :**
1. Créez un compte sur [Brevo](https://www.brevo.com/)
2. Allez dans **Settings** > **API Keys**
3. Créez une nouvelle clé API v3
4. Copiez la clé (commence par `xkeysib-`)

4. **Démarrer le serveur :**
```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

## ⚡ Fonctionnalités

- **📧 Emails de tournois** : Notifications personnalisées avec détails complets
- **👤 Enregistrement d'utilisateurs** : Inscription avec email de bienvenue automatique
- **📊 Envoi en lot** : Jusqu'à 100 emails par requête (tournois) ou 50 utilisateurs
- **✅ Gestion des erreurs** : Rapport détaillé des succès/échecs
- **🔧 Validation robuste** : Validation des données avec Zod (emails, téléphones, niveaux)
- **🌐 API Brevo** : Service d'email professionnel et fiable
- **📱 Templates adaptatifs** : Contenu HTML et texte pour tous les clients
- **🛡️ Sécurité** : Validation stricte, protection CORS, headers sécurisés

## 📋 API Endpoints

### 🏆 Gestion des Tournois

#### 1. Envoyer des notifications (POST /api/email/send)

**URL :** `POST http://localhost:3000/api/email/send`

**Body (JSON) :**
```json
{
  "to": [
    "joueur1@example.com",
    "joueur2@example.com"
  ],
  "tournament": {
    "name": "Tournoi de Tennis 2024",
    "start_date": "2024-03-15T10:00:00.000Z",
    "start_time": "10:00",
    "match_duration_minutes": 90,
    "courts_available": 4
  },
  "customMessage": "N'oubliez pas d'apporter vos raquettes !"
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "message": "Envoi d'emails terminé",
  "data": {
    "tournament": "Tournoi de Tennis 2024",
    "results": {
      "total": 2,
      "success": [
        {
          "email": "joueur1@example.com",
          "messageId": "<message-id>"
        }
      ],
      "failed": [
        {
          "email": "joueur2@example.com",
          "error": "Invalid email address"
        }
      ],
      "summary": {
        "successCount": 1,
        "failedCount": 1
      }
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 👤 Endpoints Utilisateurs (Simplifiés)

#### 1. Enregistrer un utilisateur
Enregistre un utilisateur avec **juste son email** et lui envoie un email de bienvenue.

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau.joueur@example.com"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Utilisateur enregistré avec succès",
  "data": {
    "user": {
      "email": "nouveau.joueur@example.com",
      "registrationDate": "2024-12-10T14:30:00.000Z"
    },
    "email": {
      "sent": true,
      "messageId": "<brevo-message-id>",
      "recipient": "nouveau.joueur@example.com"
    },
    "timestamp": "2024-12-10T14:30:00.000Z"
  }
}
```

#### 2. Enregistrer plusieurs utilisateurs
Enregistre plusieurs utilisateurs avec leurs emails (max 100).

```bash
curl -X POST http://localhost:3000/api/users/register-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "joueur1@example.com",
      "joueur2@example.com",
      "joueur3@example.com"
    ]
  }'
```

#### 3. Renvoyer un email de bienvenue
Renvoie un email de bienvenue à une adresse existante.

```bash
curl -X POST http://localhost:3000/api/users/resend-welcome \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joueur.existant@example.com"
  }'
```

### 🔧 Administration

#### 2. Tester la connexion Brevo (GET /api/email/test)

**URL :** `GET http://localhost:3000/api/email/test`

**Réponse :**
```json
{
  "success": true,
  "message": "Connexion Brevo opérationnelle",
  "data": {
    "account": {
      "email": "your-account@example.com",
      "plan": "free",
      "credits": 300
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 3. Informations sur le service (GET /api/email/info)

**URL :** `GET http://localhost:3000/api/email/info`

#### 4. Informations du compte Brevo (GET /api/email/account)

**URL :** `GET http://localhost:3000/api/email/account`

**Réponse :**
```json
{
  "success": true,
  "message": "Informations du compte récupérées",
  "data": {
    "account": {
      "email": "your-account@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "companyName": "My Company",
      "plan": "free",
      "credits": 300
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 5. Santé du service (GET /health)

**URL :** `GET http://localhost:3000/health`

## 🔧 Validation des Données

### Champs obligatoires pour le tournoi :
- `name` : string (3-200 caractères)
- `start_date` : date ISO
- `start_time` : string au format HH:MM
- `match_duration_minutes` : nombre entier (10-300)
- `courts_available` : nombre entier (1-50)

### Champs obligatoires pour l'email :
- `to` : tableau d'emails (1-100 adresses maximum)

### Champs optionnels :
- `customMessage` : string (max 500 caractères)

### Champs pour l'enregistrement d'utilisateur :
**Obligatoires :**
- `firstName` : string (2-50 caractères)
- `lastName` : string (2-50 caractères)  
- `email` : string (format email valide)

**Optionnels :**
- `phone` : string (format français : 0123456789 ou +33123456789)
- `dateOfBirth` : string (format ISO 8601)
- `sport` : string (2-30 caractères)
- `level` : enum (débutant, intermédiaire, avancé, expert)
- `newsletter` : boolean (défaut: false)

## 🛡️ Sécurité

- Limitation à 100 emails par requête
- Validation stricte des données avec Zod
- Headers de sécurité avec Helmet
- Gestion des erreurs détaillée

## 🔍 Logs et Monitoring

Le service affiche des logs détaillés dans la console :
- ✅ Succès des opérations
- ❌ Erreurs rencontrées
- 📧 Progression des envois
- 📊 Résumés des opérations

## 🧪 Test avec cURL

### Tests des emails de tournoi
```bash
# Test de connexion
curl -X GET http://localhost:3000/api/email/test

# Envoi d'email de tournoi
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["test@example.com"],
    "tournament": {
      "name": "Test Tournament",
      "start_date": "2024-03-15T10:00:00.000Z",
      "start_time": "10:00",
      "match_duration_minutes": 90,
      "courts_available": 2
    }
  }'
```

### Tests d'enregistrement d'utilisateur
```bash
# Enregistrement d'un utilisateur
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau.joueur@example.com"
  }'

# Consulter les niveaux sportifs
curl -X GET http://localhost:3000/api/user/sport-levels

# Renvoyer un email de bienvenue
curl -X POST http://localhost:3000/api/users/resend-welcome \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joueur.existant@example.com"
  }'
```

## 🛠️ Développement

```bash
# Lancer le serveur en mode dev
npm run dev

# Vérifier le code avec ESLint
npm run lint

# Corriger automatiquement le code
npm run lint:fix

# Formater le code avec Prettier
npm run format
```

## 📁 Structure du Projet

```
src/
├── app.js              # Point d'entrée principal
├── controllers/        # Contrôleurs (logique métier)
├── services/          # Services (email, etc.)
├── models/            # Modèles et validation
└── routes/            # Définition des routes
```

## ⚠️ Notes Importantes

1. **Configuration Brevo :** Assurez-vous que votre clé API Brevo est correcte
2. **Limites :** Maximum 100 emails par requête (selon votre plan Brevo)
3. **Sécurité :** Ne commitez jamais votre fichier `.env`
4. **Erreurs :** Consultez les logs pour diagnostiquer les problèmes

## 🆘 Résolution de Problèmes

### Erreur de connexion Brevo
- Vérifiez votre clé API dans le fichier `.env`
- Testez avec `/api/email/test`
- Vérifiez que votre compte Brevo est actif
- Consultez vos crédits avec `/api/email/account`

### Erreurs de validation
- Respectez les formats requis (emails, dates, etc.)
- Limitez-vous à 100 emails maximum

### Emails non reçus
- Vérifiez les logs du serveur
- Contrôlez les dossiers spam
- Vérifiez que l'adresse expéditrice est autorisée 