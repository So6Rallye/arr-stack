# PROJECT_CONTEXT.md — ARR Stack

Contexte projet local pour les agents IA.

## Objectif

Déployer un home server media automation + sync fichiers personnels comme VM Debian 12 sur un serveur Proxmox VE existant.
Stack entièrement Dockerisée (8 conteneurs) + Samba sur host de la VM.
Conçu pour être simple, fiable et maintenable sans compétences avancées.

## Statut actuel

**Phase 0 terminée** — analyse repo + mise à jour fichiers de suivi.
**Migration Lenovo → Proxmox** appliquée — voir `INFOS-DEV/migration-proxmox.md`.
La variante hors-Proxmox est figée sur la branche `legacy/physical-lenovo` (tag `v0-physical-lenovo`).
**Phase 0.7 à faire** — provisioning VM Proxmox.

## Infra cible

- **Hôte :** Proxmox VE 8.0.9 — `rp-pve-01`, Ryzen 3700x, 62 GiB ECC RAM, 1.52 TiB storage, GTX 1060 6GB (sortie console physique, pas en passthrough)
- **VM arr-server :** 4 vCPU / 8 GB RAM / disque virtio 500 GB, Debian 12 Bookworm, bridge `vmbr0`, IP fixe 192.168.1.200 (bail statique Freebox)
- **Pas de RAID côté VM** — géré par l'hôte Proxmox (ZFS ou LVM-thin selon config)
- **Pas de passthrough GPU** en Phase 1 — GTX 1060 reste sur l'hôte (Ryzen sans iGPU, nécessaire pour console physique)

## Points de vigilance

1. **Confirmer qu'on est bien dans la VM** avant toute commande destructive (`hostnamectl`)
2. **Hardlinks** — `/data/torrents` et `/data/media` DOIVENT être sur le même FS (naturel avec un disque virtio unique, mais à vérifier si séparation `/` + `/data` en deux disques)
3. **Transcode Jellyfin** — désactivé par défaut, stratégie direct-play DLNA → Freebox Player. NVENC passthrough = option future (voir `docs/gpu-passthrough-guide.md`)
4. **Snapshots / backups VM** — côté Proxmox, complémentaire à `backup-arr-stack.sh` (niveau applicatif)
5. **MAC virtuelle** — pour le bail DHCP Freebox, la MAC vient de la config VM Proxmox (éditable), pas d'une carte réseau physique

## Technos utilisées

- **OS guest : Debian 12 (Bookworm)** — minimal netinst, SSH activé, qemu-guest-agent installé
- Docker Engine + Compose plugin (install via apt, méthode officielle)
- hotio images (Radarr, Sonarr, Lidarr, Bazarr, Prowlarr, qBittorrent, Jellyfin)
- syncthing/syncthing
- Samba (host de la VM, apt)
- **Pas de mdadm, pas de smartmontools côté guest** (RAID et SMART = hôte Proxmox)
