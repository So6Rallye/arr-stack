# Restore Guide

Use this guide if the host fails and you need to rebuild quickly.

---

## Restore priority order

1. Install Debian or Ubuntu
2. Install Docker and Compose
3. Restore project files (`docker-compose.yml`, `.env`)
4. Restore `/docker/appdata`
5. Restore Samba config
6. Restore `/data/personal`
7. Restore media data if available
8. Start the stack

---

## Start after restore

```bash
sudo docker compose up -d
```

---

## Final checks

- containers healthy
- ARR apps open
- Jellyfin libraries present
- Syncthing folders available
- Samba shares accessible
