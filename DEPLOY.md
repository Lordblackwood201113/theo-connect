# Déploiement — collect.locagri-app.com (Cloudflare Pages)

Le frontend statique est servi par **Cloudflare Pages**. Les requêtes API vers le backend ODK Central (`https://job-tracker.fr`) sont relayées en same-origin par une Pages Function (`functions/_middleware.js`) — équivalent du reverse-proxy nginx utilisé sous Coolify.

## 1. Connecter le repo à Cloudflare Pages

1. Dashboard Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Sélectionner `Lordblackwood201113/theo-connect`, branche **`master`**.
3. **Build settings** :
   - Framework preset : **None** (ou *Vite*)
   - Build command : `npm run build`
   - Build output directory : `dist`
   - Root directory : `/`
   - Node version : `22` (variable `NODE_VERSION=22` dans **Environment variables**)
4. Lancer le premier déploiement. Récupérer l'URL `<project>.pages.dev` une fois le build OK.

> Le fichier `wrangler.toml` à la racine fixe `pages_build_output_dir = "dist"` ; Cloudflare le détecte automatiquement et pré-remplit ces champs.

## 2. Vérifier le proxy

Une fois le premier déploiement vert, tester sur l'URL `<project>.pages.dev` :

```bash
curl -i https://<project>.pages.dev/version.txt          # → 200, contenu ODK Central
curl -i https://<project>.pages.dev/client-config.json   # → 200, JSON
curl -i https://<project>.pages.dev/v1/projects          # → 401 (auth requise, c'est attendu)
```

Si l'un de ces appels renvoie un 404 / la page SPA, c'est que la function n'est pas active — vérifier que `functions/_middleware.js` est bien présent à la racine du build et que les Pages Functions sont activées (par défaut elles le sont).

## 3. Domaine custom `collect.locagri-app.com`

Dans la zone Cloudflare de `locagri-app.com` :

1. Dans le projet Pages → **Custom domains** → **Set up a custom domain** → saisir `collect.locagri-app.com`.
2. Cloudflare propose l'enregistrement DNS à créer : un **CNAME** `collect` → `<project>.pages.dev`, proxifié (nuage orange).
   - Si la zone est déjà sur Cloudflare, accepter l'auto-création.
   - Sinon : ajouter manuellement le CNAME dans le DNS du registrar.
3. Attendre l'émission du certificat (quelques minutes, géré par Cloudflare).

## 4. Tester le domaine final

```bash
curl -I https://collect.locagri-app.com/                  # → 200, SPA
curl -i https://collect.locagri-app.com/version.txt       # → 200, ODK Central
curl -i https://collect.locagri-app.com/v1/projects       # → 401
```

Puis se connecter dans un navigateur, vérifier que la session reste authentifiée (les cookies sont bien posés sur `collect.locagri-app.com` grâce à la réécriture du `Domain=` dans le middleware).

## Fichiers concernés

- `functions/_middleware.js` — reverse-proxy `/v1`, `/-`, `/enketo-passthrough`, `/client-config.json`, `/version.txt` vers `https://job-tracker.fr`, avec réécriture des cookies pour rester same-origin.
- `wrangler.toml` — déclare le dossier de build (`dist`) pour Cloudflare Pages.
- `nginx.conf` / `Dockerfile` — config historique pour Coolify ; ignorée par Cloudflare Pages mais conservée pour le dev local et un éventuel fallback.
