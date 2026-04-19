# First Boot Checklist

Use this checklist after the first successful boot of the server.

---

## Hardware

- machine boots reliably
- BIOS time correct
- all disks detected
- SSD detected
- network available
- temperatures normal

---

## OS

- system updated
- sudo user created
- SSH working if used
- hostname set
- timezone correct

---

## Docker

- docker service running
- compose plugin available
- hello-world test passed

---

## Storage

- `/data` mounted
- `/docker/appdata` available
- permissions correct
- enough free space

---

## Media stack

- containers running
- ports reachable
- qBittorrent login works
- Jellyfin opens
- ARR apps open
- Jellyseerr opens (5055)
- Immich opens (2283)
- Navidrome opens (4533)
- Syncthing opens

---

## VPN (Gluetun)

- container running
- Gluetun VPN connected (verify: `docker exec gluetun curl -s ifconfig.me`)
- qBittorrent routes through VPN (verify: `docker exec qbittorrent curl -s ifconfig.me`)

---

## Accès distant (Tailscale)

- Tailscale installed on VM (`sudo apt install tailscale`)
- `sudo tailscale up` authenticated
- Tailscale IP assigned (verify: `tailscale status`)
- Jellyfin accessible via Tailscale IP:8096
- Jellyseerr accessible via Tailscale IP:5055
- Immich accessible via Tailscale IP:2283
- Navidrome accessible via Tailscale IP:4533

---

## Final checks

- backups planned
- Immich : compte parent + enfant créés
- Immich : app mobile configurée sur les téléphones
- Navidrome : compte admin créé (premier boot `http://192.168.1.200:4533`)
- Navidrome : comptes famille créés (Settings → Users)
- notes saved in repo
