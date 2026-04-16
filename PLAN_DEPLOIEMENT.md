# PLAN_DEPLOIEMENT.md — ARR Stack

Déploiement sur machine physique locale (Lenovo i5-6400, Debian 12 Bookworm).
Exécuter les phases dans l'ordre. Aucune action destructive sans audit préalable.

---

## Phase 0 — Analyse et mise à jour fichiers de suivi ✅
- [x] Lecture complète du dépôt (README, guides, docker-compose, .env.example, scripts)
- [x] Identification des manques et ambiguïtés
- [x] Mise à jour CLAUDE.md, credentials.md, FONCTIONNALITES.md, JOURNAL.md, PLAN_DEPLOIEMENT.md, TODO_SESSION.md
- [x] Choix OS : Debian 12 (Bookworm)
- [x] Confirmation HDDs à formater (pas de données à conserver)

---

## Phase 0.5 — État hardware confirmé ✅
- [x] Machine en cours de montage physique (Lenovo desktop i5-6400)
- [x] 2× HDDs 2TB WD Caviar Black (2010) — confirmés à formater, pas de données à conserver
- [ ] HDDs reconnus par le BIOS au premier boot

---

## ► PHASE UTILISATEUR — Installation Debian 12 (actions manuelles)
> L'utilisateur fait cette phase seul. L'agent prend le relais dès que SSH est accessible.

### Préparation ISO
- [ ] Télécharger l'ISO Debian 12 netinst amd64 sur debian.org
- [ ] Créer une clé USB bootable (Rufus sous Windows — Image mode, pas ISO mode)
- [ ] Brancher la clé USB + câble réseau filaire sur le Lenovo

### Installation Debian 12
- [ ] Booter sur la clé USB (F12 ou F2 au démarrage pour le boot menu)
- [ ] Choisir **"Install"** (pas graphical install — plus simple)
- [ ] Langue : English (évite les problèmes d'encodage serveur)
- [ ] Localisation : France / Europe/Paris
- [ ] Clavier : French (AZERTY) ou selon préférence
- [ ] Hostname : **arr-server**
- [ ] Domain name : laisser vide
- [ ] Root password : choisir un mot de passe fort — noter dans credentials.md
- [ ] Créer un utilisateur normal (ex: `romain`) — noter dans credentials.md
- [ ] Partitionnement : **manuel**
  - Identifier le SSD → tout l'espace pour `/` (ext4)
  - Laisser les 2 HDDs **non partitionnés** — l'agent s'en occupera (RAID1)
- [ ] Miroir : choisir un miroir France (deb.debian.org)
- [ ] Logiciels à installer : cocher **SSH server** + **standard system utilities** uniquement
  - Décocher tout le reste (pas de desktop, pas d'interface graphique)

### Après le premier boot
- [ ] Récupérer l'IP actuelle de la machine : `ip a` (ou voir dans le routeur)
- [ ] Vérifier que SSH répond : `ssh utilisateur@<ip-actuelle>`
- [ ] Communiquer à l'agent : **IP actuelle + nom d'utilisateur**

---

## ════════════════════════════════════════════════
## ► TRANSFERT — L'AGENT PREND LA MAIN ICI
## ════════════════════════════════════════════════
> Dès que SSH est accessible, toutes les phases suivantes sont exécutées par l'agent.
> L'utilisateur n'a plus besoin d'intervenir sauf pour les actions sur le routeur (réservation DHCP).

---

## Phase 1 — Audit machine réelle (AGENT via SSH)
> OS cible : **Debian 12 (Bookworm)** — décision prise.

- [ ] `hostnamectl` — vérifier OS, version, hostname
- [ ] `lscpu` + `free -h` — CPU, RAM
- [ ] `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL` — inventaire complet disques
- [ ] `sudo fdisk -l` — tables de partition
- [ ] `df -h` + `cat /etc/fstab` — montages actuels
- [ ] `blkid` — UUID des partitions
- [ ] `sudo apt install -y smartmontools` — installer smartctl si absent
- [ ] `sudo smartctl -a /dev/sda` + `/dev/sdb` + `/dev/sdc` — SMART sur tous les disques
- [ ] `ls /dev/dri` — vérifier QuickSync Intel disponible
- [ ] `ip a` + `ip link` — interfaces réseau + noter adresse MAC
- [ ] `docker --version` 2>/dev/null — Docker déjà présent ?
- [ ] Résumé : identifier SSD / HDD1 / HDD2 sans ambiguïté, santé SMART, plan toujours valide

---

## Phase 2 — Réseau (AGENT + action routeur utilisateur)
- [ ] Communiquer la MAC adresse à l'utilisateur → réservation DHCP sur le routeur : MAC → **192.168.1.200**
- [ ] `sudo hostnamectl set-hostname arr-server` (si pas fait à l'install)
- [ ] Après réservation DHCP : reboot ou `sudo dhclient -r && sudo dhclient`
- [ ] Vérifier IP fixe : `ip a` → 192.168.1.200
- [ ] Vérifier accès depuis un autre appareil LAN : `ping 192.168.1.200`

---

## Phase 3 — Préparation stockage (AGENT)
> HDDs confirmés à formater. SMART vérifié Phase 1 avant toute écriture.

- [ ] Confirmer résultats SMART — les deux drives sont exploitables ?
- [ ] Identifier sans ambiguïté /dev/sdX et /dev/sdY (HDDs) vs /dev/sdZ (SSD)

### Chemin A — RAID1 *(chemin par défaut si les deux drives sont sains)*
- [ ] `sudo apt install -y mdadm`
- [ ] Créer le RAID1 : `sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdX /dev/sdY`
- [ ] `sudo mkfs.ext4 /dev/md0`
- [ ] `sudo mkdir -p /data`
- [ ] `sudo mount /dev/md0 /data`
- [ ] Persister dans /etc/fstab via UUID : `sudo blkid /dev/md0`
- [ ] Vérifier état RAID : `cat /proc/mdstat`
- [ ] Sauvegarder config : `sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf`
- [ ] `sudo update-initramfs -u`

### Chemin B — Disque seul *(si un HDD échoue au SMART)*
- [ ] Documenter pourquoi RAID différé dans JOURNAL.md
- [ ] Préparer le disque sain seul : `mkfs.ext4 /dev/sdX`
- [ ] Monter sur /data + persister fstab
- [ ] Garder migration RAID documentée pour plus tard

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
- [ ] Créer /docker/appdata : `sudo mkdir -p /docker/appdata`
- [ ] Créer structure /data complète :
  ```bash
  sudo mkdir -p /data/{torrents/{tv,movies,music},media/{tv,movies,music},personal/{photos,phone-camera,videos,documents,shared}}
  ```
- [ ] Appliquer permissions : `sudo chown -R 1000:1000 /data /docker/appdata`
- [ ] Cloner ou copier le repo sur le serveur
- [ ] Créer .env : `cp .env.example .env`
- [ ] Remplir .env avec valeurs réelles (PUID, PGID via `id`, SERVER_IP=192.168.1.200, etc.)

---

## Phase 5 — Déploiement stack Docker (AGENT)
- [ ] `docker compose config` — valider la config
- [ ] Vérifier ports libres : `ss -tlnp`
- [ ] Vérifier /dev/dri présent (sinon adapter le compose pour Jellyfin)
- [ ] `make up` — lancer la stack
- [ ] `make ps` — tous les conteneurs Up ?
- [ ] `make logs` — erreurs critiques ?

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

## Phase 7 — Validation post-déploiement (AGENT)
- [ ] qBittorrent (8080) — accès UI + récupérer password : `docker logs qbittorrent`
- [ ] Radarr (7878) — accès UI + root folder `/data/media/movies`
- [ ] Sonarr (8989) — accès UI + root folder `/data/media/tv`
- [ ] Lidarr (8686) — accès UI + root folder `/data/media/music`
- [ ] Prowlarr (9696) — accès UI + connexion ARR apps via API keys
- [ ] Bazarr (6767) — accès UI + langues + providers
- [ ] Jellyfin (8096) — accès UI + bibliothèques créées
- [ ] Syncthing (8384) — accès UI + dossiers /data/personal configurés
- [ ] Samba — partages accessibles depuis LAN
- [ ] Hardlinks — vérifier même inode après un import test
- [ ] Backup — `./backup-arr-stack.sh /tmp/test-backup` + vérifier sortie

---

## Phase 8 — Documentation finale (AGENT)
- [ ] JOURNAL.md — décisions prises, chemin RAID choisi, valeurs réelles
- [ ] credentials.md — MAC, IP confirmée, users, passwords Samba, API keys
- [ ] REALISE.md — phases terminées archivées
- [ ] TODO_SESSION.md — tâches terminées retirées

---

## Rappels sécurité

- **Ne jamais formater un disque** sans avoir identifié clairement son /dev/sdX via lsblk + modèle
- **Ne jamais supposer** que /dev/sda est le SSD ou le bon disque
- **RAID ≠ Backup** — prévoir backup /docker/appdata séparé
- **Tailscale en dernier** — stabiliser LAN d'abord
- **Confirmer à l'utilisateur** avant toute commande mdadm ou mkfs
