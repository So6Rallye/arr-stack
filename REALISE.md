# REALISE.md — Archive des realisations ARR Stack

Ce fichier documente tout ce qui a ete implemente et valide.
Archive pure — aucune tache restante. Les actions de deploiement sont dans `PLAN_DEPLOIEMENT.md`.

> Pour le backlog restant -> voir `PLAN_DEPLOIEMENT.md`
> Pour les decisions -> voir `JOURNAL.md` 

Archive des livrables terminés.

| Date | Livrable |
|---|---|
| 2026-04-16 | Création du projet et des fichiers de suivi |
| 2026-04-17 | Audit pré-déploiement complet — 6 corrections appliquées (credentials.md gitignored, log rotation Docker, backup mdadm.conf+fstab, guard mountpoint /data, .PHONY Makefile, README nettoyé) + repo git initialisé et pushé sur github.com/So6Rallye/arr-stack |
| 2026-04-17 | Audit global cohérence pré-déploiement (30 fichiers) — zéro incohérence majeure. 7 corrections : BACKUP_DEST dans .env.example + install.sh (source .env + mkdir) + backup-arr-stack.sh (source .env), make check-hardlinks (inode comparison), /dev/dri optionnel documenté (CONFIG-SERVICES.md + README.md), JOURNAL.md (8 entrées). Stratégie backup confirmée : /data/media non sauvegardé (re-téléchargeable). |
