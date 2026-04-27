---
description: Stockage et backup arr-stack — chargé sur scripts backup et guides stockage
paths:
  - "backup-arr-stack.sh"
  - "docs/proxmox-backup-guide.md"
  - "docs/proxmox-storage-guide.md"
  - "backup-guide.md"
  - "restore-guide.md"
---

# Stockage & Backup

## Architecture

```
/docker/appdata/    ← configs persistantes tous conteneurs
/data/
  torrents/         ← téléchargements qBittorrent (tv/ movies/ music/)
  media/            ← bibliothèque finale — hardlinks depuis torrents/
  personal/         ← fichiers personnels Syncthing
```

- Règle critique : `/data/torrents` et `/data/media` sur le MÊME filesystem (hardlinks).
- Disque virtio unique sur VM = règle naturellement respectée. Vérifier si séparation `/` + `/data`.

## Backup (deux niveaux)

- **Applicatif** : `backup-arr-stack.sh` — `/docker/appdata` + `/data/personal` + configs système.
- **VM** : Snapshots Proxmox (Datacenter → Backup) — complémentaire, gère l'OS.
- Lire `docs/proxmox-backup-guide.md` pour la procédure Proxmox.

## Guides

- Stockage Proxmox : `docs/proxmox-storage-guide.md`
- Restore : `restore-guide.md`
