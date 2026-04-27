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
