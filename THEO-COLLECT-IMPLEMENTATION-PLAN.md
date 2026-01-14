# THEO COLLECT - Plan d'Implementation

> Document de specifications pour la personnalisation du frontend ODK Central
> Date de creation: 2026-01-13
> Design System: THEO v1.0.4

---

## 1. Resume du Projet

**Objectif**: Personnaliser le frontend ODK Central clone pour creer une application nommee "THEO COLLECT" avec le design system THEO, deployee sur un serveur separe et communiquant avec le backend ODK Central existant a `www.job-tracker.fr`.

### Architecture Cible

```
+-------------------------+           +---------------------------+
|     THEO COLLECT        |   REST    |      ODK Central          |
|     (Votre Serveur)     |  ======>  |   www.job-tracker.fr      |
|   Frontend Personnalise |    API    |   Backend + Base Donnees  |
+-------------------------+           +---------------------------+
```

---

## 2. Design System THEO - Tokens a Appliquer

### 2.1 Palette de Couleurs

| Token THEO      | Valeur Hex | Utilisation ODK Central              |
|-----------------|------------|--------------------------------------|
| `geo-bg`        | `#F2F0E9`  | Background de page                   |
| `geo-card`      | `#F9F8F4`  | Surfaces, panneaux, modales          |
| `geo-dark`      | `#1A1A1A`  | Texte principal                      |
| `geo-gray`      | `#7A7A7A`  | Texte secondaire                     |
| `geo-orange`    | `#C88045`  | Accent secondaire, alertes           |
| `geo-green`     | `#2D4F42`  | Couleur primaire (boutons, liens)    |
| `geo-olive`     | `#6B705C`  | Elements neutres                     |
| `geo-border`    | `#E5E2D9`  | Bordures subtiles                    |

### 2.2 Typographie

| Style          | Classes/Proprietes                                              |
|----------------|----------------------------------------------------------------|
| Font Principale| `Space Grotesk, sans-serif`                                    |
| Font Mono      | `ui-monospace, SFMono-Regular, monospace`                      |

### 2.3 Branding

| Element           | Valeur              |
|-------------------|---------------------|
| Nom Application   | THEO COLLECT        |
| Titre Page        | THEO COLLECT        |
| Favicon           | A creer (vert THEO) |

---

## 3. Fichiers a Modifier

### 3.1 `src/assets/scss/_variables.scss`

**Modifications de couleurs:**

```scss
// === AVANT ===
$color-accent-primary: #bd006b;
$color-accent-secondary: #8d0050;
$color-page-background: #f7f7f7;
$color-text: #333;
$color-text-secondary: #9499A5;
$color-action-foreground: #0c7bd1;
$color-action-background: #009ecc;
$color-action-background-hover: #0086ad;

// === APRES (THEO Design System) ===
$color-accent-primary: #2D4F42;        // geo-green
$color-accent-secondary: #1E362D;      // geo-green darker
$color-page-background: #F2F0E9;       // geo-bg
$color-text: #1A1A1A;                  // geo-dark
$color-text-secondary: #7A7A7A;        // geo-gray
$color-action-foreground: #2D4F42;     // geo-green
$color-action-background: #2D4F42;     // geo-green
$color-action-background-hover: #1E362D; // geo-green darker

// Nouvelles variables THEO
$color-geo-orange: #C88045;
$color-geo-card: #F9F8F4;
$color-geo-border: #E5E2D9;
$color-geo-olive: #6B705C;
```

**Variables contextuelles a ajuster:**

```scss
// Success - garder vert mais harmoniser
$color-success: #2D4F42;
$color-success-light: #E8EFEC;
$color-success-dark: #1E362D;

// Warning - utiliser geo-orange
$color-warning: #C88045;
$color-warning-light: #F5E6D8;
$color-warning-dark: #A66B38;

// Info - adapter au theme
$color-info: #6B705C;
$color-info-light: #ECEEE9;

// Panels et surfaces
$color-subpanel-background: #F9F8F4;
$color-subpanel-border: #E5E2D9;
$color-table-heading-background: #F2F0E9;
```

### 3.2 `src/assets/scss/app.scss`

**Ajouter l'import Google Fonts au debut:**

```scss
// Import Space Grotesk font
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

// Appliquer la font globalement
html, body {
  font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 3.3 `index.html`

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>THEO COLLECT</title>
    <meta name="description" content="THEO COLLECT - Plateforme de collecte de donnees agricoles">
    <link rel="icon" href="/favicon.ico">
    <!-- Preload font for better performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  </head>
  <body>
    <noscript>
      <p>Veuillez activer JavaScript pour continuer.</p>
      <p>Propulse par THEO COLLECT.</p>
    </noscript>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

### 3.4 `vite.config.js` - Configuration Proxy API

Creer ou modifier pour ajouter le proxy vers votre serveur:

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/v1': {
        target: 'https://www.job-tracker.fr',
        changeOrigin: true,
        secure: true,
      },
      '/client-config.json': {
        target: 'https://www.job-tracker.fr',
        changeOrigin: true,
        secure: true,
      }
    }
  }
});
```

### 3.5 Configuration Production (nginx ou autre)

Pour le deploiement en production, vous devrez configurer un proxy sur votre serveur.

**Exemple nginx:**

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    root /var/www/theo-collect/dist;
    index index.html;

    # Proxy vers ODK Central API
    location /v1/ {
        proxy_pass https://www.job-tracker.fr/v1/;
        proxy_set_header Host www.job-tracker.fr;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_ssl_server_name on;
    }

    location /client-config.json {
        proxy_pass https://www.job-tracker.fr/client-config.json;
        proxy_set_header Host www.job-tracker.fr;
        proxy_ssl_server_name on;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4. Etapes d'Implementation

### Phase 1: Personnalisation Design (Priorite Haute) - COMPLETE

- [x] **1.1** Modifier `_variables.scss` avec les couleurs THEO
- [x] **1.2** Ajouter import Google Fonts dans `app.scss`
- [x] **1.3** Mettre a jour `index.html` (titre, meta, lang)
- [ ] **1.4** Creer un favicon THEO (optionnel)

### Phase 2: Configuration API (Priorite Haute) - COMPLETE

- [x] **2.1** Verifier/creer `vite.config.js` avec proxy
- [ ] **2.2** Tester la connexion API en developpement
- [ ] **2.3** Verifier l'authentification fonctionne

### Phase 3: Build et Test (Priorite Moyenne) - COMPLETE

- [x] **3.1** Executer `npm install` pour les dependances
- [ ] **3.2** Executer `npm run dev` et tester localement
- [x] **3.3** Executer `npm run build` pour la production
- [x] **3.4** Verifier le contenu du dossier `dist/`

### Phase 4: Deploiement (Priorite Moyenne)

- [ ] **4.1** Configurer le serveur web (nginx/apache) - Config nginx fournie dans `nginx/theo-collect.conf`
- [ ] **4.2** Deployer les fichiers `dist/`
- [ ] **4.3** Configurer le proxy API
- [ ] **4.4** Tester en production
- [ ] **4.5** Configurer HTTPS (recommande)

---

## 5. Commandes Utiles

```bash
# Installation des dependances
npm install

# Developpement local (avec hot-reload)
npm run dev

# Build de production
npm run build

# Verifier le linting
npm run lint

# Lancer les tests
npm run test
```

---

## 6. Points d'Attention

### 6.1 CORS (Cross-Origin Resource Sharing)

Si votre serveur ODK Central (`www.job-tracker.fr`) n'est pas configure pour accepter les requetes cross-origin, vous devrez:

1. **Option A**: Configurer CORS sur ODK Central (necessite acces serveur)
2. **Option B**: Utiliser un proxy (recommande - deja prevu dans ce plan)

### 6.2 Authentification

L'authentification ODK Central utilise des cookies de session. Assurez-vous que:
- Le proxy preserve les cookies
- Les headers `credentials: 'include'` sont presents dans les requetes

### 6.3 Mise a Jour Future

Pour mettre a jour depuis le repo ODK Central officiel:
```bash
git remote add upstream https://github.com/getodk/central-frontend.git
git fetch upstream
git merge upstream/master
# Resoudre les conflits dans _variables.scss si necessaire
```

---

## 7. Ressources

- **ODK Central Documentation**: https://docs.getodk.org/central-intro/
- **ODK Central API**: https://docs.getodk.org/central-api/
- **Space Grotesk Font**: https://fonts.google.com/specimen/Space+Grotesk
- **Design System THEO**: `design.json` (local)

---

## 8. Checklist Pre-Deploiement

- [ ] Variables SCSS modifiees et testees
- [ ] Font Space Grotesk charge correctement
- [ ] Titre et branding mis a jour
- [ ] Connexion API fonctionne (login/logout)
- [ ] Build de production genere sans erreurs
- [ ] Proxy configure sur le serveur de production
- [ ] HTTPS active (recommande)
- [ ] Tests fonctionnels effectues

---

*Document genere par Claude Code - Session Brainstorming THEO COLLECT*
