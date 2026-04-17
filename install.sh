#!/usr/bin/env bash
set -e

echo "== ARR Stack install helper V2 =="

# Load .env if present (for BACKUP_DEST and other vars)
if [ -f "$(dirname "$0")/.env" ]; then
  # shellcheck disable=SC1091
  set -a; source "$(dirname "$0")/.env"; set +a
fi

BACKUP_DEST="${BACKUP_DEST:-/backup}"

echo "Detected user: $(id -un)"
echo "UID: $(id -u)"
echo "GID: $(id -g)"

echo "Creating appdata folders..."
sudo mkdir -p /docker/appdata/{radarr,sonarr,lidarr,bazarr,prowlarr,qbittorrent,jellyfin,syncthing}

echo "Creating data folders..."
sudo mkdir -p /data/{torrents/{tv,movies,music},media/{tv,movies,music},personal/{photos,phone-camera,videos,documents,shared}}

echo "Creating backup destination: $BACKUP_DEST"
sudo mkdir -p "$BACKUP_DEST"

echo "Setting ownership..."
sudo chown -R "$(id -u):$(id -g)" /docker/appdata /data

echo "Checking /data directory..."
if [ ! -d /data ]; then
  echo "ERROR: /data does not exist. Create it (or mount a dedicated volume) before running the stack."
  echo "See docs/proxmox-storage-guide.md for dedicated /data disk setup."
  exit 1
fi

# Warn if /data is on a different filesystem from /data/torrents (rare on single-disk VM,
# but possible if a second virtio disk was mounted under /data/media or /data/torrents only).
if [ -d /data/torrents ] && [ -d /data/media ]; then
  if [ "$(stat -c '%m' /data/torrents)" != "$(stat -c '%m' /data/media)" ]; then
    echo "WARNING: /data/torrents and /data/media are on different filesystems — hardlinks will degrade to copies."
    echo "See docs/proxmox-storage-guide.md."
  fi
fi

echo "Starting stack..."
sudo docker compose up -d

echo ""
echo "Done. Check status with: make ps"
echo "After first media is processed, verify hardlinks: make check-hardlinks"
