# Architecture Diagram

```text
Internet
   |
Router / DHCP reservation
   |
LAN 192.168.1.0/24
   |
arr-server (192.168.1.200)
   |
   |-- Debian / Ubuntu
   |-- Docker Engine
   |-- Docker Compose
   |
   |-- Containers:
   |    |-- qBittorrent :8080
   |    |-- Prowlarr    :9696
   |    |-- Radarr      :7878
   |    |-- Sonarr      :8989
   |    |-- Lidarr      :8686
   |    |-- Bazarr      :6767
   |    |-- Jellyfin    :8096
   |    |-- Syncthing   :8384
   |
   |-- Storage:
        |-- SSD system
        |-- /docker/appdata
        |-- HDD data array
             |-- /data/torrents
             |-- /data/media
             |-- /data/personal
```
