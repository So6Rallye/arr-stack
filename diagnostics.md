# Diagnostics Guide

This guide groups the most common deployment and maintenance checks for the ARR stack.

---

## Quick diagnostics commands

Run these first when something looks wrong:

```bash
sudo docker compose ps
sudo docker compose logs
sudo docker compose config
ls -ln /data
ls -ln /docker/appdata
id
```

---

## Container start issues

Look for:

- invalid YAML
- missing folders
- permission errors
- port conflicts
- missing `/dev/dri`

---

## Port conflicts

If a port is already in use, change the host-side mapping.

Example:

```yaml
ports:
  - 8081:8080
```

---

## Permission mismatches

Make sure ownership matches the values used in `.env` or compose:

```bash
ls -ln /data
ls -ln /docker/appdata
id
```

---

## Jellyfin QuickSync issues

Check whether the host exposes Intel graphics devices:

```bash
ls /dev/dri
```

If nothing appears, verify BIOS iGPU settings and host support.

---

## Hardlinks not working

`/data/torrents` and `/data/media` must be on the same filesystem.

Check inode numbers:

```bash
ls -i /data/media/movies/<file>
ls -i /data/torrents/movies/<file>
```

---

## qBittorrent import issues

Verify:

- categories exist
- save path is `/data/torrents`
- automatic torrent management is enabled
- ARR categories match exactly

---

## Samba issues

Check service status:

```bash
sudo systemctl status smbd
```

Validate config:

```bash
testparm
```

---

## Existing HDDs must be prepared first

If the HDDs are not empty:

- inspect disks carefully
- decide whether data must be preserved or erased
- format only after confirming disk identity

Do not skip storage preparation before launching the stack.

Refer to `hardware-raid-guide.md` for storage planning and formatting context.
