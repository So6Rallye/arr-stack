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
- Intel QuickSync support for Jellyfin

---

## Goals

This stack is designed to be:

- simple
- reliable
- accessible
- easy to evolve later

Typical hardware target:

- an old Lenovo or similar Intel-based desktop
- SSD for the OS and Docker appdata
- separate storage for media and personal files
- ideally RAID1 or another redundancy strategy on the data volume

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

## Existing HDDs and formatting warning

If your HDDs are **not empty**, do not jump directly to folder creation and stack deployment.

Before using them:

- identify the correct disks
- inspect existing partitions
- decide whether data must be preserved or erased
- format only after confirming disk identity
- prepare RAID or the target data volume first

Refer to [Hardware and RAID Guide](./hardware-raid-guide.md) before formatting or rebuilding storage.

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

### Intel hardware acceleration

The compose file includes:

```yaml
devices:
  - /dev/dri:/dev/dri
```

This is meant for Intel QuickSync hardware acceleration, assuming the host is properly configured.

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

- [Hardware and RAID Guide](./hardware-raid-guide.md)
- [Backup Guide](./backup-guide.md)
- [Upgrade Disks Guide](./upgrade-disks-guide.md)
- [First Boot Checklist](./first-boot-checklist.md)
- [Diagnostics Guide](./diagnostics.md)
- [Restore Guide](./restore-guide.md)
- [Network Guide](./network-guide.md)
- [Tailscale Guide](./tailscale-guide.md)
- [SMART Monitor Guide](./smart-monitor-guide.md)
- [Maintenance Schedule](./maintenance-schedule.md)
- [Architecture Diagram](./architecture-diagram.md)
- [Watchtower Example](./watchtower-example.md)

---

## Notes

- `TZ` is set to `Europe/Paris`
- qBittorrent explicitly keeps `PUID`, `PGID` and `TZ`
- Syncthing is included for personal files and phone sync
- Jellyfin maps `/dev/dri` for Intel QuickSync
- `/data/personal` is included in the folder structure
- fixed LAN IP recommended for this project: `192.168.1.200`
- recommended hostname: `arr-server`

---

## Possible future improvements

- Tailscale for remote access (see [tailscale-guide.md](./tailscale-guide.md))
