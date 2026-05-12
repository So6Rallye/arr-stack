# Architecture Diagram

```text
Internet
   |
Router / DHCP reservation (Freebox)
   |
LAN 192.168.1.0/24
   |
rp-pve-01 (Proxmox VE 8 — Ryzen 3700x / 62 GiB ECC)
   |
   |-- VM arr-server (192.168.1.200 — 4 vCPU / 8 GB RAM)
        |-- Debian 12 (Bookworm)
        |-- Docker Engine + Compose plugin
        |-- Samba (host)
        |
        |-- Containers — VPN tunnel (network_mode: service:gluetun):
        |    |-- Gluetun      (WireGuard / ProtonVPN — VPN gateway)
        |    |    |-- qBittorrent  :8080
        |    |    |-- Prowlarr     :9696
        |    |    |-- Radarr       :7878
        |    |    |-- Sonarr       :8989
        |    |    |-- Lidarr       :8686
        |    |    |-- Bazarr       :6767
        |    |    |-- FlareSolverr :8191
        |
        |-- Containers — réseau direct (arr_network):
        |    |-- Jellyfin    :8096
        |    |-- Jellyseerr  :5055
        |    |-- Syncthing   :8384
        |    |-- Navidrome   :4533
        |
        |-- Storage (virtio disk 500 GB — disque unique):
             |-- /docker/appdata  (configs containers)
             |-- /data/torrents
             |-- /data/media
             |-- /data/personal
```
