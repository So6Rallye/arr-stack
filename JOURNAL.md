# Journal des décisions — ARR Stack

Toutes les décisions techniques, architecturales et de produit, dans l'ordre chronologique ascendant.
Mis à jour à chaque session de travail.

| Date | Décision |
|---|---|
| 2026-04-16 | Création du projet ARR Stack — home server Docker media automation sur vieux Lenovo i5-6400 |
| 2026-04-16 | Choix stack : Docker Compose (hotio images) — Radarr, Sonarr, Lidarr, Bazarr, Prowlarr, qBittorrent, Jellyfin, Syncthing + Samba host |
| 2026-04-16 | Choix stockage : SSD pour OS + /docker/appdata, HDDs (2× 2TB WD) pour /data en RAID1 mdadm |
| 2026-04-16 | Choix réseau : IP fixe 192.168.1.200 via réservation DHCP router, hostname arr-server |
| 2026-04-16 | Stratégie hardlinks : /data/torrents et /data/media sur même filesystem — règle critique |
| 2026-04-16 | Décision Watchtower : non-retenu — mises à jour manuelles via `make update` préférées pour stabilité |
| 2026-04-16 | Accès distant : Tailscale recommandé post-stabilisation LAN — ne jamais exposer ports publics |
| 2026-04-16 | Analyse complète du repo par agent IA — fichiers de suivi mis à jour (CLAUDE.md, credentials.md, FONCTIONNALITES.md, JOURNAL.md, PLAN_DEPLOIEMENT.md, TODO_SESSION.md) |
| 2026-04-16 | Correction fichiers de suivi : références erronées à Node 22 LTS + Express 5 supprimées (contamination template) |
| 2026-04-16 | État hardware confirmé : machine en cours de montage physique — 2× HDDs 2TB WD (2010) confirmés à formater, pas de données à conserver — chemin RAID1 (Chemin A) retenu par défaut si SMART OK |
| 2026-04-16 | Choix OS : Debian 12 (Bookworm) — retenu à la place d'Ubuntu pour sa légèreté, sa stabilité long terme, l'absence de services de fond non nécessaires (snap, cloud-init) et son intégration native de mdadm. Ubuntu reste compatible mais Debian 12 est le choix optimal pour un home server Docker "set and forget". |
| 2026-04-16 | Mode opératoire déploiement défini : l'utilisateur installe Debian 12 manuellement (ISO, partitionnement, SSH activé), puis donne l'IP + user à l'agent qui prend la main en SSH pour toutes les phases suivantes (audit, RAID, Docker, stack, Samba, validation). |
| 2026-04-16 | Décision : tous les identifiants, accès, clés et secrets centralisés dans credentials.md — 8 sections : Système, Réseau, .env Docker, Services web, API Keys, Samba, Tailscale, Stockage/RAID. |
| 2026-04-17 | Audit pré-déploiement : 6 corrections appliquées — credentials.md ajouté au .gitignore (critique), rotation logs docker-compose (max-size 10m / max-file 3), backup mdadm.conf + fstab dans backup-arr-stack.sh, vérification montage /data dans install.sh, .PHONY dans Makefile, section "future improvements" README.md nettoyée (items déjà livrés). |
