# TODO_SESSION.md — ARR Stack

> Convention : ce fichier ne contient QUE des tâches non terminées [ ].
> Dernière mise à jour : 2026-04-16

---

## Phase 0 — Complété ✅
## Phase 0.5 — Hardware confirmé ✅

---

## ► UTILISATEUR — Installation Debian 12 (actions manuelles)

- [ ] Télécharger ISO Debian 12 netinst amd64 sur debian.org
- [ ] Créer clé USB bootable avec Rufus (Image mode)
- [ ] Installer Debian 12 sur le Lenovo :
  - Hostname : `arr-server`
  - Cocher **SSH server** + standard utilities uniquement (pas de desktop)
  - Partitionnement manuel : SSD → `/` complet, HDDs → laisser non partitionnés
- [ ] Premier boot réussi
- [ ] Récupérer l'IP actuelle (`ip a` sur la machine ou via le routeur)
- [ ] **Donner à l'agent : IP actuelle + nom d'utilisateur**

---

## ════════════ TRANSFERT — L'AGENT PREND LA MAIN ════════════

---

## Phase 1 — Audit machine (AGENT via SSH)

- [ ] `hostnamectl` — OS, version, hostname
- [ ] `lscpu` + `free -h` — CPU, RAM
- [ ] `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL` — inventaire disques
- [ ] `sudo fdisk -l` — tables de partition
- [ ] `df -h` + `cat /etc/fstab` — montages actuels
- [ ] `blkid` — UUIDs
- [ ] SMART sur tous les disques (apt install smartmontools si absent)
- [ ] `ls /dev/dri` — QuickSync disponible ?
- [ ] `ip a` + `ip link` — MAC adresse interface principale
- [ ] Docker déjà installé ?

---

## Phase 2 — Réseau (AGENT + action routeur utilisateur)

- [ ] Communiquer MAC → utilisateur configure réservation DHCP (MAC → 192.168.1.200)
- [ ] `sudo hostnamectl set-hostname arr-server` si besoin
- [ ] Vérifier IP fixe 192.168.1.200 active

---

## Phase 3 — Stockage RAID1 (AGENT)

- [ ] SMART OK sur les 2 HDDs ?
- [ ] Identifier /dev/sdX et /dev/sdY (HDDs) sans ambiguïté
- [ ] `sudo apt install -y mdadm`
- [ ] Créer RAID1 `/dev/md0`
- [ ] `mkfs.ext4 /dev/md0`
- [ ] Monter /data + persister fstab (UUID) + update-initramfs

---

## Phase 4 — Docker + appdata (AGENT)

- [ ] Installer Docker Engine (méthode officielle Debian)
- [ ] `docker run hello-world` — OK ?
- [ ] Créer /docker/appdata + structure /data complète
- [ ] `chown -R 1000:1000 /data /docker/appdata`
- [ ] Créer .env depuis .env.example + remplir valeurs réelles

---

## Phase 5 — Stack Docker (AGENT)

- [ ] `docker compose config` — valide ?
- [ ] `make up`
- [ ] `make ps` — tous Up ?
- [ ] `make logs` — pas d'erreurs critiques ?

---

## Phase 6 — Samba (AGENT)

- [ ] `sudo apt install -y samba smbclient`
- [ ] Configurer smb.conf (personal RW + media RO)
- [ ] `smbpasswd -a <user>` + `testparm` + `systemctl enable --now smbd`

---

## Phase 7 — Validation services (AGENT)

- [ ] qBittorrent (8080) + password temporaire
- [ ] Radarr (7878) + root folder
- [ ] Sonarr (8989) + root folder
- [ ] Lidarr (8686) + root folder
- [ ] Prowlarr (9696) + connexion ARR apps
- [ ] Bazarr (6767) + langues
- [ ] Jellyfin (8096) + bibliothèques
- [ ] Syncthing (8384) + dossiers personal
- [ ] Samba — accessible depuis LAN
- [ ] Hardlinks — test inode
- [ ] Backup script — test `/tmp/test-backup`

---

## Phase 8 — Documentation (AGENT)

- [ ] JOURNAL.md + credentials.md + REALISE.md mis à jour
