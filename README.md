> **Variante Proxmox (VM Debian 12).** La version hors-Proxmox (Lenovo i5-6400 / RAID1 mdadm / Intel QuickSync) est figée sur la branche [`legacy/physical-lenovo`](https://github.com/So6Rallye/arr-stack/tree/legacy/physical-lenovo) (tag `v0-physical-lenovo`).

# ARR Stack - Debian Home Server Edition

Simple and reliable Docker stack for a Debian or Ubuntu home server with:

- Radarr
- Sonarr
- Lidarr
- Bazarr
- Prowlarr
- qBittorrent
- Jellyfin
- Syncthing

This version is tailored for a personal home server focused on:

- clean hardlink-friendly folder structure
- torrent-based downloads
- Jellyfin media library
- phone and PC file sync with Syncthing
- SMB/Samba shares on the host
- France timezone
- direct-play streaming to Freebox Player Ultra (H.265 hardware decode) — no GPU transcode required

---

## Goals

This stack is designed to be:

- simple
- reliable
- accessible
- easy to evolve later

Typical deployment target:

- Debian 12 VM on a Proxmox VE host (`rp-pve-01`, Ryzen 3700x, 62 GiB ECC)
- VM resources: 4 vCPU / 8 GB RAM / single 500 GB virtio disk
- RAID / storage redundancy **handled by the Proxmox host** (ZFS or LVM-thin depending on host config) — no RAID inside the VM
- `/data` and `/docker/appdata` are simple directories on the single virtio disk (keeps the hardlink invariant)

See [docs/proxmox-vm-guide.md](./docs/proxmox-vm-guide.md) for VM provisioning details.

---

## Included services

- **Radarr** for movies
- **Sonarr** for TV shows
- **Lidarr** for music
- **Bazarr** for subtitles
- **Prowlarr** for indexer management
- **qBittorrent** as torrent client
- **Jellyfin** as media server
- **Syncthing** for personal file and phone sync

---

## Recommended architecture

### System / SSD

Use the SSD for:

- Debian or Ubuntu
- Docker
- container configs in `/docker/appdata`

### Data storage

Use your data volume for:

- `/data/torrents`
- `/data/media`
- `/data/personal`

This separation keeps configs fast and clean while storing large files on the data disks.

---

## Prerequisites

- Debian 12 or recent Ubuntu Server
- Docker Engine
- Docker Compose plugin
- a data volume mounted on `/data`
- ideally `/docker/appdata` stored on SSD

---

## Install Docker

Official documentation:

- https://docs.docker.com/engine/install/
- https://docs.docker.com/compose/

Basic preparation:

```bash
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
```

Then follow the official Docker instructions for your OS.

Once the Docker repository is configured, install Docker and Compose:

```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl status docker
sudo docker run hello-world
docker compose version
```

---

## Folder structure

Create the following structure:

```bash
sudo mkdir -p /data/{torrents/{tv,movies,music},media/{tv,movies,music},personal/{photos,phone-camera,videos,documents,shared}}
sudo apt install tree
tree /data
sudo chown -R 1000:1000 /data
sudo chmod -R a=,a+rX,u+w,g+w /data
ls -ln /data
```

### What each folder is for

- `/data/torrents/...` → qBittorrent download folders
- `/data/media/...` → final media library used by Jellyfin, Radarr, Sonarr and Lidarr
- `/data/personal/...` → personal files, phone photos, videos, documents and SMB shares

### Important note about hardlinks

`/data/torrents` and `/data/media` must stay on the **same filesystem**.

That is what allows hardlinks to work correctly between downloads and final library folders.

---

## Recommended tree

```text
/docker/appdata/
  radarr/
  sonarr/
  lidarr/
  bazarr/
  prowlarr/
  qbittorrent/
  jellyfin/
  syncthing/

/data/
  torrents/
    tv/
    movies/
    music/
  media/
    tv/
    movies/
    music/
  personal/
    photos/
    phone-camera/
    videos/
    documents/
    shared/
```

---

## Quick start

1. Install Docker and Docker Compose
2. Create the `/data` folder structure
3. Prepare storage correctly if your HDDs are not empty
4. Put `docker-compose.yml` in your project folder
5. Copy `.env.example` to `.env` and adjust values
6. Start the stack
7. Configure qBittorrent categories
8. Configure Radarr / Sonarr / Lidarr root folders
9. Link Prowlarr to the apps
10. Add Jellyfin libraries
11. Configure Syncthing for personal files
12. Configure Samba on the host if you want SMB shares

---

## VM provisioning and storage

This stack runs inside a Debian 12 VM on Proxmox. Before starting Docker:

- provision the VM with a single virtio disk (500 GB recommended) — see [docs/proxmox-vm-guide.md](./docs/proxmox-vm-guide.md)
- leave RAID / redundancy to the Proxmox host (ZFS or LVM-thin)
- keep `/data/torrents` and `/data/media` on the **same filesystem** (naturally satisfied on a single virtio disk)
- for resizing, migrating or adding a second virtio disk for `/data`, see [docs/proxmox-storage-guide.md](./docs/proxmox-storage-guide.md)
- VM-level snapshots and backups are handled by Proxmox — see [docs/proxmox-backup-guide.md](./docs/proxmox-backup-guide.md)

---

## Start the stack

From the folder containing `docker-compose.yml`:

```bash
sudo docker compose up -d
```

To restart the full stack later:

```bash
sudo docker compose down
sudo docker compose up -d
```

---

## Service URLs

### From the server itself

- qBittorrent: `http://localhost:8080`
- Prowlarr: `http://localhost:9696`
- Radarr: `http://localhost:7878`
- Sonarr: `http://localhost:8989`
- Lidarr: `http://localhost:8686`
- Bazarr: `http://localhost:6767`
- Jellyfin: `http://localhost:8096`
- Syncthing: `http://localhost:8384`

### From another device on your LAN

Replace `IP_DU_SERVEUR` with your server IP.

Recommended value for this project:

- `192.168.1.200`

Examples:

- `http://192.168.1.200:8080`
- `http://192.168.1.200:9696`
- `http://192.168.1.200:7878`
- `http://192.168.1.200:8989`
- `http://192.168.1.200:8686`
- `http://192.168.1.200:6767`
- `http://192.168.1.200:8096`
- `http://192.168.1.200:8384`

---

## qBittorrent first login

Get the temporary password from the container logs:

```bash
sudo docker logs qbittorrent
```

You should see something like:

- username: `admin`
- a temporary password

Log in to the WebUI and change the credentials if needed.

---

## qBittorrent recommended settings

Create the following categories:

- `movies`
- `tv`
- `music`

Use these save paths:

- `movies`
- `tv`
- `music`

Then go to:

`Tools > Options > Downloads`

Recommended settings:

- **Default Save Path**: `/data/torrents`
- **Default Torrent Management Mode**: `Automatic`
- **When Torrent Category changed**: `Relocate torrent`
- **When Default Save Path Changed**: `Switch affected torrents to Manual Mode`
- **When Category Save Path Changed**: `Switch affected torrents to Manual Mode`

Also enable:

- `Use Subcategories`
- `Use Category paths in Manual Mode`

---

## ARR app configuration

### Radarr

URL:

`http://192.168.1.200:7878`

Recommended settings:

- Root Folder: `/data/media/movies`
- enable **Use Hardlinks instead of Copy**

qBittorrent download client:

- Host: `qbittorrent`
- Port: `8080`
- SSL: disabled
- Category: `movies`

---

### Sonarr

URL:

`http://192.168.1.200:8989`

Recommended settings:

- Root Folder: `/data/media/tv`
- enable **Use Hardlinks instead of Copy**

qBittorrent download client:

- Host: `qbittorrent`
- Port: `8080`
- SSL: disabled
- Category: `tv`

---

### Lidarr

URL:

`http://192.168.1.200:8686`

Recommended settings:

- Root Folder: `/data/media/music`

qBittorrent download client:

- Host: `qbittorrent`
- Port: `8080`
- SSL: disabled
- Category: `music`

---

### Prowlarr

URL:

`http://192.168.1.200:9696`

Add qBittorrent as a download client with:

- Host: `qbittorrent`
- Port: `8080`
- SSL: disabled

Then connect:

- Radarr
- Sonarr
- Lidarr

using each app API key.

---

### Bazarr

URL:

`http://192.168.1.200:6767`

Then configure:

- language profiles
- subtitle providers
- Radarr and Sonarr integration

---

## Jellyfin

URL:

`http://192.168.1.200:8096`

Recommended libraries:

- Movies → `/data/media/movies`
- TV Shows → `/data/media/tv`
- Music → `/data/media/music`

### Transcode strategy

Phase 1 — **direct-play only, no hardware transcode**:

- primary client = Freebox Player Ultra, which decodes H.264/H.265/AAC natively in hardware
- Jellyfin serves the media as-is (DLNA server enabled, or native Jellyfin app on Android TV / Apple TV / desktop)
- the library can stay in H.265 (≈50% storage saving vs H.264) without penalty
- no mapping of `/dev/dri` — the Ryzen 3700x host has no iGPU, and the GTX 1060 stays on the Proxmox host for physical console output

**Enable DLNA in Jellyfin** (`Dashboard → Networking → DLNA`) so the Freebox Player picks up the server automatically.

### GPU passthrough (future option, not activated)

If a real transcode need emerges (a client incompatible with direct-play is identified), the GTX 1060 can be passed through to the VM for NVENC. Full procedure + rollback in [docs/gpu-passthrough-guide.md](./docs/gpu-passthrough-guide.md). Warning: activating passthrough deprives the Proxmox host of its only video output — only do it when the tradeoff is justified.

---

## Syncthing

URL:

`http://192.168.1.200:8384`

Recommended use:

- phone camera uploads → `/data/personal/phone-camera`
- sorted photos → `/data/personal/photos`
- videos → `/data/personal/videos`
- documents → `/data/personal/documents`

Typical use cases:

- automatic phone photo upload
- document sync between multiple PCs
- lightweight personal backup without a full cloud stack

---

## SMB / Samba

Samba is **not** run in Docker in this setup.

This is intentional. For this project, Samba is cleaner and more reliable when running directly on the Debian or Ubuntu host.

### Install Samba

```bash
sudo apt update
sudo apt install samba smbclient
```

### Edit the Samba config

```bash
sudo nano /etc/samba/smb.conf
```

Example shares:

```ini
[personal]
   path = /data/personal
   browseable = yes
   read only = no
   create mask = 0664
   directory mask = 0775
   valid users = tonuser

[media]
   path = /data/media
   browseable = yes
   read only = yes
   valid users = tonuser
```

Then create the Samba password and restart the service:

```bash
sudo smbpasswd -a tonuser
sudo systemctl restart smbd
sudo systemctl enable smbd
```

### Recommended policy

- `personal` share: read/write
- `media` share: read-only

That helps prevent accidental edits to the media library managed by the ARR apps and Jellyfin.

---

## Hardlink check

Hardlinks should work between `/data/torrents` and `/data/media`.

To verify, compare inode numbers:

```bash
ls -i /data/media/movies/<file>
ls -i /data/torrents/movies/<file>
```

If the inode number is the same, hardlinks are working correctly.

---

## Troubleshooting

### Files are copied instead of hardlinked

Common causes:

- source and destination are not on the same filesystem
- incorrect permissions
- wrong paths configured in the applications

### Files do not move into the media library

Check:

- Activity / Queue in Radarr or Sonarr
- qBittorrent category
- ARR root folder paths
- permissions on `/data`

### qBittorrent downloads are not organized correctly

Check:

- categories exist
- Default Save Path is `/data/torrents`
- automatic torrent management is enabled

---

## Post-install checklist

Once the stack is running, verify the following:

- Docker starts correctly
- all containers are healthy
- qBittorrent categories are created
- Radarr, Sonarr and Lidarr use the correct root folders
- Prowlarr is connected to the apps
- Jellyfin libraries are added
- Syncthing folders are created and synced
- Samba shares are reachable from another device
- hardlinks are working properly

---

## Security notes

Do **not** expose these service ports directly to the public Internet.

For secure remote access, prefer:

- Tailscale
- a private VPN
- another controlled secure access layer

---

## Philosophy of this stack

This repository is meant for a personal home server focused on:

- media automation
- personal files
- phone sync
- easy LAN access
- low maintenance

The guiding principle is to keep things simple:

- Docker for the application stack
- Samba on the host for SMB shares
- Syncthing for personal file sync
- Jellyfin for media playback

---

## Additional guides

Proxmox / VM infrastructure:

- [Proxmox VM Guide](./docs/proxmox-vm-guide.md)
- [Proxmox Storage Guide](./docs/proxmox-storage-guide.md)
- [Proxmox Backup Guide](./docs/proxmox-backup-guide.md)
- [GPU Passthrough Guide (future option)](./docs/gpu-passthrough-guide.md)

Application-level:

- [Backup Guide](./backup-guide.md)
- [First Boot Checklist](./first-boot-checklist.md)
- [Diagnostics Guide](./diagnostics.md)
- [Restore Guide](./restore-guide.md)
- [Network Guide](./network-guide.md)
- [Tailscale Guide](./tailscale-guide.md)
- [Maintenance Schedule](./maintenance-schedule.md)
- [Architecture Diagram](./architecture-diagram.md)
- [Watchtower Example](./watchtower-example.md)

---

## Notes

- `TZ` is set to `Europe/Paris`
- qBittorrent explicitly keeps `PUID`, `PGID` and `TZ`
- Syncthing is included for personal files and phone sync
- Jellyfin uses direct-play by default (no GPU transcode). See the [GPU Passthrough Guide](./docs/gpu-passthrough-guide.md) for the future NVIDIA NVENC option.
- `/data/personal` is included in the folder structure
- fixed LAN IP recommended for this project: `192.168.1.200`
- recommended hostname: `arr-server`

---

## Possible future improvements

- Tailscale for remote access (see [tailscale-guide.md](./tailscale-guide.md))
