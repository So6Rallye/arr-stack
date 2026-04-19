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
| 2026-04-17 | Migration cible déploiement Lenovo physique → VM Debian 12 Proxmox complète (10 commits atomiques + 1 fix cleanup, tous pushés sur main). Tag `v0-physical-lenovo` + branche `legacy/physical-lenovo` figés. Vérification end-to-end 6 items OK (docs grep, docker-compose, scripts bash -n, PLAN_DEPLOIEMENT Phase 0.7/3, 4 guides Proxmox, CLAUDE.md cohérent). Référence orpheline hardware-raid-guide.md corrigée dans backup-guide.md. |
| 2026-04-18 | Extension stack pré-déploiement : Gluetun (VPN ProtonVPN WireGuard), FlareSolverr, Jellyseerr, Immich (server + microservices + ML + pgvecto-rs + Redis). Architecture 2 fichiers Compose (docker-compose.yml + docker-compose.immich.yml). Deux ancres YAML (x-common-keys / x-vpn-keys). Tous les fichiers de suivi mis à jour (README, FONCTIONNALITES, PLAN_DEPLOIEMENT, CONFIG-SERVICES, credentials, first-boot-checklist, JOURNAL). Guides créés : docs/immich-guide.md, tailscale-guide.md étoffé. install.sh + Makefile + .env.example mis à jour. |
