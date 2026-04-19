# CLAUDE.md — ARR Stack

> **Variante Proxmox (VM Debian 12).** Version hors-Proxmox (Lenovo / RAID1 mdadm / Intel QuickSync) figée sur la branche `legacy/physical-lenovo` (tag `v0-physical-lenovo`).

## Rôle du projet
Stack home server Docker dédiée à l'automatisation media et la synchronisation fichiers personnels.
Projet E-MOTION / So'6 Rallye — déployé comme VM Debian 12 sur Proxmox VE (`rp-pve-01`, Ryzen 3700x, 62 GiB ECC).

---

## Stack technique

| Composant | Technologie | Port | Rôle |
|---|---|---|---|
| Radarr | Docker (hotio/radarr) | 7878 | Automatisation films |
| Sonarr | Docker (hotio/sonarr) | 8989 | Automatisation séries |
| Lidarr | Docker (hotio/lidarr) | 8686 | Automatisation musique |
| Bazarr | Docker (hotio/bazarr) | 6767 | Sous-titres |
| Prowlarr | Docker (hotio/prowlarr) | 9696 | Indexeurs centralisés |
| qBittorrent | Docker (hotio/qbittorrent) | 8080 | Téléchargements torrent |
| Jellyfin | Docker (hotio/jellyfin) | 8096 | Serveur media |
| Navidrome | Docker (deluan/navidrome) | 4533 | Serveur musique Subsonic — clients mobiles famille |
| Syncthing | Docker (syncthing/syncthing) | 8384 | Sync fichiers personnels |
| Samba | Host (apt) | 445 | Partages SMB LAN |

**OS :** Debian 12 (Bookworm) — choix retenu (plus léger qu'Ubuntu, pas de snap/cloud-init)  
**Runtime :** Docker Engine + Compose plugin  
**Images :** hotio (ARR apps) + syncthing/syncthing  
**Réseau Docker :** arr_network (bridge custom)  
**DNS conteneurs :** Cloudflare 1.1.1.1 / 1.0.0.1

---

## Architecture stockage

```
VM Debian 12 — disque virtio unique 500 GB (RAID géré par l'hôte Proxmox) :
  /docker/appdata/     ← configs persistantes de tous les conteneurs
  /data/
    torrents/          ← téléchargements qBittorrent
      tv/ movies/ music/
    media/             ← bibliothèque finale (hardlinks depuis torrents/)
      tv/ movies/ music/
    personal/          ← fichiers personnels Syncthing
      photos/ phone-camera/ videos/ documents/ shared/
```

**Règle critique :** `/data/torrents` et `/data/media` DOIVENT être sur le MÊME filesystem.  
Les ARR apps utilisent des hardlinks — si les partitions diffèrent, le système bascule en copie lente.
Sur un disque virtuel unique, cette règle est naturellement respectée.

---

## Réseau cible

- **IP fixe LAN :** 192.168.1.200 (réservation DHCP sur le router — méthode recommandée)
- **Hostname :** arr-server
- **Accès distant :** Tailscale (post-stabilisation LAN)
- **Ne jamais exposer** les ports directement sur Internet

---

## Infra cible

- **Hôte Proxmox :** `rp-pve-01` — Proxmox VE 8.0.9, Ryzen 3700x, 62 GiB ECC RAM, 1.52 TiB storage
- **VM arr-server :** 4 vCPU / 8 GB RAM / disque virtio unique 500 GB, Debian 12 (Bookworm)
- **Stockage :** disque virtuel unique — RAID géré par l'hôte Proxmox (ZFS ou LVM-thin selon config hôte). `/data` et `/docker/appdata` = simples répertoires sur ce disque.
- **Réseau :** bridge `vmbr0` — VM visible sur le LAN 192.168.1.0/24 via MAC virtuelle éditable dans la config VM Proxmox
- **GPU :** GTX 1060 6GB **reste sur l'hôte Proxmox** (sortie console physique — Ryzen 3700x sans iGPU). Pas de passthrough en Phase 1.
- **Transcode Jellyfin :** **désactivé par défaut**. Stratégie = direct-play DLNA → Freebox Player (Freebox Ultra décode H.265 en hardware). Passthrough GTX 1060 (NVENC) documenté comme option future non-prioritaire (voir `docs/gpu-passthrough-guide.md`).
- **Snapshots / backups VM :** gérés côté Proxmox (Datacenter → Backup). `backup-arr-stack.sh` couvre le niveau applicatif (`/docker/appdata` + `/data/personal` + configs système).

---

## Git

- Branche de travail : **main** — exception workspace (pas de `staging` sur ce repo, travail direct sur `main`)
- Remote : https://github.com/So6Rallye/arr-stack
- Branche legacy : `legacy/physical-lenovo` (tag `v0-physical-lenovo`) — dernière version hors-Proxmox, figée
- Commits atomiques : un commit = un sujet précis
- Secrets dans `.env` + `credentials.md` (tous deux gitignored), jamais dans le code

---

## Règles pour les agents

### Actions DESTRUCTIVES — confirmation obligatoire avant d'exécuter
- Formatage ou partitionnement du disque virtuel de la VM
- Suppression de `/data` ou `/docker/appdata`
- Modification de `/etc/fstab`
- Toute action côté hôte Proxmox (snapshots, suppression VM, passthrough GPU, modif bridge réseau)

### Ordre d'audit avant toute action machine (dans la VM)
1. `hostnamectl` — confirmer qu'on est bien dans la VM `arr-server` et non sur un autre hôte
2. `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT` — structure du disque virtio
3. `df -h` + `findmnt /data` — confirmer les points de montage avant toute écriture

### Ne jamais supposer
- Que la VM tourne déjà avant d'exécuter des commandes (vérifier via SSH ou console Proxmox)
- Que le GPU passthrough est configuré — vérifier côté hôte Proxmox avant toute config Jellyfin NVENC
- Que les snapshots Proxmox sont actifs — vérifier Datacenter → Backup avant toute modif destructive

### Variables d'environnement
- Lire `.env.example` pour la structure
- Créer `.env` à partir de `.env.example`, adapter PUID/PGID/TZ/IPs au vrai hardware
- Ne jamais inventer de credentials ni écrire de faux secrets dans credentials.md

---

## Fichiers de suivi

| Fichier | Rôle |
|---|---|
| CLAUDE.md | Contexte projet pour les agents |
| JOURNAL.md | Décisions techniques (chronologique ascendant) |
| TODO_SESSION.md | Tâches ouvertes de la session courante |
| REALISE.md | Archive des livrables terminés |
| FONCTIONNALITES.md | Inventaire complet des features |
| PLAN_DEPLOIEMENT.md | Phases de déploiement + roadmap |
| AGENTS.md | Coordination multi-IA |
| credentials.md | Secrets et valeurs de configuration (hors repo public) |
| CONFIG-SERVICES.md | Guide de configuration UI par service (Phase 7) |
| .brain/PROJECT_CONTEXT.md | Contexte projet local pour les agents |
| .brain/LOCAL_LEARNINGS.md | Leçons spécifiques au projet |
| .brain/SESSION_INBOX.md | Zone tampon IA — dépôt en fin de session |
