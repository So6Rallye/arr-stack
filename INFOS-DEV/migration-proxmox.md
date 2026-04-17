# Migration arr-stack — Lenovo physique → VM Proxmox

## Contexte

Le projet `arr-stack` était initialement prévu pour un déploiement sur un **Lenovo desktop recyclé (Intel i5-6400, 2× HDDs 2TB WD 2010)** avec une installation Debian 12 bare-metal, RAID1 logiciel (mdadm), et transcodage Intel QuickSync.

L'utilisateur dispose en réalité déjà d'un **serveur Proxmox VE 8.0.9 en production** (`rp-pve-01`, Ryzen 3700x, 62 GiB ECC RAM, 1.52 TiB storage, GTX 1060 6GB). Recycler le Lenovo n'apporte aucune valeur : le Proxmox est plus puissant, plus fiable (RAM ECC, RAID déjà géré par l'hôte), déjà en service, et déjà intégré au réseau.

**Décision** : déployer `arr-server` comme VM Debian 12 sur Proxmox. Tous les fichiers du projet (30+) doivent être adaptés pour refléter ce changement.

**Conséquences techniques majeures** :
- Suppression complète de la gestion RAID côté VM (l'hôte Proxmox le gère déjà)
- Suppression de toutes les optimisations Intel (iGPU, QuickSync, VAAPI, `/dev/dri`)
- Stratégie Phase 1 = **direct-play pur via DLNA Jellyfin → Freebox Player** (client principal décode H.265 nativement, zéro transcode). Passthrough GTX 1060 NVENC **documenté pour le futur**, non activé, non prioritaire.
- Ajout d'une phase de provisioning VM Proxmox amont
- Samba conservé dans la VM (décision utilisateur)

**Ressources VM arrêtées** : 4 vCPU / 8 GB RAM / 500 GB disque.

---

## Décisions validées par l'utilisateur

| Point | Décision |
|---|---|
| Cible déploiement | VM Debian 12 sur Proxmox `rp-pve-01` |
| Ressources VM | 4 vCPU / 8 GB RAM / 500 GB disque |
| Gestion RAID | **Supprimée de la VM** — Proxmox host s'en charge |
| Samba | **Conservé dans la VM** |
| Optimisations Intel | **Supprimées** (inapplicables sur Ryzen 3700x) |
| Transcode Jellyfin Phase 1 | **Direct-play pur, pas de passthrough GPU** |
| GTX 1060 | **Reste sur l'hôte Proxmox** (console physique pour maintenance — Ryzen 3700x sans iGPU) |
| Passthrough GTX 1060 | **Option future, non bloquante** — documenté mais pas activé initialement |
| Guides hardware obsolètes | **Remplacés** par guides Proxmox |

**Justification de la décision transcode** :
1. **Client principal = Freebox Player (Freebox Ultra)** — supporte H.265 nativement en hardware décodage. Accès à Jellyfin via **DLNA** (serveur intégré Jellyfin) ou app Android TV native. Direct-play end-to-end, zéro transcode.
2. **GTX 1060 sert actuellement de sortie console physique de l'hôte Proxmox** (3700x sans iGPU). La passer en passthrough prive l'hôte de toute sortie vidéo (admin web UI OK, mais plus de débogage boot/kernel panic/réseau down).
3. **Ratio complexité/bénéfice défavorable** : aucun besoin de transcode identifié + perte console physique + complexité vfio/drivers. Opération 100% réversible si un besoin réel émerge.

**Note** : la bibliothèque peut rester en H.265 (gain ~50% stockage vs H.264) sans pénalité puisque le client principal le décode nativement.

---

## Fichiers à modifier — cartographie complète

### 1. CLAUDE.md (contexte agents)

**Fichier** : [arr-stack/CLAUDE.md](../CLAUDE.md)

- Ligne 5 : remplacer "vieux Lenovo desktop (Intel i5-6400)" par "VM Debian 12 sur Proxmox `rp-pve-01` (Ryzen 3700x)"
- Lignes 37-48 : retirer "RAID1 cible" du schéma stockage, remplacer par "disque virtuel unique 500 GB (RAID géré par l'hôte Proxmox)"
- Lignes 47-48 : **garder** la règle critique hardlinks (toujours valable : /data/torrents et /data/media sur le même FS = même disque virtuel)
- Lignes 61-68 : réécrire entièrement "Hardware cible" :
  - Hôte : Proxmox VE 8.0.9 (`rp-pve-01`, Ryzen 3700x, 62 GiB ECC)
  - VM : 4 vCPU / 8 GB RAM / 500 GB virtio
  - GPU : **pas de passthrough** en Phase 1. GTX 1060 6GB reste sur l'hôte Proxmox (sortie console physique — Ryzen 3700x sans iGPU). Passthrough mentionné uniquement comme option future non-prioritaire.
  - Supprimer toutes les refs Intel/iGPU/QuickSync/HD 530
- Lignes 81-90 : retirer "Création ou destruction d'un RAID" (plus applicable côté VM)
- Lignes 92-94 : adapter les "ne jamais supposer" (retirer la mention HDDs physiques, ajouter "ne jamais supposer que le GPU passthrough est configuré sans vérification sur l'hôte")

### 2. PLAN_DEPLOIEMENT.md (roadmap de déploiement)

**Fichier** : [arr-stack/PLAN_DEPLOIEMENT.md](../PLAN_DEPLOIEMENT.md)

Refonte structurelle complète. Nouveau séquencement :

- **Phase 0** : inchangée (analyse)
- **Phase 0.5** : remplacer "État hardware Lenovo" par "État hôte Proxmox" (vérifier RAM/CPU/storage disponibles, vérifier dispo GTX 1060)
- **Nouvelle Phase 0.7 — Provisioning VM Proxmox** (remplace la PHASE UTILISATEUR d'install Debian physique) :
  - Upload ISO Debian 12 netinst dans le storage Proxmox
  - Créer VM via `qm create` ou UI : ID libre, 4 vCPU, 8 GB RAM, disque virtio 500 GB, bridge `vmbr0`, MAC stable
  - **Pas de passthrough GPU** en Phase 1 (la 1060 reste sur l'hôte pour console physique)
  - Installer Debian 12 dans la VM (même procédure, mais via console Proxmox, pas clé USB)
  - Activer `qemu-guest-agent` dans la VM
- **Phase 1 — Audit VM** : retirer `ls /dev/dri` (sauf si passthrough GPU), retirer les commandes SMART (inutiles sur disque virtuel), garder `hostnamectl`, `lscpu`, `lsblk`, `free -h`
- **Phase 2 — Réseau** : inchangée sur le fond (réservation DHCP Freebox + IP 192.168.1.200), mais préciser que la MAC vient de la config VM Proxmox (pas d'une carte réseau physique)
- **Phase 3 — Stockage** : **supprimer intégralement les Chemins A (RAID1) et B (disque seul)**. Remplacer par :
  - Partitionner le disque virtuel 500 GB au montage Debian (tout en `/` ou `/` + `/data` séparé)
  - Créer `/data` et `/docker/appdata` comme simples répertoires
  - **Aucune commande mdadm, mkfs.ext4 sur /dev/sdX, ou /etc/mdadm/mdadm.conf**
- **Phase 4** : inchangée (Docker install)
- **Phase 5** : retirer la vérif `ls /dev/dri` du pré-flight (conditionnelle GPU)
- **Phase 6 — Samba** : inchangée
- **Phase 7 — Jellyfin** (ligne 222) : remplacer "Hardware acceleration : Intel QuickSync (QSV)" par :
  - **Transcode hardware désactivé en Phase 1** (pas de passthrough GPU)
  - **Activer DLNA server** dans Jellyfin (Dashboard → Plugins → DLNA ou Dashboard → Networking → DLNA) pour le Freebox Player
  - Priorité direct-play : codecs source H.264/H.265/AAC lus nativement par le Freebox Player
  - Documenter clients alternatifs compatibles H.265 : app Jellyfin Android TV, Jellyfin Media Player (desktop), Infuse (Apple TV)
  - NVENC documenté en option future (voir `gpu-passthrough-guide.md`) si besoin émerge
- **Phase 8** : inchangée

### 3. docker-compose.yml

**Fichier** : [arr-stack/docker-compose.yml](../docker-compose.yml)

- Lignes 125-126 (service Jellyfin) : retirer le mapping `/dev/dri:/dev/dri` par défaut. Le remplacer par un bloc commenté documentant les **deux** options :
  ```yaml
  # Hardware transcode — décommenter UNE SEULE option selon le setup :
  #
  # Option A — NVIDIA GPU passthrough (ex: GTX 1060) :
  # runtime: nvidia
  # environment:
  #   - NVIDIA_VISIBLE_DEVICES=all
  # deploy:
  #   resources:
  #     reservations:
  #       devices:
  #         - driver: nvidia
  #           count: 1
  #           capabilities: [gpu]
  #
  # Option B — Intel QuickSync (non applicable sur Proxmox Ryzen, pour doc) :
  # devices:
  #   - /dev/dri:/dev/dri
  ```
- Vérifier qu'aucun autre mapping `/dev/dri` ne subsiste

### 4. .env.example

**Fichier** : [arr-stack/.env.example](../.env.example)

- Retirer ou commenter toute variable liée à Intel QuickSync
- Ajouter (commenté par défaut) les variables GPU NVIDIA si présentes dans le template

### 5. Scripts shell

**install.sh** ([arr-stack/install.sh](../install.sh)) :
- Lignes 32-37 : retirer la vérification/mount mdadm, garder uniquement la vérif que `/data` existe et est montable
- Garder le sourcing `.env` et la création `BACKUP_DEST`

**backup-arr-stack.sh** ([arr-stack/backup-arr-stack.sh](../backup-arr-stack.sh)) :
- Lignes 18-20 : retirer la sauvegarde de `/etc/mdadm/mdadm.conf` (n'existe plus)
- Garder la sauvegarde de `/etc/fstab`
- **Ajouter** une note : les snapshots/backup de la VM elle-même sont gérés côté Proxmox (Datacenter → Backup)

### 6. README.md

**Fichier** : [arr-stack/README.md](../README.md)

- Ligne 5 : actualiser l'intro (home server → VM Proxmox)
- Ligne 22 : idem
- Lignes 37-40 : mettre à jour la section hardware
- Lignes 364-426 : section RAID — **réécrire** en "Stockage VM Proxmox" (simple disque virtio, RAID géré par l'hôte, mention ZFS/LVM-thin si pertinent selon config Proxmox utilisateur)
- Lignes 459-510 : section QuickSync — **réécrire** en "Transcode Jellyfin" avec stratégie direct-play + NVENC passthrough optionnel
- Nettoyer toute référence au Lenovo i5-6400

### 7. CONFIG-SERVICES.md

**Fichier** : [arr-stack/CONFIG-SERVICES.md](../CONFIG-SERVICES.md)

- Lignes 4-5 : mettre à jour le contexte de déploiement (VM Proxmox)
- Lignes 242-247 : remplacer les instructions QuickSync par :
  - **Activation DLNA Jellyfin** pour le Freebox Player (étapes UI exactes)
  - Stratégie direct-play : codecs recommandés (H.264/H.265/AAC), clients validés (Freebox Player Ultra, Jellyfin Android TV, Jellyfin Media Player, Infuse)
  - Transcodage désactivé par défaut — activer uniquement si client incompatible identifié
  - Référence croisée vers `gpu-passthrough-guide.md` en option future

### 8. Guides matériels (remplacements complets)

**À supprimer / remplacer** :
- [arr-stack/docs/hardware-raid-guide.md](../docs/hardware-raid-guide.md) → remplacer par **`arr-stack/docs/proxmox-vm-guide.md`** (provisioning VM, passthrough GPU, qemu-guest-agent, snapshots)
- [arr-stack/docs/upgrade-disks-guide.md](../docs/upgrade-disks-guide.md) → remplacer par **`arr-stack/docs/proxmox-storage-guide.md`** (agrandir le disque virtio à chaud, migrer vers un autre storage, ajouter un 2ème disque virtio pour `/data` séparé)
- [arr-stack/docs/smart-monitor-guide.md](../docs/smart-monitor-guide.md) → supprimer (disque virtuel, pas de SMART côté guest) ou réécrire en pointant vers le monitoring Proxmox (S.M.A.R.T. hôte via UI Proxmox)

**À ajouter** :
- **`arr-stack/docs/proxmox-backup-guide.md`** : configuration des snapshots / backups VM via Proxmox Backup Server ou stockage local, complémentaire au `backup-arr-stack.sh` (niveau applicatif)
- **`arr-stack/docs/gpu-passthrough-guide.md`** : procédure complète passthrough GTX 1060 documentée **en option future** (IOMMU, vfio, driver NVIDIA dans la VM, nvidia-container-toolkit, test Jellyfin). **Inclure un avertissement en tête** : "activer ce guide prive l'hôte Proxmox de sa seule sortie vidéo — n'exécuter que si un besoin transcode réel est avéré ET que l'admin via web UI est considérée comme suffisante".

### 9. network-guide.md

**Fichier** : [arr-stack/docs/network-guide.md](../docs/network-guide.md)

- Ajouter une section sur la config du bridge Proxmox (`vmbr0`) côté hôte pour que la VM soit visible sur le LAN 192.168.1.0/24
- Clarifier que la MAC utilisée pour le bail DHCP Freebox est celle de la carte virtuelle de la VM (éditable dans la config VM Proxmox)

### 10. JOURNAL.md

**Fichier** : [arr-stack/JOURNAL.md](../JOURNAL.md) (chronologique ascendant — ajout en bas)

Ajouter les lignes 2026-04-17 suivantes :

```
| 2026-04-17 | Migration cible déploiement : Lenovo i5-6400 physique → VM Debian 12 sur Proxmox rp-pve-01 (Ryzen 3700x, 62 GiB ECC). Motif : Proxmox déjà en prod, plus puissant, ECC, RAID géré par l'hôte. Lenovo abandonné. |
| 2026-04-17 | Ressources VM arrêtées : 4 vCPU / 8 GB RAM / 500 GB virtio disk. |
| 2026-04-17 | Gestion RAID supprimée côté VM — Proxmox host s'en charge. Suppression complète Phase 3 Chemins A/B, mdadm, mdadm.conf. Hardlinks toujours OK (même disque virtuel). |
| 2026-04-17 | Optimisations Intel retirées (iGPU HD 530, QuickSync, /dev/dri — inapplicables sur Ryzen 3700x). |
| 2026-04-17 | Stratégie transcode Jellyfin Phase 1 : **direct-play pur via DLNA Jellyfin → Freebox Player (Freebox Ultra)** qui décode H.265 nativement. Pas de passthrough GPU. GTX 1060 laissée sur l'hôte Proxmox pour console physique (Ryzen sans iGPU). Passthrough documenté comme option future réversible. Bibliothèque peut rester en H.265. |
| 2026-04-17 | Samba conservé dans la VM (pas d'externalisation). |
| 2026-04-17 | Guides docs/hardware-raid-guide.md et docs/upgrade-disks-guide.md supprimés, remplacés par proxmox-vm-guide.md + proxmox-storage-guide.md + proxmox-backup-guide.md + gpu-passthrough-guide.md (ce dernier documenté comme option future non activée). |
```

### 11. FONCTIONNALITES.md

**Fichier** : [arr-stack/FONCTIONNALITES.md](../FONCTIONNALITES.md)

- Retirer les items "RAID1 mdadm", "monitoring SMART HDDs", "Intel QuickSync"
- Ajouter "Snapshots VM Proxmox", "Stratégie direct-play prioritaire (Jellyfin)", "Passthrough GPU NVIDIA documenté en option future"

### 12. Fichiers de contexte `.brain/`

**Fichier** : [arr-stack/.brain/PROJECT_CONTEXT.md](../.brain/PROJECT_CONTEXT.md)

- Mettre à jour le résumé d'infra (VM Proxmox) pour que les agents futurs aient le bon contexte

### 13. Makefile

**Fichier** : [arr-stack/Makefile](../Makefile)

- Vérifier la cible `check-hardlinks` : toujours valide (un seul FS = hardlinks OK)
- Retirer toute cible liée à mdadm ou SMART si elle existe

### 14. credentials.md

**Fichier** : [arr-stack/credentials.md](../credentials.md) (hors git)

- Section "Stockage/RAID" : renommer "Stockage VM" + retirer les entrées RAID
- Ajouter section "Proxmox host" : IP Proxmox, VMID de la VM arr-server, chemin du disque virtuel, storage utilisé

---

## Règle de travail pendant l'application

1. Faire les modifs dans l'ordre ci-dessus (contexte → roadmap → config → scripts → docs → journal)
2. **Ne supprimer `hardware-raid-guide.md` et `upgrade-disks-guide.md` qu'après** avoir écrit leurs remplacements
3. Commit atomique par thème : un commit "contexte", un commit "roadmap", un commit "docker-compose + scripts", un commit "docs Proxmox", un commit "journal + brain"
4. Brancher sur `staging` (règle repo — `master` protégé)

---

## Vérification end-to-end

Après modifications, avant merge :

1. **Cohérence docs** : `grep -rni "lenovo\|i5-6400\|mdadm\|quicksync\|/dev/dri\|raid1" arr-stack/` → ne doit remonter **que** des mentions historiques dans JOURNAL.md et les sections "migration" documentant la bascule.
2. **Cohérence compose** : `docker compose -f arr-stack/docker-compose.yml config` → doit valider sans erreur, sans mapping `/dev/dri` actif.
3. **Cohérence scripts** : exécuter `bash -n arr-stack/install.sh` et `bash -n arr-stack/backup-arr-stack.sh` → pas d'erreur de syntaxe ; lecture manuelle pour confirmer que mdadm/SMART ont disparu.
4. **Cohérence PLAN_DEPLOIEMENT.md** : relire la Phase 3 et confirmer qu'aucune commande mdadm/mkfs/fdisk ne subsiste sur disque réel ; confirmer que la Phase 0.7 provisioning VM est explicite et actionnable.
5. **Cohérence guides** : les 4 nouveaux guides (`proxmox-vm-guide.md`, `proxmox-storage-guide.md`, `proxmox-backup-guide.md`, `gpu-passthrough-guide.md`) existent et sont référencés depuis README.md + CLAUDE.md.
6. **Test de lecture agent** : relire CLAUDE.md de bout en bout et vérifier qu'un agent découvrant le projet ne trouvera **aucune** contradiction Lenovo/Proxmox.

Validation fonctionnelle de bout en bout (post-déploiement réel, non bloquant pour ce plan) :
- La VM boot sur l'IP 192.168.1.200, SSH OK
- `docker compose up -d` lève tous les services
- Hardlinks vérifiés via `make check-hardlinks`
- Samba accessible depuis LAN
- Si GPU passthrough actif : `nvidia-smi` dans la VM + transcode Jellyfin test OK
