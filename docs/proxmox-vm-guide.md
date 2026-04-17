# Proxmox VM Guide — arr-server

Provisioning de la VM `arr-server` (Debian 12) sur l'hôte Proxmox `rp-pve-01`.

Référence plan : Phase 0.7 de `PLAN_DEPLOIEMENT.md`.

---

## Pré-requis hôte

- Proxmox VE 8.0.9 (`rp-pve-01`)
- Ryzen 3700x, 62 GiB ECC RAM, 1.52 TiB storage
- Bridge réseau `vmbr0` configuré et visible sur le LAN `192.168.1.0/24`
- ISO Debian 12 netinst amd64 (`debian-12.x.x-amd64-netinst.iso`)

---

## 1. Upload de l'ISO

**Via UI Proxmox** :
`Datacenter → rp-pve-01 → <storage> → ISO Images → Upload`

Choisir un storage qui supporte les ISO (par défaut `local`).

**Via CLI** (optionnel) :

```bash
# depuis un poste avec l'ISO :
scp debian-12.x.x-amd64-netinst.iso root@rp-pve-01:/var/lib/vz/template/iso/
```

---

## 2. Création de la VM

### Option A — UI Proxmox (recommandé pour un premier déploiement)

`Datacenter → rp-pve-01 → Create VM` :

| Onglet | Paramètre | Valeur |
|---|---|---|
| General | VM ID | **200** (ou premier libre) |
| General | Name | `arr-server` |
| General | Start at boot | ✅ |
| OS | ISO image | `debian-12.x.x-amd64-netinst.iso` |
| OS | Type | Linux 6.x - 2.6 Kernel |
| System | Machine | `q35` |
| System | BIOS | `OVMF (UEFI)` ou SeaBIOS (au choix) |
| System | Qemu Agent | ✅ |
| Disks | Bus/Device | **VirtIO Block** ou **VirtIO SCSI** |
| Disks | Storage | (ZFS ou LVM-thin selon config hôte) |
| Disks | Disk size | **500 GB** |
| Disks | Cache | `Default (no cache)` |
| Disks | Discard | ✅ (si storage supporte) |
| CPU | Sockets | 1 |
| CPU | Cores | **4** |
| CPU | Type | **host** |
| Memory | Memory (MiB) | **8192** |
| Memory | Ballooning Device | ✅ (pas agressif) |
| Network | Bridge | **vmbr0** |
| Network | Model | **VirtIO (paravirtualized)** |
| Network | MAC address | (auto — **la noter**) |

⚠️ **Pas de passthrough GPU** en Phase 1. La GTX 1060 reste sur l'hôte Proxmox comme sortie console physique (Ryzen 3700x sans iGPU). Voir `gpu-passthrough-guide.md` pour l'option future.

### Option B — CLI `qm create`

```bash
qm create 200 \
  --name arr-server \
  --memory 8192 \
  --balloon 4096 \
  --cores 4 \
  --sockets 1 \
  --cpu host \
  --machine q35 \
  --net0 virtio,bridge=vmbr0 \
  --scsihw virtio-scsi-single \
  --scsi0 <storage>:500,discard=on,iothread=1 \
  --ide2 local:iso/debian-12.x.x-amd64-netinst.iso,media=cdrom \
  --boot order=scsi0\;ide2 \
  --agent 1 \
  --onboot 1
```

Puis démarrer :

```bash
qm start 200
```

Récupérer la MAC virtuelle :

```bash
qm config 200 | grep net0
# net0: virtio=XX:XX:XX:XX:XX:XX,bridge=vmbr0
```

---

## 3. Installation Debian 12 (via console Proxmox)

`Datacenter → rp-pve-01 → arr-server → Console` (noVNC ou SPICE).

Choix à faire durant l'installer :

- Hostname : **`arr-server`**
- Domain : vide ou celui de ton réseau local
- Root password : (noter dans `credentials.md`)
- User normal : (noter dans `credentials.md`)
- Partitionnement : **Guided - use entire disk**, tout dans `/` ext4 (pas de LVM, pas de séparation `/home`)
- Software selection : **décocher** "Debian desktop environment", garder **SSH server** + **standard utilities**

Redémarrer à la fin de l'installer.

---

## 4. Post-install VM

Se connecter en SSH depuis le LAN (une fois l'IP attribuée via DHCP) :

```bash
ssh <user>@<ip-vm>
```

Installer le qemu-guest-agent et activer :

```bash
sudo apt update
sudo apt install -y qemu-guest-agent
sudo systemctl enable --now qemu-guest-agent
```

Vérifier depuis l'hôte Proxmox (UI ou CLI) que l'agent remonte :

```bash
qm agent 200 ping
```

La VM doit apparaître avec une petite icône "agent" dans l'UI Proxmox.

---

## 5. Passer en IP fixe

Voir `../network-guide.md` pour la réservation DHCP Freebox (MAC → `192.168.1.200`).

---

## 6. Snapshots

Snapshots Proxmox (state/memory de la VM) :

- **UI** : `arr-server → Snapshots → Take Snapshot`
- **CLI** : `qm snapshot 200 avant-docker-install --description "État propre, post-Debian"`

À prendre **avant** chaque modification structurelle (installation Docker, ajout de disque, upgrade distribution). Pour les backups périodiques récurrents, voir `proxmox-backup-guide.md`.

---

## 7. Checklist de validation

- [ ] `qm config 200` affiche la config attendue (4 cores, 8 GB, disque 500 GB, agent=1)
- [ ] `qm agent 200 ping` répond
- [ ] `ssh <user>@192.168.1.200` fonctionne (après réservation DHCP)
- [ ] `hostnamectl` dans la VM retourne `arr-server`
- [ ] `lsblk` montre un seul disque virtio + partition `/`
- [ ] Snapshot initial pris
