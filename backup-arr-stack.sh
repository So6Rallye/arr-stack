#!/usr/bin/env bash
set -e

# Load .env if present (for BACKUP_DEST)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  # shellcheck disable=SC1091
  set -a; source "$SCRIPT_DIR/.env"; set +a
fi

STAMP=$(date +%F_%H-%M-%S)
BASE="${BACKUP_DEST:-/backup}"
DEST=${1:-$BASE/$STAMP}

mkdir -p "$DEST/appdata" "$DEST/personal" "$DEST/configs"
rsync -a --delete /docker/appdata/ "$DEST/appdata/"
rsync -a --delete /data/personal/ "$DEST/personal/"
[ -f /etc/samba/smb.conf ]     && rsync -a /etc/samba/smb.conf    "$DEST/configs/"
[ -f /etc/mdadm/mdadm.conf ]   && rsync -a /etc/mdadm/mdadm.conf  "$DEST/configs/"
[ -f /etc/fstab ]              && rsync -a /etc/fstab              "$DEST/configs/"
echo "Backup complete: $DEST"
