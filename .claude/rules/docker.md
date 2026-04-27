---
description: Docker Compose arr-stack — chargé sur docker-compose.yml et fichiers YAML de services
paths:
  - "docker-compose*.yml"
  - "**/*.yml"
  - "**/Dockerfile*"
---

# Docker Compose

- `/data/torrents` et `/data/media` DOIVENT être sur le même filesystem — règle hardlinks critique.
- Vérifier avec `make check-hardlinks` après tout changement de layout stockage.
- Réseau Docker : `arr_network` (bridge custom) — ne pas mélanger avec d'autres réseaux.
- Images hotio pour les ARR apps, `syncthing/syncthing` pour Syncthing.
- Immich → stack séparée (`docker-compose.immich.yml`) — incompatible PostgreSQL custom.
- Lire `docs/immich-guide.md` avant tout travail sur la stack Immich.
- `make update` pour les mises à jour — pas de Watchtower (décision 2026-04-16).
