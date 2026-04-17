# Proxmox Backup Guide — arr-server

Stratégie de sauvegarde en **deux niveaux** pour la VM `arr-server` :

1. **Niveau applicatif** — `backup-arr-stack.sh` dans la VM (configs `/docker/appdata`, données `/data/personal`, fichiers système `smb.conf`, `fstab`).
2. **Niveau VM** — snapshots/backups Proxmox (image complète de la VM : disque + config + RAM si besoin).

Les deux sont **complémentaires**, pas redondants. Le backup applicatif permet une restauration chirurgicale (un seul service, un seul dossier). Le backup Proxmox permet une restauration totale de la VM (bootable, toute la stack d'un coup).

---

## 1. Niveau applicatif (dans la VM)

Script : `backup-arr-stack.sh` à la racine du repo.

```bash
cd ~/arr-stack
./backup-arr-stack.sh            # destination = $BACKUP_DEST (.env) ou /backup
./backup-arr-stack.sh /mnt/usb   # destination override
```

Automatiser via cron :

```bash
# /etc/cron.d/arr-stack-backup
0 3 * * * <user> cd /home/<user>/arr-stack && ./backup-arr-stack.sh >> /var/log/arr-stack-backup.log 2>&1
```

Ce backup **ne couvre pas** :
- Les fichiers `/data/torrents` et `/data/media` (recréables depuis les sources — ne pas surcharger le backup)
- L'image disque de la VM elle-même → relève du niveau Proxmox

---

## 2. Niveau VM — Proxmox

### 2a. Snapshots ponctuels

À prendre **avant toute modification structurelle** (installation paquet, upgrade distrib, refonte config Docker).

UI : `arr-server → Snapshots → Take Snapshot`
- Nom : descriptif (ex : `avant-upgrade-bookworm`)
- Include RAM : optionnel (utile si VM en prod, inutile si arrêtée)

CLI :

```bash
qm snapshot 200 avant-upgrade --description "Snapshot pré-upgrade stack Docker 2026-04-20"
```

Restauration :

```bash
qm rollback 200 avant-upgrade
```

Suppression (libérer de l'espace) :

```bash
qm delsnapshot 200 avant-upgrade
```

⚠️ Les snapshots ne sont **pas un backup** — ils vivent sur le même storage que la VM. Si le storage meurt, tout part avec.

### 2b. Backups récurrents

Pour une vraie protection, utiliser `Datacenter → Backup` (interface UI Proxmox).

**Configuration recommandée** :

| Paramètre | Valeur |
|---|---|
| Node | `rp-pve-01` |
| Storage | Storage dédié backup (idéalement externe — NAS, Proxmox Backup Server, disque USB) |
| Day of week | Daily ou selon RTO/RPO acceptable |
| Hour | 03:00 (hors horaires d'usage) |
| Selection mode | `Include selected VMs` |
| VMs | `200 arr-server` |
| Compression | `zstd` |
| Mode | `Snapshot` (VM allumée, cohérence via qemu-guest-agent fsfreeze) |
| Mail notification | `On failure only` |
| Retention | Ex : `keep-daily=7, keep-weekly=4, keep-monthly=6` |

### 2c. Proxmox Backup Server (PBS) — option recommandée à terme

PBS apporte déduplication, incrémental vrai, et vérification d'intégrité cryptographique. C'est **le** moyen recommandé pour un parc Proxmox sérieux.

Installation d'un PBS (sur une autre machine ou VM) puis ajout en tant que storage Proxmox :

`Datacenter → Storage → Add → Proxmox Backup Server`

Une fois ajouté, il devient éligible comme destination de backup dans `Datacenter → Backup`.

---

## 3. Restauration

### Cas A — "J'ai cassé un service Docker, je veux restaurer ma config"

Niveau applicatif :

```bash
# dans la VM
sudo systemctl stop docker
sudo rsync -a --delete /backup/<stamp>/appdata/<service>/ /docker/appdata/<service>/
sudo systemctl start docker
docker compose up -d
```

### Cas B — "La VM ne boot plus / FS corrompu / erreur humaine massive"

Niveau VM :

UI : `arr-server → Backup → <backup> → Restore` → restaurer sur le même VMID (écrase) ou un nouveau.

CLI :

```bash
qmrestore /var/lib/vz/dump/vzdump-qemu-200-YYYY_MM_DD.vma.zst 200 --storage <storage>
```

### Cas C — "Je veux juste récupérer un fichier perdu dans `/data/personal`"

Niveau applicatif (si destination backup accessible) :

```bash
ls /backup/<stamp>/personal/photos/
rsync -a /backup/<stamp>/personal/photos/<fichier> /data/personal/photos/
```

Si non présent dans le backup applicatif, monter l'image VM via `qmrestore` sur un VMID temporaire, copier, puis supprimer cette VM temporaire.

---

## 4. Tests de restauration (à faire au moins 1×/trimestre)

Un backup jamais testé n'est pas un backup.

1. Restaurer le dernier backup VM sur un VMID temporaire (ex : `299`)
2. La démarrer isolée (pas sur le LAN de prod — bridge différent ou bridge isolé)
3. Vérifier qu'elle boot, que les services Docker remontent
4. Éteindre + supprimer la VM test

---

## 5. Checklist

- [ ] `backup-arr-stack.sh` s'exécute sans erreur (manuel ou cron)
- [ ] Job de backup Proxmox configuré et actif sur la VM 200
- [ ] Au moins 1 backup récent visible dans `arr-server → Backup`
- [ ] Destination backup **hors** de l'hôte `rp-pve-01` (NAS, PBS distant, disque USB)
- [ ] Test de restauration effectué dans les 90 derniers jours
