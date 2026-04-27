---
description: Proxmox arr-stack — chargé sur guides Proxmox et configs VM
paths:
  - "docs/proxmox-*.md"
  - "docs/gpu-passthrough-guide.md"
  - "INFOS-DEV/**"
---

# Proxmox VE

## Hôte

- `rp-pve-01` — Proxmox VE 8.0.9, Ryzen 3700x, 62 GiB ECC RAM, 1.52 TiB storage
- GTX 1060 6GB **reste sur l'hôte** (sortie console physique — Ryzen sans iGPU). **Pas de passthrough Phase 1.**

## VM arr-server

- 4 vCPU / 8 GB RAM / disque virtio unique 500 GB, Debian 12 Bookworm
- Bridge `vmbr0` — IP fixe 192.168.1.200 (bail DHCP Freebox, MAC virtuelle éditable dans config VM Proxmox)
- Hostname : `arr-server` — vérifier avec `hostnamectl` avant toute commande

## Guides

- VM provisioning : `docs/proxmox-vm-guide.md`
- Stockage Proxmox : `docs/proxmox-storage-guide.md`
- Backup VM : `docs/proxmox-backup-guide.md`
- GPU passthrough (futur) : `docs/gpu-passthrough-guide.md`

## Règle NVENC

- Transcode Jellyfin **désactivé par défaut** — stratégie direct-play DLNA → Freebox Player.
- Passthrough GTX 1060 = option future non-prioritaire.
