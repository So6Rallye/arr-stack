# TODO_SESSION.md — ARR Stack

> Convention : ce fichier ne contient QUE des tâches non terminées [ ].
> Dernière mise à jour : 2026-04-17

---

## Phase 0 — Complété ✅
## Phase 0.5 — Hôte Proxmox vérifié ✅

---

## ► UTILISATEUR + AGENT — Phase 0.7 Provisioning VM Proxmox

- [ ] **Utilisateur → Proxmox UI** : upload ISO Debian 12 netinst amd64 dans le storage
- [ ] Choisir VMID libre (ex: `200`) et node (`rp-pve-01`)
- [ ] Créer la VM (`qm create` ou UI) :
  - 4 vCPU type `host`, 8 GB RAM (pas de ballooning agressif)
  - Disque virtio-scsi 500 GB (storage : ZFS ou LVM-thin selon config hôte)
  - Bridge `vmbr0`, NIC virtio — **noter la MAC générée**
  - qemu-guest-agent enabled, Start at boot = yes
  - **Pas de passthrough GPU** (GTX 1060 reste sur l'hôte)
- [ ] Installer Debian 12 dans la VM via console Proxmox (noVNC/SPICE) :
  - Hostname `arr-server`, SSH server + standard utilities uniquement
  - Partitionnement guidé, tout en `/` ext4 (pas de RAID, pas de LVM)
- [ ] Post-install dans la VM : `sudo apt install -y qemu-guest-agent && sudo systemctl enable --now qemu-guest-agent`
- [ ] Récupérer l'IP obtenue + user SSH → **donner à l'agent**

---

## ════════════ TRANSFERT — L'AGENT PREND LA MAIN ════════════

---

## Phase 1 — Audit VM (AGENT via SSH)

- [ ] `hostnamectl` — confirmer qu'on est bien dans la VM `arr-server`
- [ ] `lscpu` + `free -h` — 4 vCPU / 8 GB OK ?
- [ ] `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT` — disque virtio visible ?
- [ ] `df -h` + `findmnt /` — montages actuels
- [ ] `systemctl status qemu-guest-agent`
- [ ] `ip a` + `ip link` — MAC virtuelle de l'interface principale

---

## Phase 2 — Réseau (AGENT + action routeur utilisateur)

- [ ] Agent fournit MAC virtuelle (`ip link show <interface>` ou config VM Proxmox)
- [ ] **Utilisateur → Freebox** : Paramètres → Réseau local → DHCP → **Baux Statiques** → Ajouter bail : MAC fournie / IP `192.168.1.200` / Commentaire `arr-server` → Sauvegarder *(plage dynamique déjà réduite à .199)*
- [ ] `sudo hostnamectl set-hostname arr-server` si besoin
- [ ] `sudo reboot` — vérifier IP fixe 192.168.1.200 active

---

## Phase 3 — Stockage VM (AGENT)

> Pas de RAID, pas de mdadm — géré par l'hôte Proxmox. Disque virtio unique.

- [ ] `df -h /` — espace suffisant ?
- [ ] Créer structure `/data` complète + `/docker/appdata`
- [ ] `sudo chown -R 1000:1000 /data /docker/appdata`
- [ ] `stat -c '%m' /data/torrents /data/media` — même mountpoint (hardlinks OK) ?

---

## Phase 4 — Docker + appdata (AGENT)

- [ ] Installer Docker Engine (méthode officielle Debian)
- [ ] `docker run hello-world` — OK ?
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

## Phase 7 — Configuration services (AGENT)

> Détail complet : `CONFIG-SERVICES.md`

- [ ] qBittorrent — password logs → catégories (movies/tv/music) EN PREMIER → Downloads : mode Automatic + Default Save Path `/data/torrents`
- [ ] Prowlarr — auth + download client qBittorrent (host `qbittorrent`) + indexeurs
- [ ] Radarr — auth + root folder `/data/media/movies` + **hardlinks activés** + DL client (cat `movies`) + API key → Prowlarr
- [ ] Sonarr — auth + root folder `/data/media/tv` + **hardlinks activés** + DL client (cat `tv`) + API key → Prowlarr
- [ ] Lidarr — auth + root folder `/data/media/music` + DL client (cat `music`) + API key → Prowlarr
- [ ] Bazarr — auth + profil langue + providers + connexion Radarr/Sonarr
- [ ] Jellyfin — compte admin + bibliothèques + **DLNA activé** pour Freebox Player (transcode HW désactivé en Phase 1)
- [ ] Syncthing — auth + dossiers `/data/personal`
- [ ] Samba — partages accessibles depuis LAN (`\\192.168.1.200\personal`, `\\192.168.1.200\media`)
- [ ] DNS conteneurs : `docker exec -it radarr cat /etc/resolv.conf` → 1.1.1.1
- [ ] Hardlinks — comparer inodes `/data/media/movies/<film>` vs `/data/torrents/movies/<film>`
- [ ] Backup applicatif — test `./backup-arr-stack.sh /tmp/test-backup`
- [ ] Backup VM — snapshot/backup Proxmox configuré (Datacenter → Backup)

---

## Phase 8 — Documentation (AGENT)

- [ ] JOURNAL.md + credentials.md + REALISE.md mis à jour (VMID, storage, MAC virtuelle, IP, API keys)
