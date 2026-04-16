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
