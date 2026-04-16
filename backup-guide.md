# Backup Guide - ARR Stack Home Server

This guide explains what should be backed up in this project, what does not need the same priority, and how to keep recovery simple.

The main idea is straightforward:

- RAID is not backup
- media can often be rebuilt or re-downloaded
- configuration and metadata are usually the most valuable files to protect first

---

## 1. Backup philosophy

For this stack, not all data has the same importance.

### Highest priority

Back up:

- `/docker/appdata`
- any custom compose files
- `.env` files if used later
- Samba config
- custom scripts
- notes and documentation stored in the repo

### Medium priority

Back up if possible:

- Jellyfin metadata if you care about watched history and library state
- Syncthing config
- personal files stored in `/data/personal`

### Lowest priority

Usually lower priority:

- downloaded media in `/data/media`
- temporary or incomplete torrent data in `/data/torrents`

This depends on how hard that media is to replace, but for many setups the config is much more critical than the media itself.

---

## 2. What to back up first

### Essential folders

```text
/docker/appdata
/data/personal
```

### Essential files

Examples:

- `docker-compose.yml`
- `README.md`
- `guide.md`
- `hardware-raid-guide.md`
- future scripts such as `install.sh`
- future `.env` files
- `/etc/samba/smb.conf`

---

## 3. Why `/docker/appdata` matters so much

This folder contains the application state for:

- Radarr
- Sonarr
- Lidarr
- Bazarr
- Prowlarr
- qBittorrent
- Jellyfin
- Syncthing

Losing it can mean:

- losing app settings
- losing indexer configuration
- losing categories and downloader setup
- losing Jellyfin preferences and metadata
- losing sync definitions in Syncthing

That is why backing up `/docker/appdata` is one of the best returns on effort in this project.

---

## 4. Recommended backup strategy

### Minimum viable backup

At minimum, regularly copy:

- `/docker/appdata`
- `/data/personal`
- `/etc/samba/smb.conf`
- project repo files

### Good practical target

Keep at least:

- 1 local backup copy on another disk
- 1 optional remote or external copy for critical personal files

---

## 5. Local backup example

Create a local backup destination, for example on another disk:

```bash
sudo mkdir -p /backup/{appdata,personal,configs}
```

Then copy key paths:

```bash
sudo rsync -a --delete /docker/appdata/ /backup/appdata/
sudo rsync -a --delete /data/personal/ /backup/personal/
sudo rsync -a /etc/samba/smb.conf /backup/configs/
```

---

## 6. Simple backup script example

Example script:

```bash
#!/usr/bin/env bash
set -e

mkdir -p /backup/appdata /backup/personal /backup/configs
rsync -a --delete /docker/appdata/ /backup/appdata/
rsync -a --delete /data/personal/ /backup/personal/
rsync -a /etc/samba/smb.conf /backup/configs/
```

Save it for example as:

```text
/usr/local/bin/backup-arr-stack.sh
```

Make it executable:

```bash
sudo chmod +x /usr/local/bin/backup-arr-stack.sh
```

---

## 7. Optional scheduled backup with cron

Edit root cron:

```bash
sudo crontab -e
```

Example daily backup at 03:30:

```cron
30 3 * * * /usr/local/bin/backup-arr-stack.sh >> /var/log/backup-arr-stack.log 2>&1
```

---

## 8. What about media backups

Backing up all of `/data/media` may require a lot more storage.

That means you should decide based on the real value of the media.

### Common practical rule

- irreplaceable personal files → back up
- app configs → back up
- downloaded media → optional depending on budget and difficulty to replace

---

## 9. Recommended restore priorities

If the machine fails and you rebuild the host, restore in this order:

1. OS
2. Docker
3. `docker-compose.yml`
4. `/docker/appdata`
5. Samba config
6. `/data/personal`
7. `/data/media` if available

This gives you the fastest path back to a working service state.

---

## 10. Backup checklist

Make sure you have copies of:

- `/docker/appdata`
- `/data/personal`
- `/etc/samba/smb.conf`
- project repo files
- custom scripts
- `.env` files if introduced later

---

## 11. Final advice

If you only back up one thing first, back up:

```text
/docker/appdata
```

If you back up two things first, back up:

```text
/docker/appdata
/data/personal
```

That already covers the most important parts of this project for a very reasonable effort.
