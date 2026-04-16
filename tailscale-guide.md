# Tailscale Guide

Use Tailscale if you want secure remote access to the server without exposing service ports directly to the Internet.

## Why Tailscale is recommended

- encrypted private mesh VPN
- simple deployment
- avoids public port forwarding
- ideal for Jellyfin admin access, SMB maintenance and web UIs

## Typical uses

- access Jellyfin admin remotely
- access ARR web UIs remotely
- reach Samba shares securely
- manage the server while away from home

## Recommendation for this project

Keep LAN access first.

Once everything is stable locally, add Tailscale as the remote layer.

## Important principle

Do not expose qBittorrent or admin panels directly to the public Internet.
