# Déploiement — collect.locagri-app.com (Cloudflare Pages)

Le frontend statique est servi par **Cloudflare Pages**. Les requêtes API vers le backend ODK Central (`https://job-tracker.fr`) sont relayées en same-origin par une Pages Function (`functions/_middleware.js`) — équivalent du reverse-proxy nginx utilisé sous Coolify.

## 1. Créer le projet Cloudflare Pages

1. Dashboard Cloudflare → **Workers & Pages** → **Create** → **Pages** (onglet) → **Connect to Git**.
2. Sélectionner le repo `Lordblackwood201113/theo-connect`, branche **`master`**.
3. **Build settings** :
   - Framework preset : **None** (ou *Vite*)
   - Build command : `npm run build`
   - Build output directory : `dist`
   - Root directory : `/`
   - Node version : pin via `.nvmrc` (déjà présent → `22`)
4. **Save and Deploy**. Le premier build prend ~3-5 min.

> Le `wrangler.toml` à la racine déclare `pages_build_output_dir = "dist"`, Cloudflare pré-remplit ces champs automatiquement.

## 2. Vérifier le déploiement sur `<project>.pages.dev`

```bash
BASE=https://<project>.pages.dev
curl -I  $BASE/                     # 200, SPA
curl -i  $BASE/version.txt          # 200, version ODK Central
curl -i  $BASE/client-config.json   # 200, JSON
curl -i  $BASE/v1/projects          # 401 (auth requise)
curl -I  $BASE/projects/123         # 200, SPA fallback
```

## 3. Custom domain `collect.locagri-app.com` (DNS sur Hostinger)

1. Projet Pages → **Custom domains** → **Set up a custom domain** → saisir `collect.locagri-app.com`.
2. Cloudflare affiche le CNAME à créer côté Hostinger :
   ```
   Type  : CNAME
   Nom   : collect
   Cible : <project>.pages.dev
   ```
3. **hPanel Hostinger → Domaines → locagri-app.com → DNS / Nameservers → Ajouter un enregistrement** :
   - Type `CNAME`, Nom `collect`, Cible `<project>.pages.dev` (sans `https://`, sans `/`).
   - Enregistrer.
4. Cloudflare détecte la propagation puis émet le certificat TLS (1-15 min).
5. Vérifier :
   ```bash
   dig +short collect.locagri-app.com
   curl -I  https://collect.locagri-app.com/
   curl -i  https://collect.locagri-app.com/version.txt
   ```

## Fichiers concernés

- `functions/_middleware.js` — Pages Function. Proxy `/v1`, `/-`, `/enketo-passthrough`, `/client-config.json`, `/version.txt` vers `https://job-tracker.fr`, réécriture des `Set-Cookie` pour rester same-origin (équivalent `proxy_cookie_domain` nginx).
- `public/_redirects` — `/* /index.html 200` pour le routage SPA (deep links).
- `wrangler.toml` — `pages_build_output_dir = "dist"`.
- `.nvmrc` — pin Node 22 (`engines.node = "22"` dans package.json).
- `nginx.conf` / `Dockerfile` — config Coolify historique, non utilisée par Cloudflare. Conservée pour dev local et fallback éventuel.
