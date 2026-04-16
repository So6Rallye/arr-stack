#!/usr/bin/env bash
set -e

echo "== ARR Stack helper install =="

echo "Creating folders..."
sudo mkdir -p /docker/appdata/{radarr,sonarr,lidarr,bazarr,prowlarr,qbittorrent,jellyfin,syncthing}
sudo mkdir -p /data/{torrents/{tv,movies,music},media/{tv,movies,music},personal/{photos,phone-camera,videos,documents,shared}}

echo "Setting ownership..."
sudo chown -R 1000:1000 /docker/appdata /data

echo "Done. Review docker-compose.yml then run:"
echo "sudo docker compose up -d"
