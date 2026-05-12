# LOCAL_LEARNINGS.md — ARR Stack

Leçons et découvertes spécifiques à ce projet. Alimenté en fin de session.

---

## .env.example — pattern "Reference only" (vars non injectées) [arr-stack] [validé]

`.env.example` sert de documentation de référence uniquement — les variables ne sont PAS injectées dans Docker Compose automatiquement.
Chaque variable doit être présente dans `.env` (créé depuis `.env.example`) pour être effective.
Pattern documenté explicitement en commentaire en tête de `.env.example` pour éviter la confusion.
(arr-stack, 2026-04-24)

---

## Hardlinks — vérification par inode avec make check-hardlinks [arr-stack] [validé]

Vérifier que `/data/torrents` et `/data/media` partagent le même filesystem (condition pour les hardlinks ARR) :
`make check-hardlinks` → compare les inodes de deux fichiers de référence créés dans chaque dossier.
Si les inodes diffèrent, les ARR apps basculent silencieusement en copie complète (lente, double espace disque).
Sur VM disque unique, la règle est naturellement respectée — vérifier uniquement après changement de layout.
(arr-stack, 2026-04-24)

---

## install.sh — guard mountpoint /data avant docker compose up [arr-stack] [validé]

`install.sh` vérifie que `/data` est monté avant de lancer `docker compose up`.
Guard : `mountpoint -q /data || { echo "ERREUR : /data non monté. Vérifier fstab."; exit 1; }`.
Sans ce guard, Docker Compose démarre avec `/data` vide → bibliothèques vides, configs potentiellement écrasées.
(arr-stack, 2026-04-24)

---

## Immich — stack séparée (pgvecto-rs custom image) [arr-stack] [validé]

Immich nécessite une image PostgreSQL custom avec `pgvecto-rs` (extension vectorielle).
Ne pas intégrer dans `docker-compose.yml` principal — stack Docker Compose séparée (`immich/docker-compose.yml`).
Raison : l'image PostgreSQL custom d'Immich est incompatible avec les autres services qui utilisent PostgreSQL standard.
(arr-stack, 2026-04-24)

---

## Hooks externalisés + strict-wording slug [arr-stack] [validé]

PreToolUse Bash et PostToolUse Edit|Write|MultiEdit dans `.claude/hooks/{pre-tool-use,post-edit}.mjs`. Le `settings.json` ne fait plus que pointer via cygpath : `HOOK_DIR="$(cygpath -w "$CLAUDE_PROJECT_DIR")" && node "$HOOK_DIR\.claude\hooks\<file>.mjs"`. Pourquoi : un `node -e "…"` inline avec regex contenant `\\` se fait double-unescape (JSON + bash) et crashe silencieusement.

Chaque nudge utilise `strictNudge(slugs, role, focus)` qui répète littéralement le slug entre guillemets numérotés et exige `Agent({ subagent_type: "<slug-littéral>", ... })` avec triple négation ("Pas general-purpose. Pas une paraphrase. Pas une description seule.") + clause de refus si le slug est introuvable. Sans cela, Claude paraphrase via general-purpose et le dashboard reader ne voit jamais l'invocation des sub-agents projet.

Ordering critique : VPN config (`wireguard|openvpn|vpn.*`) **avant** docker-compose, sinon `docker-compose.vpn.yml` est mal routé. Régex destructive `rsync\b[^|;&]*--delete` (pas `rsync\s+--delete`) pour matcher les flags intermédiaires (`rsync -a --delete`).

Test E2E reproductible : `DASHBOARD/scripts/__test-arrstack-hooks.mjs` — 30/30 PASS sous Git Bash + Windows Node (spawnSync avec CLAUDE_PROJECT_DIR Unix + cwd Windows).
(arr-stack, 2026-05-07)
