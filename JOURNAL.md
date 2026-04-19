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
| 2026-04-17 | Freebox DHCP — plage dynamique réduite à 192.168.1.199 (fin de plage). Bail statique à créer en Phase 2 : MAC arr-server → 192.168.1.200 + commentaire "arr-server" via Baux Statiques. |
| 2026-04-17 | Création CONFIG-SERVICES.md (racine) — guide complet de configuration UI par service pour Phase 7 : qBittorrent (ordre catégories critique), hardlinks ARR, noms Docker inter-conteneurs, API keys, FlareSolverr optionnel. |
| 2026-04-17 | Audit global cohérence pré-déploiement (30 fichiers) — zéro incohérence majeure trouvée. |
| 2026-04-17 | Ajout BACKUP_DEST dans .env.example — variable configurable pour le répertoire de backup, créée par install.sh, lue par backup-arr-stack.sh. |
| 2026-04-17 | install.sh — source .env au démarrage, crée BACKUP_DEST, affiche rappel make check-hardlinks en fin. |
| 2026-04-17 | backup-arr-stack.sh — source .env pour BACKUP_DEST, fallback /backup si absent. |
| 2026-04-17 | Ajout make check-hardlinks — vérifie les inodes media/ vs torrents/ après premier contenu traité. |
| 2026-04-17 | Jellyfin /dev/dri — documenté comme optionnel dans CONFIG-SERVICES.md et README.md : fallback software transcoding si iGPU absent ou désactivé. |
| 2026-04-17 | Stratégie backup confirmée : /data/media non sauvegardé (re-téléchargeable), seuls /docker/appdata + /data/personal + configs système sauvegardés. |
| 2026-04-17 | Migration cible déploiement : Lenovo i5-6400 physique → VM Debian 12 sur Proxmox rp-pve-01 (Ryzen 3700x, 62 GiB ECC). Motif : Proxmox déjà en prod, plus puissant, ECC, RAID géré par l'hôte. Lenovo abandonné. |
| 2026-04-17 | Ressources VM arrêtées : 4 vCPU / 8 GB RAM / 500 GB virtio disk. |
| 2026-04-17 | Gestion RAID supprimée côté VM — Proxmox host s'en charge. Suppression complète Phase 3 Chemins A/B, mdadm, mdadm.conf. Hardlinks toujours OK (même disque virtuel). |
| 2026-04-17 | Optimisations Intel retirées (iGPU HD 530, QuickSync, /dev/dri — inapplicables sur Ryzen 3700x). |
| 2026-04-17 | Stratégie transcode Jellyfin Phase 1 : **direct-play pur via DLNA Jellyfin → Freebox Player (Freebox Ultra)** qui décode H.265 nativement. Pas de passthrough GPU. GTX 1060 laissée sur l'hôte Proxmox pour console physique (Ryzen sans iGPU). Passthrough documenté comme option future réversible. Bibliothèque peut rester en H.265. |
| 2026-04-17 | Samba conservé dans la VM (pas d'externalisation). |
| 2026-04-17 | Guides docs/hardware-raid-guide.md et docs/upgrade-disks-guide.md supprimés, remplacés par proxmox-vm-guide.md + proxmox-storage-guide.md + proxmox-backup-guide.md + gpu-passthrough-guide.md (ce dernier documenté comme option future non activée). |
| 2026-04-17 | Vérification end-to-end migration Proxmox (checklist 6 items du plan) : OK. docs grep clean, docker-compose.yml sans /dev/dri actif, bash -n install.sh + backup-arr-stack.sh OK, Phase 0.7 actionable + Phase 3 sans mdadm/mkfs/fdisk, 4 guides Proxmox référencés, CLAUDE.md cohérent. |
| 2026-04-17 | Bonus cleanup : référence orpheline `hardware-raid-guide.md` supprimée de `backup-guide.md:63`, remplacée par guides Proxmox + scripts + .env (commit 8ba5d2f pushé sur main). |
| 2026-04-18 | Ajout Gluetun (qmcgaw/gluetun) — tunnel VPN ProtonVPN WireGuard. qBittorrent, Radarr, Sonarr, Lidarr, Bazarr, Prowlarr, FlareSolverr routés via `network_mode: service:gluetun`. Ports exposés uniquement via Gluetun. |
| 2026-04-18 | Ajout FlareSolverr (port 8191) — bypass WAF Cloudflare pour Prowlarr, derrière Gluetun. Configuré dans Prowlarr → Settings → Indexers → Proxies. |
| 2026-04-18 | Ajout Jellyseerr (fallenbagel/jellyseerr, port 5055) — interface unifiée de demandes media, connectée à Jellyfin. Hors VPN (arr_network direct). |
| 2026-04-18 | Ajout stack Immich (port 2283) — gestion photos/vidéos familiales. Architecture : immich-server + immich-microservices + immich-machine-learning + PostgreSQL (pgvecto-rs) + Redis. Usage : admin + compte parent + compte enfant. |
| 2026-04-18 | Architecture 2 fichiers Compose : `docker-compose.yml` (ARR + VPN) + `docker-compose.immich.yml` (Immich isolé). Motif : Immich utilise postgres custom (pgvecto-rs), breaking changes fréquents, cycle de mise à jour indépendant. |
| 2026-04-18 | Deux ancres YAML dans docker-compose.yml : `x-common-keys` (services hors VPN : restart, logging, env, dns) + `x-vpn-keys` (services VPN : restart, logging, network_mode, depends_on). `network_mode: service:gluetun` incompatible avec `networks:` — ancres séparées obligatoires. |
| 2026-04-18 | Stockage : ajout `/data/photos/{library,upload}` pour Immich. Dossier appdata : `immich-postgres`, `immich-redis`, `immich-ml-cache` ajoutés dans install.sh. |
| 2026-04-18 | Tailscale : statut changé de "optionnel post-stabilisation" à "standard de déploiement". tailscale-guide.md étoffé (installation Debian 12, vérification, URLs d'accès distants). |
| 2026-04-18 | Makefile mis à jour : targets combinées (`make up/down/pull`) + targets par stack (`up-arr`, `up-immich`, etc.). |
| 2026-04-18 | Création docs/immich-guide.md — guide post-déploiement Immich : compte admin, comptes famille, app mobile, reconnaissance faciale, smart search CLIP, backup PostgreSQL. |
| 2026-04-18 | Ajout Navidrome (deluan/navidrome, port 4533) — serveur musique API Subsonic, complète Jellyfin pour usage mobile. Clients Android/iOS gratuits : Ultrasonic + Amperfy. Multi-comptes famille. Bibliothèque /data/media/music montée read-only (Lidarr écrit, Navidrome lit). Pattern common-keys (hors VPN), arr_network, SQLite dans /docker/appdata/navidrome. |
| 2026-04-19 | Audit exhaustif présence Navidrome — ajout dans README.md (intro, services list, recommended tree, URLs localhost/LAN/Tailscale, section dédiée, notes), tailscale-guide.md (tableau services), PLAN_DEPLOIEMENT.md (ordre Phase 7 + section config 12). |
