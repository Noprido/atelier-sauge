# Site de massage à domicile — Node.js / Express / EJS

Site vitrine monopage avec formulaire de demande de réservation, e-mails automatiques et espace administrateur protégé par mot de passe. Les demandes sont stockées dans `data/reservations.json`.

> Ce code a été généré sans avoir été exécuté. Lancez-le, testez le parcours complet (demande → e-mail → admin) et signalez tout bug.

## Installation

```bash
npm install
cp .env.example .env
```

Puis dans `.env` :

1. **SESSION_SECRET** : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
2. **ADMIN_PASSWORD_HASH** : `npm run hash-password "votre mot de passe de 12 caractères ou plus"` puis collez la ligne affichée (avec ses guillemets simples).
3. **SMTP_*, MAIL_FROM, ADMIN_NOTIFY_EMAIL** : sans SMTP, la demande est enregistrée mais aucun e-mail n’est envoyé (un avertissement apparaît dans la console).
4. **SITE_URL** : l’URL publique du site (sans slash final).

```bash
npm run dev     # développement (rechargement automatique, Node 18.11+)
npm start       # production
```

Site : http://localhost:3000 — administration : http://localhost:3000/admin

## Contenu à personnaliser

Tout le contenu métier est dans **`config/site.js`** : nom, prestations, durées, prix, horaires, délai minimal, contacts (WhatsApp, Telegram, réseaux), textes « à propos », FAQ, textes légaux. Les valeurs actuelles sont des exemples et les passages entre `[crochets]` sont à compléter. Passez `legal.draftNotice` à `false` une fois les pages légales relues.

Images : aucune n’est fournie. Ajoutez-les dans `public/images/` et référencez-les dans les vues (n’oubliez pas l’attribut `alt`). Pour l’aperçu sur les réseaux, renseignez `business.ogImage`.

## Structure

```
app.js                 serveur, sécurité (helmet/CSP), sessions admin, gestion d’erreurs
config/site.js         contenu et règles de réservation
controllers/           reservation + admin
routes/                public, reservation, admin
middleware/            require-admin, csrf
services/              email.service.js (Nodemailer)
utils/                 validation, dates (fuseau Europe/Paris), format, reservations-store (JSON)
views/                 layouts, partials, pages, admin
public/                css, js, images
scripts/               hash-password.js
data/                  reservations.json (créé au premier démarrage, hors dépôt git)
```

## Sécurité mise en place

- Mot de passe admin haché (bcrypt), limitation des tentatives (8 / 15 min), session régénérée à la connexion, cookie `HttpOnly` + `SameSite=Lax` + `Secure` en production, expiration à 8 h.
- Jeton CSRF sur toutes les actions admin (connexion, déconnexion, changement de statut).
- Formulaire public : validation serveur stricte, champ piège (honeypot), délai minimal de remplissage, vérification de l’origine, limitation à 6 envois / 30 min / IP.
- `helmet` avec Content-Security-Policy stricte (aucun script en ligne), en-têtes `noindex` et `no-store` sur `/admin`.
- Sorties échappées par EJS (`<%= %>`) et dans les e-mails HTML.
- Aucun cookie pour les visiteurs : la session n’existe que sous `/admin`.

## Mise en production

- **HTTPS obligatoire.** Derrière un reverse proxy (Nginx, Caddy, plateforme PaaS), définissez `TRUST_PROXY=1`, sinon le cookie `Secure` ne sera pas émis et l’IP vue sera celle du proxy.
- `NODE_ENV=production` rend `SESSION_SECRET` obligatoire et active HSTS.
- Pour tester le mode production en local sans HTTPS : `COOKIE_SECURE=false`.
- **Persistance du JSON :** `data/reservations.json` doit se trouver sur un disque persistant. Sur une plateforme au système de fichiers éphémère (Heroku, Render gratuit, etc.), les demandes seraient perdues à chaque redéploiement : montez un volume et pointez `DATA_DIR` dessus. **Sauvegardez ce fichier régulièrement** et définissez avec le client une durée de conservation (RGPD).
- Les sessions admin sont en mémoire : un redémarrage vous déconnecte. L’application est prévue pour une seule instance. Au-delà, ou pour un volume de demandes important, passez à une base de données.
- Pensez à relire les pages légales avec le client, et à vérifier la délivrabilité des e-mails (SPF, DKIM, DMARC du domaine expéditeur).

## Choix techniques à connaître

- `bcryptjs` (pur JavaScript) est utilisé à la place de `bcrypt` pour éviter toute compilation native à l’installation.
- La protection CSRF est faite maison (jeton de session comparé en temps constant) car `csurf` est abandonné.
- Polices : Young Serif et Hanken Grotesk via Google Fonts, avec repli sur Georgia et les polices système. Pour les héberger vous-même, téléchargez-les dans `public/` et retirez les domaines Google de la CSP dans `app.js`.
