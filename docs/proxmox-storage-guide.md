# Proxmox Storage Guide — arr-server

Gestion du stockage de la VM `arr-server` : agrandir le disque, migrer de storage, ajouter un second disque pour isoler `/data`.

Référence plan : Phase 3 de `PLAN_DEPLOIEMENT.md`.

---

## Règle critique — hardlinks

`/data/torrents` et `/data/media` **doivent être sur le même filesystem**. Les apps ARR (Radarr, Sonarr, Lidarr) utilisent des hardlinks lors de l'import ; si les partitions diffèrent, le système bascule en copie lente et les inodes ne sont plus partagés.

Sur un disque virtuel unique (config par défaut), cette règle est naturellement respectée.

Si un second disque est ajouté pour `/data`, **les deux arbres doivent vivre sur ce même disque** — jamais `torrents` sur un disque et `media` sur un autre.

Vérifier à tout moment :

```bash
stat -c '%m' /data/torrents /data/media
# les deux lignes doivent afficher le même mountpoint
```

`make check-hardlinks` dans le repo fait cette vérif + un test d'inode partagé sur un fichier réel.

---

## 1. Agrandir le disque virtio à chaud

### Étape 1 — côté hôte Proxmox

UI : `arr-server → Hardware → Hard Disk → Resize disk`, ajouter par exemple 100 GiB.

CLI :

```bash
qm resize 200 scsi0 +100G
```

Le disque est agrandi **à chaud** sans reboot (virtio-scsi le supporte).

### Étape 2 — côté VM Debian

La VM voit maintenant un disque plus grand mais la partition et le filesystem sont toujours aux anciennes tailles.

```bash
# vérifier la nouvelle taille vue par la VM
lsblk

# agrandir la partition (parted, en live)
sudo parted /dev/sda
# dans parted :
(parted) print
(parted) resizepart <numéro-de-la-partition-/>
(parted) 100%
(parted) quit

# ré-auditer
sudo partprobe
lsblk

# étendre le filesystem ext4 à chaud
sudo resize2fs /dev/sda<N>

# vérifier
df -h /
```

⚠️ Si Debian a été installé avec LVM, passer par `pvresize` puis `lvextend -r` plutôt que `resize2fs` directement.

---

## 2. Migrer vers un autre storage

Déplacer le disque virtuel d'un storage Proxmox vers un autre (ex : d'un LVM-thin local vers un ZFS pool partagé).

UI : `arr-server → Hardware → Hard Disk → Move disk` → choisir le storage cible.

CLI :

```bash
qm move-disk 200 scsi0 <nouveau-storage> --delete 1
```

- `--delete 1` supprime la copie sur l'ancien storage après succès.
- La VM peut rester allumée (migration live).

---

## 3. Ajouter un 2ᵉ disque virtio pour isoler `/data`

Utile si on veut :
- séparer les configs (`/docker/appdata` sur disque système) du contenu lourd (`/data` sur un disque dédié)
- pouvoir snapshoter indépendamment les deux
- remplacer/agrandir `/data` sans toucher au système

### Étape 1 — ajouter le disque côté Proxmox

```bash
qm set 200 --scsi1 <storage>:2000,discard=on,iothread=1
```

Ou via UI : `arr-server → Hardware → Add → Hard Disk`.

### Étape 2 — formater et monter dans la VM

```bash
# identifier le nouveau disque
lsblk
# probablement /dev/sdb

# partitionner (table GPT, une seule partition)
sudo parted /dev/sdb --script mklabel gpt mkpart primary ext4 0% 100%

# formater en ext4
sudo mkfs.ext4 -L data /dev/sdb1

# récupérer l'UUID
sudo blkid /dev/sdb1

# monter de façon permanente via /etc/fstab
sudo mkdir -p /data
sudo nano /etc/fstab
# ajouter :
UUID=<uuid-récupéré>  /data  ext4  defaults,noatime  0  2

sudo mount -a
df -h /data
```

### Étape 3 — conserver l'invariant hardlinks

Tout `/data` (torrents + media + personal) doit rester sur ce nouveau disque :

```bash
stat -c '%m' /data /data/torrents /data/media /data/personal
# même mountpoint /data partout
```

---

## 4. Monitoring disque côté hôte

Le guest VM ne voit pas les attributs SMART du disque physique. Le monitoring S.M.A.R.T. est **géré côté hôte Proxmox** :

- UI : `Datacenter → rp-pve-01 → Disks` → voir colonne S.M.A.R.T.
- CLI : `smartctl -a /dev/nvme0n1` (ou le device physique concerné)

Pas de script de monitoring à installer dans la VM — c'est un anti-pattern.

---

## 5. Checklist

- [ ] `/data` existe et est monté
- [ ] `/data/torrents` et `/data/media` sur le même mountpoint
- [ ] `make check-hardlinks` passe sans warning
- [ ] Sauvegarde / snapshot récent (voir `proxmox-backup-guide.md`)
