# CLAUDE.md — ARR Stack

## Rôle du projet
Stack home server Docker dédiée à l'automatisation media et la synchronisation fichiers personnels.
Projet E-MOTION / So'6 Rallye — déployé sur un vieux Lenovo desktop (Intel i5-6400).

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
| Syncthing | Docker (syncthing/syncthing) | 8384 | Sync fichiers personnels |
| Samba | Host (apt) | 445 | Partages SMB LAN |

**OS :** Debian 12 (Bookworm) — choix retenu (plus léger qu'Ubuntu, pas de snap/cloud-init, mdadm natif)  
**Runtime :** Docker Engine + Compose plugin  
**Images :** hotio (ARR apps) + syncthing/syncthing  
**Réseau Docker :** arr_network (bridge custom)  
**DNS conteneurs :** Cloudflare 1.1.1.1 / 1.0.0.1

---

## Architecture stockage

```
SSD (OS + configs) :
  /docker/appdata/     ← configs persistantes de tous les conteneurs

HDD Data (RAID1 cible) :
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

---

## Réseau cible

- **IP fixe LAN :** 192.168.1.200 (réservation DHCP sur le router — méthode recommandée)
- **Hostname :** arr-server
- **Accès distant :** Tailscale (post-stabilisation LAN)
- **Ne jamais exposer** les ports directement sur Internet

---

## Hardware cible

- **Machine :** Lenovo desktop (Lenovo S510 ou équivalent)
- **CPU :** Intel i5-6400 (4 cœurs, iGPU Intel HD 530)
- **SSD :** OS + /docker/appdata
- **HDDs :** 2× 2TB WD Caviar Black (2010) — RAID1 logiciel (mdadm)
- **QuickSync :** `/dev/dri` requis (BIOS iGPU enabled)

---

## Git

- Branche de travail : **staging** — main/master protégé
- Commits atomiques : un commit = un sujet précis
- Secrets dans `.env` (gitignored), jamais dans le code

---

## Règles pour les agents

### Actions DESTRUCTIVES — confirmation obligatoire avant d'exécuter
- Formatage ou partitionnement de disque
- Création ou destruction d'un RAID
- Suppression de `/data` ou `/docker/appdata`
- Modification de `/etc/fstab`

### Ordre d'audit avant toute action machine
1. `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL` — identifier les disques
2. `smartctl -a /dev/sdX` — vérifier la santé SMART
3. Confirmer quel disque est le SSD vs HDD avant toute écriture

### Ne jamais supposer
- Que `/dev/sda` est le bon disque à effacer
- Que les HDDs sont vides (ils peuvent contenir des données)
- Que les HDDs sont sains sans SMART vérifié

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
