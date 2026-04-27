---
description: Fichiers de suivi arr-stack — chargé sur JOURNAL, PLAN, REALISE, FONCTIONNALITES
paths:
  - "JOURNAL.md"
  - "PLAN_DEPLOIEMENT.md"
  - "REALISE.md"
  - "FONCTIONNALITES.md"
  - "TODO_SESSION.md"
---

# Fichiers de suivi

- `JOURNAL.md` : une ligne par décision, **en bas** (ordre chronologique ascendant).
- `PLAN_DEPLOIEMENT.md` : cocher les tâches complétées.
- `REALISE.md` : ajouter si tâche complète sans action pendante.
- `FONCTIONNALITES.md` : mettre à jour si ajout/suppression de feature.

Checklist avant git push :
1. JOURNAL.md — ligne en bas
2. PLAN_DEPLOIEMENT.md — cocher complétées
3. REALISE.md — si applicable
4. FONCTIONNALITES.md — si feature modifiée

Workflow TODO_SESSION.md : quand un axe `[x]` est coché → FONCTIONNALITES.md → REALISE.md → retirer la ligne.
