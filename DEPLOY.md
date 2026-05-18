# Déploiement — collect.locagri-app.com (Cloudflare Workers + Static Assets)

Frontend Vue statique servi par **Cloudflare Workers** avec le binding **Static Assets**. Un worker (`worker.js`) relaie en same-origin les requêtes API vers le backend ODK Central (`https://job-tracker.fr`) et délègue tout le reste au bundle statique (`dist/`) — équivalent du reverse-proxy nginx utilisé sous Coolify.

## 1. Projet Cloudflare (Workers)

Dashboard Cloudflare → **Workers & Pages** → **Create** → **Workers** → **Connect to Git** → repo `Lordblackwood201113/theo-connect`, branche `master`.

**Build & deploy settings** :

| Champ | Valeur |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` *(défaut)* |
| Root directory | `/` |
| Node version | gérée par `.nvmrc` (`22`) |

Le `wrangler.toml` à la racine déclare le worker (`main = "worker.js"`) et le binding statique (`[assets] directory = "./dist"`). Vérifier que le **nom du projet Cloudflare** correspond au champ `name` du `wrangler.toml` (`theo-collect`) — sinon aligner l'un sur l'autre.

## 2. Vérifier le déploiement

Une fois le build vert, Cloudflare expose `https://theo-collect.<account>.workers.dev`.

```bash
curl -i https://theo-collect.<account>.workers.dev/version.txt          # 200, version ODK
curl -i https://theo-collect.<account>.workers.dev/client-config.json   # 200, JSON
curl -i https://theo-collect.<account>.workers.dev/v1/projects          # 401 (auth requise)
curl -I https://theo-collect.<account>.workers.dev/                     # 200, SPA
```

Si `/version.txt` renvoie le HTML de la SPA → le worker ne route pas le proxy correctement, vérifier les logs Cloudflare (**Workers → theo-collect → Logs**).

## 3. Domaine custom `collect.locagri-app.com`

Zone DNS de `locagri-app.com` chez **Hostinger** (pas sur Cloudflare DNS).

1. Projet Worker → **Settings → Domains & Routes → Add → Custom Domain** → `collect.locagri-app.com`.
2. Cloudflare affiche le CNAME à créer côté Hostinger :
   ```
   Type : CNAME
   Nom  : collect
   Cible: theo-collect.<account>.workers.dev
   ```
3. Créer ce CNAME dans **hPanel Hostinger → Domaines → locagri-app.com → DNS / Nameservers**.
4. Attendre la propagation (1-15 min) puis l'émission du certificat TLS par Cloudflare.

## 4. Vérification finale

```bash
curl -I https://collect.locagri-app.com/
curl -i https://collect.locagri-app.com/version.txt
curl -i https://collect.locagri-app.com/v1/projects
```

Puis ouvrir le navigateur, se connecter, et vérifier que la session tient sur refresh (`document.cookie` ne doit pas contenir d'attribut `Domain=`).

## Fichiers concernés

- `worker.js` — Worker entrypoint. Proxy `/v1`, `/-`, `/enketo-passthrough`, `/client-config.json`, `/version.txt` vers `https://job-tracker.fr` (réécriture `Set-Cookie` pour rester same-origin). Tout le reste → `env.ASSETS.fetch(request)`.
- `wrangler.toml` — déclare `main`, `compatibility_date`, et le binding `[assets]` avec `not_found_handling = "single-page-application"` pour le routage SPA.
- `.nvmrc` — pin Node 22 pour le build CF.
- `nginx.conf` / `Dockerfile` — config Coolify historique, non utilisée par Cloudflare. Conservée pour dev local et éventuel fallback.
