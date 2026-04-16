# SMART Monitor Guide

Use SMART monitoring to track HDD health.

## Install tools

```bash
sudo apt update
sudo apt install smartmontools
```

## Check a disk

```bash
sudo smartctl -a /dev/sda
sudo smartctl -a /dev/sdb
```

## Watch for

- reallocated sectors
- pending sectors
- uncorrectable sectors
- CRC errors
- abnormal temperatures
- very high power-on hours

## Recommendation

Check monthly or before any RAID rebuild / migration.
