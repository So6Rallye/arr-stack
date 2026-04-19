# PLAN_DEPLOIEMENT.md — ARR Stack

Déploiement comme **VM Debian 12 (Bookworm) sur Proxmox VE** (`rp-pve-01`, Ryzen 3700x, 62 GiB ECC).
Exécuter les phases dans l'ordre. Aucune action destructive sans audit préalable.

---

## Phase 0 — Analyse et mise à jour fichiers de suivi ✅
- [x] Lecture complète du dépôt (README, guides, docker-compose, .env.example, scripts)
- [x] Identification des manques et ambiguïtés
- [x] Mise à jour CLAUDE.md, credentials.md, FONCTIONNALITES.md, JOURNAL.md, PLAN_DEPLOIEMENT.md, TODO_SESSION.md
- [x] Choix OS guest : Debian 12 (Bookworm)
- [x] Migration cible : Lenovo physique → VM Proxmox (voir `INFOS-DEV/migration-proxmox.md`)

---

## Phase 0.5 — État hôte Proxmox ✅
- [x] Proxmox VE 8.0.9 en production sur `rp-pve-01`
- [x] Ressources disponibles vérifiées : Ryzen 3700x (8c/16t), 62 GiB ECC, 1.52 TiB storage
- [x] GTX 1060 6GB branchée sur l'hôte — **reste sur l'hôte** (sortie console physique, Ryzen sans iGPU)
- [x] Variante hors-Proxmox figée : tag `v0-physical-lenovo` + branche `legacy/physical-lenovo`

---

## Phase 0.7 — Provisioning VM Proxmox (AGENT + utilisateur)
> Remplace l'install Debian physique. La VM remplace le Lenovo.

### Préparation
- [ ] **Utilisateur → Proxmox UI** : Datacenter → Storage → upload ISO Debian 12 netinst amd64
- [ ] Choisir un VMID libre (ex: `200`) et un node (`rp-pve-01`)

### Création VM (CLI `qm create` ou UI Proxmox)
- [ ] VM name : `arr-server`
- [ ] OS : Debian 12 / Linux 6.x
- [ ] CPU : 4 vCPU, type `host` (exposition instructions natives)
- [ ] RAM : 8 GB (pas de ballooning agressif)
- [ ] Disque : virtio-scsi, 500 GB, storage selon config hôte (ZFS ou LVM-thin)
- [ ] Réseau : bridge `vmbr0`, modèle `virtio`, **noter la MAC générée** (pour bail DHCP Freebox)
- [ ] Pas de passthrough GPU en Phase 1 — GTX 1060 reste sur l'hôte
- [ ] Options VM : Start at boot = yes, qemu-guest-agent = enabled

### Install Debian dans la VM (via console Proxmox noVNC/SPICE)
- [ ] Booter sur l'ISO, choisir **Install** (pas graphical)
- [ ] Langue : English (évite soucis encodage serveur)
- [ ] Localisation : France / Europe/Paris
- [ ] Hostname : `arr-server` — Domain : vide
- [ ] Root password + user normal (ex: `romain`) — noter dans credentials.md
- [ ] Partitionnement : guidé, tout l'espace virtio → `/` (ext4). Pas de RAID, pas de LVM.
- [ ] Miroir : France (deb.debian.org)
- [ ] Logiciels : cocher **SSH server** + **standard system utilities** uniquement

### Post-install
- [ ] `sudo apt install -y qemu-guest-agent && sudo systemctl enable --now qemu-guest-agent`
- [ ] Vérifier IP obtenue via console ou UI Proxmox → communiquer à l'agent + user SSH

---

## ════════════════════════════════════════════════
## ► TRANSFERT — L'AGENT PREND LA MAIN ICI
## ════════════════════════════════════════════════
> Dès que SSH sur la VM est accessible, toutes les phases suivantes sont exécutées par l'agent.
> L'utilisateur n'a plus besoin d'intervenir sauf pour l'action routeur (réservation DHCP Freebox).

---

## Phase 1 — Audit VM (AGENT via SSH)

- [ ] `hostnamectl` — confirmer **on est bien dans la VM `arr-server`** (pas sur l'hôte Proxmox)
- [ ] `lscpu` + `free -h` — 4 vCPU / 8 GB OK ?
- [ ] `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT` — disque virtio unique visible ?
- [ ] `df -h` + `findmnt /` — points de montage
- [ ] `systemctl status qemu-guest-agent` — actif ?
- [ ] `ip a` + `ip link` — interface réseau + **MAC virtuelle** (pour Phase 2)
- [ ] Pas de `smartctl`, pas de `ls /dev/dri` — inapplicables sur VM sans passthrough

---

## Phase 2 — Réseau (AGENT + action routeur utilisateur)
- [ ] L'agent communique la MAC virtuelle (depuis `ip link` ou config VM Proxmox)
- [ ] **Utilisateur → Freebox** :
  - Paramètres Freebox → Réseau local → DHCP → onglet **Baux Statiques**
  - Cliquer **"+ Ajouter un bail DHCP Statique"**
  - Adresse MAC : *(valeur donnée par l'agent)*
  - Adresse IP : `192.168.1.200`
  - Commentaire : `arr-server`
  - Sauvegarder
  - *(Plage dynamique déjà réduite à 192.168.1.199)*
- [ ] `sudo hostnamectl set-hostname arr-server` (si pas fait à l'install)
- [ ] Reboot VM : `sudo reboot`
- [ ] Vérifier IP fixe : `ip a` → 192.168.1.200
- [ ] Vérifier accès depuis un autre appareil LAN : `ping 192.168.1.200`

---

## Phase 3 — Stockage VM (AGENT)
> Pas de RAID, pas de mdadm — le RAID est géré par l'hôte Proxmox (ZFS ou LVM-thin).
> Disque virtio unique → `/data` et `/docker/appdata` sont de simples répertoires sur `/`.

- [ ] Vérifier que `/` a assez d'espace : `df -h /`
- [ ] Créer la structure `/data` :
  ```bash
  sudo mkdir -p /data/{torrents/{tv,movies,music},media/{tv,movies,music},personal/{photos,phone-camera,videos,documents,shared}}
  ```
- [ ] Créer `/docker/appdata` : `sudo mkdir -p /docker/appdata`
- [ ] Appliquer permissions : `sudo chown -R 1000:1000 /data /docker/appdata`
- [ ] **Vérifier hardlinks compatibles** : `stat -c '%m' /data/torrents /data/media` → même mountpoint

> Option future : si besoin d'isoler `/data` sur un second disque virtio, voir `docs/proxmox-storage-guide.md`. Dans ce cas, `/data/torrents` et `/data/media` DOIVENT rester sur le même FS.

---

## Phase 4 — Docker + appdata (AGENT)
- [ ] Installer Docker Engine (méthode officielle Debian) :
  ```bash
  sudo apt install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" | sudo tee /etc/apt/sources.list.d/docker.list
  sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  ```
- [ ] Ajouter l'utilisateur au groupe docker : `sudo usermod -aG docker $USER`
- [ ] Vérifier : `docker run hello-world`
- [ ] Cloner ou copier le repo sur la VM
- [ ] Créer .env : `cp .env.example .env`
- [ ] Remplir .env avec valeurs réelles (PUID, PGID via `id`, SERVER_IP=192.168.1.200, etc.)
- [ ] Créer les dossiers Immich photos : `sudo mkdir -p /data/photos/{library,upload}`
  > Note: `install.sh` crée ces répertoires automatiquement s'il est fourni

---

## Phase 5 — Déploiement stack Docker (AGENT)
- [ ] `docker compose config` — valider la config (ARR stack)
- [ ] `docker compose -f docker-compose.immich.yml config` — valider la config (Immich stack)
- [ ] Vérifier ports libres : `ss -tlnp`
- [ ] `make up` — lancer les deux stacks (ARR + Immich)
- [ ] `sudo docker compose ps` — tous les conteneurs ARR Up ?
- [ ] `sudo docker compose -f docker-compose.immich.yml ps` — tous les conteneurs Immich Up ?
- [ ] `make logs-arr` et `make logs-immich` — erreurs critiques ?

---

## Phase 6 — Samba (AGENT)
- [ ] `sudo apt install -y samba smbclient`
- [ ] Configurer /etc/samba/smb.conf :
  ```ini
  [personal]
  path = /data/personal
  browseable = yes
  writable = yes
  valid users = <username>

  [media]
  path = /data/media
  browseable = yes
  read only = yes
  ```
- [ ] Créer user Samba : `sudo smbpasswd -a <username>`
- [ ] `testparm` — config valide ?
- [ ] `sudo systemctl enable --now smbd`
- [ ] Tester depuis un autre appareil : `\\192.168.1.200\personal`

---

## Phase 7 — Configuration et validation services (AGENT)

> Guide détaillé par service : `CONFIG-SERVICES.md` (racine du projet)

### Ordre de configuration recommandé
0. Gluetun (vérification VPN)
1. qBittorrent
2. Prowlarr
3. Radarr
4. Sonarr
5. Lidarr
6. Bazarr
7. Jellyfin
8. Syncthing
9. FlareSolverr
10. Jellyseerr
11. Immich
12. Tailscale

### 0. Gluetun — Vérification VPN
- [ ] `docker exec gluetun curl -s ifconfig.me` → doit retourner une IP ProtonVPN (pas 192.168.x.x)
- [ ] `docker exec qbittorrent curl -s ifconfig.me` → même IP que Gluetun
  > Si l'une ou l'autre échoue, vérifier `WIREGUARD_PRIVATE_KEY` dans `.env`

### qBittorrent (8080)
- [ ] `docker logs qbittorrent` — récupérer le mot de passe temporaire
- [ ] Changer user/password : `Tools → Options → WebUI`
- [ ] Créer catégories EN PREMIER (panneau gauche → Categories → All → clic droit) : `movies`, `tv`, `music`
- [ ] `Tools → Options → Downloads` : mode Automatic, Relocate on category change, Default Save Path `/data/torrents`

### Prowlarr (9696)
- [ ] Définir authentification (Form)
- [ ] Ajouter download client qBittorrent : host `qbittorrent`, port `8080`, SSL désactivé
- [ ] Ajouter indexeurs

### Radarr (7878)
- [ ] Définir authentification (Form)
- [ ] Root folder : `/data/media/movies`
- [ ] **Activer hardlinks** : Settings → Media Management → Show Advanced → Use Hardlinks instead of Copy ✅
- [ ] Ajouter download client qBittorrent — catégorie : `movies`
- [ ] Copier API key → Prowlarr → Apps → Radarr (servers : `http://prowlarr:9696` / `http://radarr:7878`)

### Sonarr (8989)
- [ ] Définir authentification (Form)
- [ ] Root folder : `/data/media/tv`
- [ ] **Activer hardlinks** : Settings → Media Management → Show Advanced → Use Hardlinks instead of Copy ✅
- [ ] Ajouter download client qBittorrent — catégorie : `tv` (pas `tv-sonarr`)
- [ ] Copier API key → Prowlarr → Apps → Sonarr (servers : `http://prowlarr:9696` / `http://sonarr:8989`)

### Lidarr (8686)
- [ ] Définir authentification (Form)
- [ ] Root folder : `/data/media/music`
- [ ] Ajouter download client qBittorrent — catégorie : `music` (pas `lidarr`)
- [ ] Copier API key → Prowlarr → Apps → Lidarr (servers : `http://prowlarr:9696` / `http://lidarr:8686`)

### Bazarr (6767)
- [ ] Définir authentification (Form)
- [ ] Créer profil de langue (Français ou FR+EN)
- [ ] Ajouter providers (OpenSubtitles, etc.)
- [ ] Connecter Radarr (`radarr:7878` + API key) et Sonarr (`sonarr:8989` + API key)

### Jellyfin (8096)
- [ ] Créer compte admin au premier accès
- [ ] Ajouter bibliothèques : Movies → `/data/media/movies`, Shows → `/data/media/tv`, Music → `/data/media/music`
- [ ] **Transcodage hardware désactivé** en Phase 1 (pas de passthrough GPU)
- [ ] **Activer DLNA** : Dashboard → Plugins (ou Networking → DLNA selon version) → activer le serveur DLNA pour le Freebox Player
- [ ] Priorité direct-play : la Freebox Player (Ultra) décode H.264/H.265/AAC nativement — aucun transcode requis
- [ ] Clients alternatifs compatibles H.265 direct-play : app Jellyfin Android TV, Jellyfin Media Player (desktop), Infuse (Apple TV)
- [ ] Passthrough GTX 1060 / NVENC = option future documentée dans `docs/gpu-passthrough-guide.md` (non activée)

### Syncthing (8384)
- [ ] Définir user/password (Settings → GUI)
- [ ] Ajouter dossiers `/data/personal/*` + lier aux appareils

### 9. FlareSolverr — Configuration via Prowlarr
- [ ] Dans Prowlarr : `Settings → Indexers → + (Indexer Proxies)`
- [ ] Name: `FlareSolverr`, Host: `http://flaresolverr:8191`, Tags: `cloudflare`
- [ ] Test → ✅ → Save
- [ ] Appliquer le tag `cloudflare` aux indexeurs bloqués par Cloudflare

### 10. Jellyseerr (5055) — Demandes media
- [ ] Premier accès : `http://192.168.1.200:5055`
- [ ] Sign In with Jellyfin
- [ ] Jellyfin URL: `http://jellyfin:8096`, user/password: admin Jellyfin
- [ ] Import users depuis Jellyfin
- [ ] Configurer notifications optionnelles (Email/Discord)

### 11. Immich (2283) — Photos famille
- [ ] Premier accès : `http://192.168.1.200:2283`
- [ ] Créer compte admin (email + mot de passe)
- [ ] `Administration → Users → Create User` → comptes parent + enfant
  > Max 3 utilisateurs (admin + parent + enfant)
- [ ] `Administration → Machine Learning` → Facial Recognition: Enabled ✅
- [ ] Lancer face detection : `Jobs → Face Detection → All`
- [ ] Configurer app mobile : scanner QR code depuis Settings → Account

### Samba
- [ ] Partages accessibles depuis LAN : `\\192.168.1.200\personal` et `\\192.168.1.200\media`

### 12. Tailscale — Accès distant
- [ ] `sudo apt install tailscale`
- [ ] `sudo tailscale up` → suivre le lien d'authentification
- [ ] `tailscale status` → noter l'IP 100.x.x.x assignée
- [ ] Vérifier accès distance : `http://100.x.x.x:8096` (Jellyfin), etc.
- [ ] Voir `tailscale-guide.md` pour détails

### Vérifications finales
- [ ] DNS conteneurs : `docker exec -it radarr cat /etc/resolv.conf` → doit afficher 1.1.1.1
- [ ] Gluetun VPN : `docker exec gluetun curl -s ifconfig.me` → IP ProtonVPN (pas 192.168.x.x)
- [ ] Hardlinks : comparer inodes `ls -i /data/media/movies/<film>` vs `ls -i /data/torrents/movies/<film>` — doivent être identiques
- [ ] Immich : face recognition activée et scan initial lancé
- [ ] Backup applicatif — `./backup-arr-stack.sh /tmp/test-backup` + vérifier sortie
- [ ] Backup VM — vérifier snapshot/backup Proxmox configuré (Datacenter → Backup, voir `docs/proxmox-backup-guide.md`)

---

## Phase 8 — Documentation finale (AGENT)
- [ ] JOURNAL.md — décisions prises, VMID Proxmox, storage utilisé, valeurs réelles
- [ ] credentials.md — MAC virtuelle, IP confirmée, users, passwords Samba, API keys, VMID
- [ ] REALISE.md — phases terminées archivées
- [ ] TODO_SESSION.md — tâches terminées retirées

---

## Rappels sécurité

- **Toujours `hostnamectl` avant toute commande destructive** — confirmer qu'on est dans la VM et pas sur l'hôte Proxmox
- **Actions côté hôte Proxmox** (snapshots, suppression VM, passthrough GPU, modif bridge) : demander confirmation utilisateur explicite
- **RAID ≠ Backup** — Proxmox Backup Server (ou snapshot local) + `backup-arr-stack.sh` = deux niveaux complémentaires
- **Tailscale en dernier** — stabiliser LAN d'abord
- **Passthrough GPU** — n'activer que si besoin transcode réel avéré (voir `docs/gpu-passthrough-guide.md`)
