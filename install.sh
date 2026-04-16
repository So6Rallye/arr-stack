#!/usr/bin/env bash
set -e

echo "== ARR Stack install helper V2 =="

echo "Detected user: $(id -un)"
echo "UID: $(id -u)"
echo "GID: $(id -g)"

echo "Creating appdata folders..."
sudo mkdir -p /docker/appdata/{radarr,sonarr,lidarr,bazarr,prowlarr,qbittorrent,jellyfin,syncthing}

echo "Creating data folders..."
sudo mkdir -p /data/{torrents/{tv,movies,music},media/{tv,movies,music},personal/{photos,phone-camera,videos,documents,shared}}

echo "Setting ownership..."
sudo chown -R $(id -u):$(id -g) /docker/appdata /data

echo "If your HDDs are not empty and need formatting, read hardware-raid-guide.md first."

echo "Checking /data mount..."
if ! mountpoint -q /data; then
  echo "ERROR: /data is not mounted. Mount your data volume before running the stack."
  echo "See hardware-raid-guide.md for RAID setup."
  exit 1
fi

echo "Starting stack..."
sudo docker compose up -d

echo "Done. Check status with: make ps"
