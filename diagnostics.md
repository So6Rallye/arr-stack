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

## Jellyfin transcoding

Phase 1 strategy is **direct-play only** via Jellyfin DLNA → Freebox Player Ultra (native H.265 hardware decode). No GPU passthrough, no transcode.

If a non-Freebox client forces transcode and CPU usage spikes, prefer switching the client to a direct-play compatible app (Jellyfin Android TV, Jellyfin Media Player, Infuse) before activating GPU passthrough.

NVIDIA NVENC passthrough for the GTX 1060 is documented as a future option in `docs/gpu-passthrough-guide.md` — not activated by default.

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

## VM storage preparation

The VM uses a single virtio disk (500 GB) — RAID is handled by the Proxmox host. Before launching the stack:

- confirm `/data` and `/docker/appdata` exist and are on the same filesystem (hardlink invariant)
- check free space with `df -h /data`
- verify mount via `findmnt /data`

Refer to `docs/proxmox-storage-guide.md` for resizing the virtio disk or adding a dedicated `/data` disk.
