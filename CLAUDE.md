# CLAUDE.md — ARR Stack

> Variante Proxmox (VM Debian 12). Variante hors-Proxmox figée sur `legacy/physical-lenovo`.

## Stack

Home server Docker sur VM Debian 12 (Proxmox VE `rp-pve-01`, Ryzen 3700x, 62 GiB ECC).
- **Services** : Radarr, Sonarr, Lidarr, Bazarr, Prowlarr, qBittorrent, Jellyfin, Navidrome, Syncthing + Samba (host)
- **Runtime** : Docker Engine + Compose plugin, images hotio + syncthing/syncthing
- **VM** : 4 vCPU / 8 GB RAM / disque virtio 500 GB, IP 192.168.1.200, hostname `arr-server`

## Imports

@AGENTS.md
@.brain/PROJECT_CONTEXT.md
@.brain/LOCAL_LEARNINGS.md
@../.brain/MISTAKES.md

## Procédures critiques

| Besoin | Fichier |
|---|---|
| Credentials / secrets | `CREDENTIALS.md` (gitignored) |
| Variables d'environnement | `.env.example` → `.env` |
| Déploiement VM Proxmox | `docs/proxmox-vm-guide.md` |
| Backup applicatif | `backup-arr-stack.sh` + `docs/proxmox-backup-guide.md` |
| Restore | `restore-guide.md` |
| GPU passthrough (futur) | `docs/gpu-passthrough-guide.md` |
| Architecture & roadmap | `PLAN_DEPLOIEMENT.md` |
| Décisions | `JOURNAL.md` |
| Features | `FONCTIONNALITES.md` |

## Règles path-scoped (auto-chargées)

Voir `.claude/rules/` — Claude charge les règles selon les fichiers édités :

| Règle | Domaine |
|---|---|
| `docker.md` | docker-compose.yml, services YAML |
| `security-env.md` | .env*, CREDENTIALS.md |
| `destructive-ops.md` | *.sh, Makefile — confirmation obligatoire |
| `storage-backup.md` | Scripts backup, guides stockage |
| `deploy-git.md` | Git workflow (branche `main`) |
| `journal-tracking.md` | Fichiers de suivi |
| `proxmox.md` | Guides Proxmox, config VM |

## Conventions de session

- Branche : **`main`** — exception workspace (pas de `staging` sur ce repo)
- Commits atomiques : un commit = un sujet précis
- Push après approbation utilisateur uniquement
- Répondre en **français**, concis
