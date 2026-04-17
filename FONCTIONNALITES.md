# FONCTIONNALITES.md — Inventaire ARR Stack

## Stack Media Automation

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Automatisation films (Radarr) | Planifié | Port 7878 — intégration Prowlarr + qBittorrent |
| Automatisation séries TV (Sonarr) | Planifié | Port 8989 — intégration Prowlarr + qBittorrent |
| Automatisation musique (Lidarr) | Planifié | Port 8686 — intégration Prowlarr + qBittorrent |
| Sous-titres automatiques (Bazarr) | Planifié | Port 6767 — lié à Radarr + Sonarr |
| Indexeurs centralisés (Prowlarr) | Planifié | Port 9696 — distribue vers tous les ARR |
| Téléchargements torrent (qBittorrent) | Planifié | Port 8080 — catégories movies/tv/music |
| Serveur media (Jellyfin) | Planifié | Port 8096 — direct-play prioritaire via DLNA → Freebox Player Ultra |
| Synchronisation fichiers (Syncthing) | Planifié | Port 8384 — photos, documents, vidéos personnels |
| Partages réseau LAN (Samba) | Planifié | SMB 445 — personal (RW) + media (RO) |

---

## Stockage & Filesystem

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Structure /data hardlink-friendly | Planifié | torrents/ + media/ sur même disque virtio |
| Hardlinks ARR → no duplication | Planifié | Copy vs hardlink selon même FS |
| Disque virtio unique (VM Proxmox) | Planifié | RAID géré par l'hôte Proxmox |
| Snapshots VM Proxmox | Planifié | Datacenter → Backup (zstd, snapshot mode, retention) |
| Backup /docker/appdata | Planifié | Script `backup-arr-stack.sh` (rsync) — niveau applicatif |
| Backup /data/personal | Planifié | Inclus dans backup script |
| Guide agrandissement disque virtio | Disponible | Guide `proxmox-storage-guide.md` |

---

## Réseau & Accès

| Fonctionnalité | Statut | Notes |
|---|---|---|
| IP fixe LAN (192.168.1.200) | Planifié | Réservation DHCP router |
| Hostname arr-server | Planifié | `hostnamectl set-hostname arr-server` |
| Accès LAN tous services | Planifié | http://192.168.1.200:<port> |
| Accès SMB depuis LAN | Planifié | \\192.168.1.200\personal et \media |
| Accès distant sécurisé (Tailscale) | Optionnel | Post-stabilisation LAN |

---

## Hardware & Performance

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Stratégie direct-play prioritaire (Jellyfin) | Planifié | DLNA → Freebox Player Ultra — H.265 HW decode natif, zéro transcode |
| Passthrough GPU NVIDIA (GTX 1060) | Option future | Documenté dans `docs/gpu-passthrough-guide.md` — non activé en Phase 1 |
| Watchtower (mises à jour auto) | Non-retenu | Mises à jour manuelles préférées (`make update`) |

---

## Opérationnel

| Fonctionnalité | Statut | Notes |
|---|---|---|
| `make up/down/ps/logs/ps/pull/update` | Disponible | Makefile inclus |
| `make check-hardlinks` | Disponible | Vérifie inodes media/ vs torrents/ — à lancer après premier contenu traité |
| Script backup configurable (cron) | Disponible | `backup-arr-stack.sh` — lit `BACKUP_DEST` depuis `.env`, fallback `/backup` |
| Backup destination configurable | Disponible | Variable `BACKUP_DEST` dans `.env.example`, créée par `install.sh` |
| Checklist post-install | Disponible | `first-boot-checklist.md` |
| Guide diagnostic | Disponible | `diagnostics.md` |
| Guide restauration | Disponible | `restore-guide.md` |
| Guide maintenance | Disponible | `maintenance-schedule.md` |
