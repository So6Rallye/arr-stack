# Network Guide

This guide explains the recommended network setup for this ARR home server.

For this project, a fixed LAN IP is strongly recommended.

---

## Contexte Proxmox — bridge `vmbr0` et MAC virtuelle

La VM `arr-server` est attachée au bridge Proxmox `vmbr0` sur l'hôte `rp-pve-01`. Ce bridge relie la carte physique de l'hôte (`enp*` ou `eno*`) au LAN `192.168.1.0/24` : la VM apparaît donc comme un hôte standard sur le LAN, directement atteignable par la box et les autres machines.

Côté hôte Proxmox, vérifier que `vmbr0` est bien configuré et up :

```bash
# sur rp-pve-01
ip -br addr show vmbr0
brctl show vmbr0   # ou: bridge link
```

La config du bridge se trouve dans `/etc/network/interfaces` côté Proxmox. Exemple typique :

```
auto vmbr0
iface vmbr0 inet static
    address 192.168.1.10/24
    gateway 192.168.1.1
    bridge-ports enp4s0
    bridge-stp off
    bridge-fd 0
```

### MAC utilisée pour la réservation DHCP

La MAC à réserver côté Freebox **n'est pas** la MAC d'une carte physique : c'est la **MAC de la carte virtuelle** (`net0`) de la VM `arr-server`. Elle est générée automatiquement à la création de la VM, éditable ensuite via `Datacenter → arr-server → Hardware → Network Device` ou en CLI :

```bash
# sur l'hôte Proxmox
qm config 200 | grep net0
# net0: virtio=XX:XX:XX:XX:XX:XX,bridge=vmbr0
```

Pour la forcer à une valeur stable (utile si on recrée la VM) :

```bash
qm set 200 --net0 virtio=AA:BB:CC:DD:EE:FF,bridge=vmbr0
```

C'est **cette MAC** (`XX:XX:XX:XX:XX:XX` ci-dessus) qu'il faut utiliser dans la réservation DHCP Freebox pour obtenir l'IP fixe `192.168.1.200`.

---

## Recommended fixed IP

Use an address in the 200 range.

Recommended example:

- `192.168.1.200`

You can adapt the third octet if your LAN uses another subnet, but the idea is to keep a high fixed address that is easy to remember.

Examples:

- `192.168.0.200`
- `192.168.1.200`
- `192.168.10.200`

---

## Why a fixed IP matters

A fixed IP makes the server easier to use and maintain.

Benefits:

- stable URLs for Jellyfin and ARR apps
- cleaner Samba access
- easier Syncthing references
- easier bookmarks
- easier scripts and agent automation
- easier troubleshooting

---

## Best method: DHCP reservation on the router

The recommended approach is **not** to hardcode a static IP directly inside Debian first.

Instead, reserve a fixed IP in your router / DHCP server using the server MAC address.

### Why this method is better

- simpler to manage
- less risk of IP conflicts
- easier to change later
- central control from the router

---

## Suggested hostname

Example hostname:

- `arr-server`

Set it on the host with:

```bash
sudo hostnamectl set-hostname arr-server
```

This gives you a cleaner identity on the network.

---

## Find the current network information

Useful commands:

```bash
hostnamectl
ip a
ip route
```

To identify the MAC address of the main interface:

```bash
ip link
```

Look for the active interface, for example `enp3s0`, and note its MAC address.

---

## Reserve the IP on the router

In the router / DHCP settings, create a reservation for the server using its MAC address.

Recommended reservation:

- Hostname: `arr-server`
- IP: `192.168.1.200`

---

## Update `.env`

Once the fixed IP is chosen, update `.env`:

```env
SERVER_IP=192.168.1.200
```

---

## URLs with the fixed IP

Examples:

- `http://192.168.1.200:8080` → qBittorrent
- `http://192.168.1.200:9696` → Prowlarr
- `http://192.168.1.200:7878` → Radarr
- `http://192.168.1.200:8989` → Sonarr
- `http://192.168.1.200:8686` → Lidarr
- `http://192.168.1.200:6767` → Bazarr
- `http://192.168.1.200:8096` → Jellyfin
- `http://192.168.1.200:8384` → Syncthing

---

## Samba access examples

Examples from Windows:

```text
\\192.168.1.200\personal
\\192.168.1.200\media
```

---

## Why not rely on changing DHCP addresses

If the IP changes, you may break:

- bookmarked URLs
- SMB shortcuts
- Syncthing habits
- mobile app shortcuts
- TV app access
- agent automation flows

---

## Optional later improvements

Once the LAN IP is stable, you can later add:

- Tailscale for remote access
- local DNS / mDNS naming
- reverse proxy if really needed

---

## Final recommendation

For this project, reserve:

- hostname: `arr-server`
- fixed LAN IP: `192.168.1.200`

This is the cleanest and easiest base for the rest of the stack.
