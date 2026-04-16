# Upgrade Disks Guide

This guide explains how to upgrade an existing mirrored storage setup to larger drives with minimal disruption.

---

## Scenario

Current setup:

- 2 × 2 TB mirrored pair / RAID1

Target setup:

- 2 × larger drives (6 TB / 8 TB / 12 TB)

---

## Safe migration logic

Replace one disk at a time.

1. Replace disk A with new disk C
2. Rebuild mirror
3. Replace disk B with new disk D
4. Rebuild mirror again
5. Expand filesystem once both new drives are present

---

## Important notes

- Do not replace both disks at the same time.
- Verify rebuild status before the second replacement.
- Keep backups of appdata before storage work.
- Larger capacity becomes usable after both disks are upgraded and storage is expanded.

---

## Before starting

- backup `/docker/appdata`
- verify SMART on new disks
- identify current disks correctly
- ensure good cooling during rebuilds

---

## Final advice

Disk migrations are routine if done calmly and one step at a time.
