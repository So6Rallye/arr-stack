# GPU Passthrough Guide — GTX 1060 (option future non activée)

> ⚠️ **AVERTISSEMENT — à lire avant d'exécuter quoi que ce soit de ce guide**
>
> Activer ce guide **prive l'hôte Proxmox `rp-pve-01` de sa seule sortie vidéo** (Ryzen 3700x sans iGPU : la GTX 1060 est l'unique carte graphique). L'admin web UI restera joignable tant que le LAN fonctionne, mais **tout débogage bas-niveau (boot, kernel panic, réseau HS, BIOS/UEFI)** devra se faire hors sortie locale — port série, IPMI, ou déplacement physique d'une autre GPU.
>
> **N'exécuter que si les DEUX conditions sont réunies** :
> 1. Un besoin transcode réel est **avéré** (client incompatible direct-play identifié, pas juste "pour faire beau").
> 2. L'administration distante uniquement (web UI Proxmox + SSH) est jugée suffisante par l'utilisateur pour toutes les opérations de maintenance futures.
>
> **Tant que ces deux conditions ne sont pas remplies**, la stratégie Phase 1 (direct-play DLNA → Freebox Player Ultra) reste en vigueur et ce guide ne doit **pas** être appliqué.

---

## Contexte

- Hôte : `rp-pve-01` (Proxmox VE 8.0.9, Ryzen 3700x)
- GPU : GTX 1060 6GB
- VM cible : `arr-server` (VMID 200)
- Objectif : activer le transcodage hardware Jellyfin via NVENC dans la VM.

Ce guide couvre :
1. Activation IOMMU côté hôte Proxmox
2. Blacklist `nouveau` + binding vfio
3. Attachement de la GPU à la VM
4. Installation des drivers NVIDIA + nvidia-container-toolkit dans la VM
5. Activation Jellyfin NVENC + validation

---

## 1. Pré-requis hôte

Vérifier que le CPU + carte mère supportent IOMMU :

```bash
# côté hôte Proxmox
dmesg | grep -e DMAR -e IOMMU
# doit mentionner "AMD-Vi" (AMD) ou "DMAR" (Intel)
```

Côté BIOS/UEFI : activer **SVM** (AMD) et **IOMMU** (souvent sous "Advanced → AMD CBS → NBIO → IOMMU = Enabled").

---

## 2. Activer IOMMU dans GRUB

```bash
# hôte Proxmox
sudo nano /etc/default/grub
```

Modifier la ligne `GRUB_CMDLINE_LINUX_DEFAULT` :

```
GRUB_CMDLINE_LINUX_DEFAULT="quiet amd_iommu=on iommu=pt"
```

Régénérer GRUB et redémarrer l'hôte :

```bash
sudo update-grub
sudo reboot
```

Vérifier après reboot :

```bash
dmesg | grep -i "AMD-Vi.*enabled"
# doit afficher "AMD-Vi: AMD IOMMUv2 loaded and initialized"
```

---

## 3. Identifier le groupe IOMMU de la GPU

```bash
# hôte Proxmox
for d in /sys/kernel/iommu_groups/*/devices/*; do
  n=${d#*/iommu_groups/*}; n=${n%%/*}
  printf 'IOMMU Group %s ' "$n"
  lspci -nns "${d##*/}"
done | sort -V | grep -E "NVIDIA|VGA|Audio"
```

Noter :
- L'ID PCI de la GPU (ex : `0a:00.0`)
- L'ID PCI de la carte audio HDMI NVIDIA (ex : `0a:00.1`)
- Leur IDs vendor:device (ex : `10de:1c03`, `10de:10f1`)

Tous les périphériques du même groupe IOMMU **doivent** passer ensemble à la VM.

---

## 4. Blacklist nouveau + binding vfio

```bash
# hôte Proxmox
echo "blacklist nouveau" | sudo tee /etc/modprobe.d/blacklist-nouveau.conf
echo "options vfio-pci ids=10de:1c03,10de:10f1 disable_vga=1" | sudo tee /etc/modprobe.d/vfio.conf
echo -e "vfio\nvfio_iommu_type1\nvfio_pci\nvfio_virqfd" | sudo tee /etc/modules-load.d/vfio.conf

sudo update-initramfs -u -k all
sudo reboot
```

Vérifier après reboot que la GPU est bien bindée à vfio-pci :

```bash
lspci -nnk | grep -iA 3 nvidia
# doit afficher "Kernel driver in use: vfio-pci"
```

⚠️ **À partir de ce moment**, l'hôte n'affiche plus rien sur la sortie HDMI/DP de la GTX 1060.

---

## 5. Attacher la GPU à la VM

VM arrêtée.

```bash
qm stop 200
qm set 200 --hostpci0 0a:00,pcie=1,x-vga=0
qm set 200 --machine q35
qm start 200
```

- `0a:00` = domaine PCI (les deux fonctions `.0` et `.1` sont prises ensemble)
- `x-vga=0` car la VM n'utilise pas la GPU pour la sortie console (reste via console noVNC Proxmox)

Vérifier dans la VM :

```bash
lspci | grep -i nvidia
# doit montrer les deux devices NVIDIA
```

---

## 6. Drivers NVIDIA + nvidia-container-toolkit dans la VM

```bash
# dans la VM arr-server
sudo apt update
sudo apt install -y linux-headers-$(uname -r) build-essential

# driver NVIDIA (via backports Debian ou repo NVIDIA officiel)
sudo apt install -y nvidia-driver firmware-misc-nonfree
sudo reboot

# après reboot, vérifier
nvidia-smi
# doit lister la GTX 1060
```

Installer nvidia-container-toolkit :

```bash
# dans la VM
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
  sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

Test :

```bash
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi
# doit afficher la GTX 1060
```

---

## 7. Activer NVENC dans Jellyfin

Décommenter dans `docker-compose.yml`, service `jellyfin`, l'option A (NVIDIA) :

```yaml
  jellyfin:
    # ... (reste de la config existante)
    runtime: nvidia
    environment:
      NVIDIA_VISIBLE_DEVICES: all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

Recréer le conteneur :

```bash
docker compose up -d jellyfin
```

Config UI Jellyfin : `Dashboard → Playback → Transcoding` :

- Hardware acceleration : **NVIDIA NVENC**
- Enable hardware decoding for : H264, HEVC, VP9 (selon besoin)
- Enable tone mapping : si source HDR
- Enable hardware encoding : ✅

Tester un transcode forcé (client qui impose H.264 AVC 5 Mbps) et vérifier pendant la lecture :

```bash
# dans la VM
nvidia-smi dmon -s u
# doit montrer une activité GPU > 0 durant le transcode
```

---

## 8. Rollback (revenir en arrière)

Pour repasser la GPU à l'hôte Proxmox :

```bash
# hôte
qm set 200 --delete hostpci0

sudo rm /etc/modprobe.d/vfio.conf
sudo rm /etc/modprobe.d/blacklist-nouveau.conf
sudo rm /etc/modules-load.d/vfio.conf
sudo update-initramfs -u -k all
sudo reboot
```

Après reboot, l'hôte retrouve sa sortie vidéo sur la GTX 1060 (avec le driver `nouveau` ou `nvidia` selon config).

---

## 9. Checklist

- [ ] BIOS : IOMMU + SVM activés
- [ ] GRUB : `amd_iommu=on iommu=pt`
- [ ] Groupe IOMMU de la GPU identifié, tous les devices notés
- [ ] `nouveau` blacklisté, `vfio-pci` bindé avec les bons IDs
- [ ] `lspci -nnk` côté hôte : GPU en `vfio-pci`
- [ ] `qm set 200 --hostpci0 ...` appliqué
- [ ] `nvidia-smi` OK dans la VM
- [ ] `docker run --gpus all` test OK
- [ ] Jellyfin : transcode hardware visible dans `nvidia-smi dmon`
- [ ] Plan de rollback documenté et testé (au moins mentalement)
