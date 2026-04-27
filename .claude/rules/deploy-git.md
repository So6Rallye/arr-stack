---
description: Git workflow arr-stack — chargé sur fichiers git config et gitignore
paths:
  - ".git/**"
  - "**/.gitignore"
  - "**/*deploy*"
---

# Deploy & Git

- Branche de travail : **`main`** — exception workspace (pas de `staging` sur ce repo, travail direct sur `main`).
- Branche legacy figée : `legacy/physical-lenovo` (tag `v0-physical-lenovo`) — ne pas modifier.
- Remote : https://github.com/So6Rallye/arr-stack
- Commits atomiques : un commit = un sujet précis.
- Push après approbation utilisateur uniquement.
- Secrets dans `.env` + `CREDENTIALS.md` (tous deux gitignored), jamais dans le code.
