# Hardware and RAID Guide - ARR Stack Home Server

This guide covers the hardware preparation, storage strategy and RAID planning for a personal ARR / Jellyfin / Syncthing server.

It is written for the target machine discussed for this project:

- Lenovo desktop base
- Intel Core i5-6400
- Debian or Ubuntu Server
- Docker stack for ARR apps, Jellyfin and Syncthing

The goal is to keep the setup:

- simple
- reliable
- affordable
- easy to upgrade later

---

## 1. Recommended machine base

For this project, the old Lenovo desktop with an Intel i5 is a much better base than a small SBC such as a BTT Pi.

### Why the Lenovo is the better choice

- native SATA support
- stronger CPU
- better multitasking
- easier Docker host
- better Jellyfin support
- more stable storage handling
- easier future upgrades

### Why this matters

A stack with:

- qBittorrent
- Radarr
- Sonarr
- Lidarr
- Prowlarr
- Bazarr
- Jellyfin
- Syncthing

benefits much more from a small x86 desktop than from a low-power ARM board.

---

## 2. About the identified machine

Based on the reference that was shared earlier, the system corresponds to a Lenovo S510 with an Intel Core i5-6400.

### What this means in practice

- 4 cores / 4 threads
- enough power for ARR + qBittorrent + Jellyfin
- suitable for several direct-play streams
- Intel QuickSync can be useful for lightweight transcoding
- good enough for a home server build in 2026

### Practical verdict

This machine is a valid base for:

- Debian / Ubuntu Server
- Docker Compose
- Jellyfin
- ARR stack
- Syncthing
- SMB shares
- RAID1 or another local redundancy strategy

---

## 3. Custom build approach

If you want, you can strip the machine down and keep only:

- motherboard
- CPU
- cooler
- RAM
- PSU
- storage

This is a valid approach.

### Benefits

- easier airflow design
- easier disk mounting
- more room for future drives
- cleaner custom server build

### Important checks before doing that

- number of SATA ports available
- PSU connector compatibility
- CPU power connector availability
- motherboard front panel behavior
- enough airflow around drives

---

## 4. Storage strategy

The recommended layout is:

### SSD for system and configs

Use the SSD for:

- Debian or Ubuntu
- Docker
- `/docker/appdata`

### HDDs for data

Use the HDD array or data volume for:

- `/data/torrents`
- `/data/media`
- `/data/personal`

### Why this layout is recommended

- the system stays responsive
- container configs remain fast
- large media files stay on the data disks
- maintenance is easier
- backups are easier to reason about

---

## 5. About the two WD Caviar Black 2 TB drives

You mentioned having:

- 2 × 2 TB WD Caviar Black
- around 2010 era

### Honest recommendation

They can be used for:

- temporary setup
- testing
- learning
- initial RAID1

But they should be considered **aging drives**.

### Important caution

Drives from that period should not be trusted blindly for long-term critical storage.

Before using them, check their SMART health.

Example commands:

```bash
sudo apt install smartmontools
sudo smartctl -a /dev/sda
sudo smartctl -a /dev/sdb
```

### Watch especially for

- Reallocated sectors
- Current pending sectors
- Offline uncorrectable sectors
- CRC errors
- very high power-on hours

If SMART reports worrying values, do not build the long-term setup around them.

---

## 6. RAID goal in this project

Your goal is not performance.

Your main goal is:

- not losing everything if one drive dies
- not having to re-download and reorganize from scratch

For that, RAID1 is the most natural fit.

---

## 7. Why RAID1 makes sense here

With 2 identical drives:

- disk A mirrors disk B
- usable capacity = size of one disk
- if one disk dies, the array can keep running
- you replace the failed disk and rebuild

### In your current situation

With 2 × 2 TB:

- usable capacity = 2 TB
- one-disk fault tolerance

This matches your stated need well.

---

## 8. What RAID1 protects against

RAID1 helps against:

- single disk failure
- service interruption after one drive dies
- complete rebuild from zero after one disk failure

RAID1 does **not** protect against:

- accidental deletion
- corruption
- malware or ransomware
- user mistakes
- theft
- fire
- total machine loss

### Practical consequence

Even with RAID1, back up important configs such as:

- `/docker/appdata`
- Jellyfin config
- Radarr config
- Sonarr config
- Lidarr config
- Prowlarr config
- qBittorrent config
- Syncthing config

---

## 9. Recommended storage plan

### Phase 1 - Start with existing hardware

- SSD for system
- 2 × 2 TB old HDDs in RAID1
- Debian / Ubuntu
- Docker stack

This is acceptable as a temporary base.

### Phase 2 - Upgrade later

Replace the old drives with newer, larger disks.

Examples:

- 2 × 6 TB
- 2 × 8 TB
- 2 × 12 TB

### Why this is a good path

- low initial cost
- fast project start
- no need to wait for perfect hardware
- migration can happen later without rebuilding everything from scratch

---

## 10. Migration from 2 TB drives to larger drives

A common question is how to upgrade the RAID later.

### Recommended method

Replace the drives one by one.

Example:

Current array:

- disk A = 2 TB
- disk B = 2 TB

Future drives:

- disk C = 8 TB
- disk D = 8 TB

### Process

1. replace disk A with disk C
2. let the RAID rebuild
3. replace disk B with disk D
4. let the RAID rebuild again
5. expand the array/filesystem once both large disks are in place

### Important note

While one 2 TB disk is still present, the RAID usable size stays at 2 TB.

The extra capacity becomes available only after both old disks are replaced and the array is expanded.

---

## 11. Why not build this on the BTT Pi

A BTT Pi or similar SBC can run Docker and some services, but for this specific project it is less suitable.

### Weak points for this use case

- weaker CPU
- more fragile storage handling when external disks are involved
- less comfortable for RAID-like usage
- less headroom for Jellyfin and torrents
- less flexible upgrade path

### Verdict

For ARR + qBittorrent + Jellyfin + Syncthing + RAID, the Lenovo desktop is the more sensible foundation.

---

## 12. Hardware checks before installation

Before installing the OS, verify the following.

### BIOS / firmware

- AHCI mode enabled for SATA
- iGPU enabled if you want Jellyfin hardware acceleration
- boot order correct
- system date/time reasonable

### Storage

- SSD detected
- both HDDs detected
- SMART data looks acceptable
- enough SATA ports available

### Cooling

- CPU cooler clean and properly mounted
- airflow across HDD area
- no severe dust buildup

### Power

- PSU stable
- enough SATA power connectors
- no suspicious noise or instability

---

## 13. Intel QuickSync note

The i5-6400 platform may support Intel QuickSync depending on BIOS and host configuration.

### To benefit from it

- iGPU must be enabled in BIOS
- Linux host must expose `/dev/dri`
- Jellyfin compose includes:

```yaml
devices:
  - /dev/dri:/dev/dri
```

### Check on host

```bash
ls /dev/dri
```

If you see entries such as `card0` or `renderD128`, hardware acceleration may be available.

---

## 14. Recommended first build checklist

Before installing the stack, try to validate all of this:

- machine powers on reliably
- SSD available for OS
- 2 HDDs detected
- SMART checked
- BIOS storage mode set correctly
- iGPU enabled if needed
- enough airflow for a 24/7 build
- data strategy decided
- RAID plan understood

---

## 15. Practical recommendation for this project

### Best low-cost starting point

- Lenovo i5-6400 machine
- Debian 12 or Ubuntu Server
- SSD for system and Docker appdata
- 2 × 2 TB in RAID1 as a temporary array
- ARR stack + Jellyfin + Syncthing + Samba

### Best medium-term plan

- keep the software stack as-is
- upgrade to larger, healthier drives later
- migrate disk by disk
- keep appdata backed up separately

---

## 16. Final advice

### Short version

- use the Lenovo, not the BTT Pi
- use SSD for the OS
- use RAID1 if your goal is to avoid starting from zero after one disk failure
- treat the old WD drives as temporary
- back up configs even with RAID

### Most important principle

RAID is not backup.

RAID helps you survive a disk failure.

Backup helps you survive everything else.
