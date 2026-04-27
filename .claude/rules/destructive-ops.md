---
description: Opérations destructives arr-stack — confirmation obligatoire avant exécution
paths:
  - "**/*.sh"
  - "Makefile"
  - "install.sh"
---

# Opérations destructives — confirmation obligatoire

Ces actions requièrent une confirmation explicite de l'utilisateur avant exécution :

- Formatage ou partitionnement du disque virtuel de la VM
- Suppression de `/data` ou `/docker/appdata`
- Modification de `/etc/fstab`
- Toute action côté hôte Proxmox (snapshots, suppression VM, passthrough GPU, modif bridge réseau)

## Audit obligatoire avant toute action machine (dans la VM)

1. `hostnamectl` — confirmer qu'on est bien dans `arr-server` et non sur un autre hôte
2. `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT` — structure disque virtio
3. `df -h` + `findmnt /data` — confirmer points de montage avant toute écriture

## Gardes à ne jamais supposer

- Que la VM tourne déjà — vérifier via SSH ou console Proxmox
- Que le GPU passthrough est configuré — vérifier côté hôte avant config Jellyfin NVENC
- Que les snapshots Proxmox sont actifs — vérifier Datacenter → Backup avant modif destructive

## install.sh

- Guard mountpoint `/data` intégré — `docker compose up` refusé si `/data` non monté.
