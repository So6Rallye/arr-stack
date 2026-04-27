---
description: Sécurité et environnement arr-stack — chargé sur fichiers .env et credentials
paths:
  - ".env*"
  - "**/*.env*"
  - "CREDENTIALS.md"
---

# Sécurité & Variables d'environnement

- 0 secret dans le code — tout dans `.env` (gitignored) ou `CREDENTIALS.md` (gitignored).
- Lire `.env.example` pour la structure — ce fichier est documentation de référence uniquement.
- `.env.example` ne s'injecte PAS automatiquement dans Docker Compose.
- Créer `.env` à partir de `.env.example`, adapter PUID/PGID/TZ/IPs au vrai hardware.
- Ne jamais inventer de credentials ni écrire de faux secrets dans `CREDENTIALS.md`.
- Ne jamais exposer les ports ARR/Jellyfin directement sur Internet.
