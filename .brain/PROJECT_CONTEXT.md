# PROJECT_CONTEXT.md — ARR Stack

Contexte projet local pour les agents IA.

## Objectif

Déployer un home server media automation + sync fichiers personnels sur un vieux Lenovo desktop (i5-6400).
Stack entièrement Dockerisée (8 conteneurs) + Samba sur host.
Conçu pour être simple, fiable et maintenable sans compétences avancées.

## Statut actuel

**Phase 0 terminée** — analyse repo + mise à jour fichiers de suivi.
**Phase 1 à faire** — audit réel de la machine (disques, réseau, hardware).
La machine cible n'a pas encore été auditée. Les valeurs credentials.md sont des cibles/placeholders.

## Hardware cible (hypothèses non encore validées)

- Lenovo desktop (S510 ou équivalent)
- Intel i5-6400, ~8GB RAM
- SSD : OS + /docker/appdata
- HDDs : 2× 2TB WD Caviar Black (2010) — RAID1 mdadm cible
- IP cible : 192.168.1.200
- Hostname cible : arr-server

## Points de vigilance

1. **HDDs possiblement non vides** — inspecter avant toute décision de formatage
2. **SMART obligatoire** — les drives ~2010 sont vieillissants
3. **QuickSync** — /dev/dri doit exister (BIOS iGPU enabled)
4. **Hardlinks** — /data/torrents et /data/media sur même partition, critique
5. **Ne jamais supposer l'identité d'un disque** (/dev/sdX peut changer)

## Technos utilisées

- **OS : Debian 12 (Bookworm)** — choix retenu (pas Ubuntu, pas de snap/cloud-init)
- Docker Engine + Compose plugin (install via apt, méthode officielle)
- hotio images (Radarr, Sonarr, Lidarr, Bazarr, Prowlarr, qBittorrent, Jellyfin)
- syncthing/syncthing
- Samba (host, apt)
- mdadm (RAID1 logiciel)
- smartmontools (monitoring disques)
