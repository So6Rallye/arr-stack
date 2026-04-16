#!/usr/bin/env bash
set -e
STAMP=$(date +%F_%H-%M-%S)
DEST=${1:-/backup/$STAMP}
mkdir -p "$DEST/appdata" "$DEST/personal" "$DEST/configs"
rsync -a --delete /docker/appdata/ "$DEST/appdata/"
rsync -a --delete /data/personal/ "$DEST/personal/"
[ -f /etc/samba/smb.conf ] && rsync -a /etc/samba/smb.conf "$DEST/configs/"
echo "Backup complete: $DEST"
