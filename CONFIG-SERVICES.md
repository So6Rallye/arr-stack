# CONFIG-SERVICES.md — Configuration post-déploiement

Configuration manuelle des services après `make up`.
Cible : VM Debian 12 `arr-server` sur Proxmox VE (`rp-pve-01`, Ryzen 3700x, 62 GiB ECC).
Toutes les URLs utilisent l'IP fixe `192.168.1.200`.
Communication inter-conteneurs via **noms Docker** (pas les IPs).

---

## Ordre de configuration recommandé

0. Gluetun (vérification VPN)
1. qBittorrent (catégories d'abord — critique)
2. Prowlarr (indexeurs + download client)
3. Radarr
4. Sonarr
5. Lidarr
6. Bazarr
7. Jellyfin
8. Syncthing
9. FlareSolverr (proxy Prowlarr)
10. Jellyseerr (demandes media)
11. Immich (photos famille)
12. Tailscale (accès distant)
13. Navidrome (serveur musique)

---

## 0. Gluetun — Vérification VPN

### Vérifier que le VPN est actif
```bash
docker exec gluetun curl -s ifconfig.me
# → doit retourner une IP ProtonVPN, PAS l'IP Freebox (192.168.x.x)
```

### Vérifier que qBittorrent passe par le VPN
```bash
docker exec qbittorrent curl -s ifconfig.me
# → même IP que Gluetun
```

Si l'une ou l'autre commande échoue ou retourne l'IP locale : vérifier `WIREGUARD_PRIVATE_KEY` dans `.env`.

---

## 1. qBittorrent — `http://192.168.1.200:8080`

### Récupérer le mot de passe temporaire
```bash
docker logs qbittorrent
```
Chercher la ligne : `The WebUI administrator password was not set. A temporary password is provided for this session: <password>`

Login : `admin` / mot de passe temporaire depuis les logs.

### Changer le mot de passe
`Tools → Options → WebUI` → changer user/password → Save (scroller en bas)

### Étape 1 — Créer les catégories EN PREMIER
> ⚠️ Créer les catégories AVANT de configurer les Downloads — ordre inverse = catégories qui disparaissent.

Panneau gauche → Categories → All → clic droit → Add Category :

| Catégorie | Save Path |
|---|---|
| `movies` | `movies` |
| `tv` | `tv` |
| `music` | `music` |

### Étape 2 — Configurer les Downloads
`Tools → Options → Downloads → Saving Management` :

| Paramètre | Valeur |
|---|---|
| Default Torrent Management Mode | **Automatic** |
| When Torrent Category changed | **Relocate torrent** |
| When Default Save Path Changed | Switch affected torrents to Manual Mode |
| When Category Save Path Changed | Switch affected torrents to Manual Mode |
| Use Subcategories | ✅ coché |
| Use Category paths in Manual Mode | ✅ coché |
| Default Save Path | `/data/torrents` |

Scroller en bas → Save.

---

## 2. Prowlarr — `http://192.168.1.200:9696`

### Authentification
Settings → General → Authentication : **Form (login page)** → définir user/password → Save.

### Ajouter qBittorrent comme download client
`Settings → Download Clients → +` → qBittorrent :

| Champ | Valeur |
|---|---|
| Host | `qbittorrent` ← nom Docker, pas l'IP |
| Port | `8080` |
| Username | admin |
| Password | *(celui défini dans qBittorrent)* |
| Use SSL | ❌ décoché |

Test → ✅ vert → Save.

### Ajouter les indexeurs
`Indexers → + → Add Indexer` → chercher et ajouter les indexeurs souhaités.

> Les connexions ARR apps (Radarr, Sonarr, Lidarr) se configurent **depuis chaque app** → l'API key est copiée dans Prowlarr après.

---

## 3. Radarr — `http://192.168.1.200:7878`

### Authentification
Settings → General → Authentication : Form → définir user/password → Save.

### Root Folder
`Settings → Media Management → Add Root Folder` → `/data/media/movies`

### Activer les hardlinks (CRITIQUE)
`Settings → Media Management → Show Advanced → Importing` :
- **Use Hardlinks instead of Copy** → ✅ coché

### Options recommandées (optionnel)
- Rename Movies → ✅
- Delete empty movie folders during disk scan → ✅
- Import Extra Files → ✅ → champ : `srt,sub,nfo`

### Download client
`Settings → Download Clients → +` → qBittorrent :

| Champ | Valeur |
|---|---|
| Host | `qbittorrent` |
| Port | `8080` |
| Username | admin |
| Password | *(qBittorrent password)* |
| Category | `movies` |
| Use SSL | ❌ |

Test → ✅ → Save.

### Lier à Prowlarr
1. `Settings → General` → copier la **Clé API**
2. Prowlarr → `Settings → Apps → +` → Radarr :
   - Prowlarr Server : `http://prowlarr:9696`
   - Radarr Server : `http://radarr:7878`
   - API Key : *(coller)*
3. Test → ✅ → Save

---

## 4. Sonarr — `http://192.168.1.200:8989`

### Authentification
Settings → General → Authentication : Form → définir user/password → Save.

### Root Folder
`Settings → Media Management → Add Root Folder` → `/data/media/tv`

### Activer les hardlinks (CRITIQUE)
`Settings → Media Management → Show Advanced → Importing` :
- **Use Hardlinks instead of Copy** → ✅ coché

### Options recommandées (optionnel)
- Rename Episodes → ✅
- Delete empty series and season folders → ✅
- Import Extra Files → ✅ → `srt,sub,nfo`

### Download client
`Settings → Download Clients → +` → qBittorrent :

| Champ | Valeur |
|---|---|
| Host | `qbittorrent` |
| Port | `8080` |
| Category | `tv` ← **pas** `tv-sonarr` (défaut incorrect) |
| Use SSL | ❌ |

Test → ✅ → Save.

### Lier à Prowlarr
1. `Settings → General` → copier la **Clé API**
2. Prowlarr → `Settings → Apps → +` → Sonarr :
   - Prowlarr Server : `http://prowlarr:9696`
   - Sonarr Server : `http://sonarr:8989`
   - API Key : *(coller)*
3. Test → ✅ → Save

---

## 5. Lidarr — `http://192.168.1.200:8686`

### Authentification
Settings → General → Authentication : Form → définir user/password → Save.

### Root Folder
`Settings → Media Management → Add Root Folder` → `/data/media/music` → Save.

### Download client
`Settings → Download Clients → +` → qBittorrent :

| Champ | Valeur |
|---|---|
| Host | `qbittorrent` |
| Port | `8080` |
| Category | `music` ← **pas** `lidarr` (défaut incorrect) |
| Use SSL | ❌ |

Test → ✅ → Save.

### Lier à Prowlarr
1. `Settings → General` → copier la **Clé API**
2. Prowlarr → `Settings → Apps → +` → Lidarr :
   - Prowlarr Server : `http://prowlarr:9696`
   - Lidarr Server : `http://lidarr:8686`
   - API Key : *(coller)*
3. Test → ✅ → Save

---

## 6. Bazarr — `http://192.168.1.200:6767`

### Authentification
Settings → General → Authentication : Form → définir user/password → Save.

### Langues
`Settings → Languages` → créer un profil (ex: "Français" ou "FR+EN") → Save.

### Providers (sources de sous-titres)
`Settings → Providers → +` → ajouter :
- OpenSubtitles.org *(compte gratuit requis)*
- Subscene *(optionnel)*
- Autres selon disponibilité

### Connecter Radarr et Sonarr
`Settings → Radarr` :
- Host : `radarr` / Port : `7878`
- API Key : *(clé Radarr)*
- Test → ✅ → Save

`Settings → Sonarr` :
- Host : `sonarr` / Port : `8989`
- API Key : *(clé Sonarr)*
- Test → ✅ → Save

### Synchroniser la bibliothèque existante
Onglet Movies ou Series → **Update All** pour importer la bibliothèque existante.

---

## 7. Jellyfin — `http://192.168.1.200:8096`

### Premier accès
Assistant de configuration au premier boot : créer un utilisateur admin + password.

### Ajouter les bibliothèques
`Dashboard → Libraries → Add Media Library` :

| Content Type | Dossier |
|---|---|
| Movies | `/data/media/movies` |
| Shows | `/data/media/tv` |
| Music | `/data/media/music` |

### Stratégie transcode — direct-play prioritaire

En Phase 1, **aucun transcode hardware n'est activé**. Le client principal est la **Freebox Player Ultra**, qui décode H.264/H.265/AAC nativement en hardware. L'accès à la bibliothèque se fait soit via DLNA (serveur intégré Jellyfin), soit via l'app Jellyfin Android TV. La lecture est donc **direct-play end-to-end**, sans passer par la CPU/GPU de la VM.

### Activer le serveur DLNA pour le Freebox Player

`Dashboard → Playback → DLNA` (ou `Dashboard → Networking → DLNA` selon la version) :
- **Enable DLNA server** : ✅
- **Enable DLNA Play To** : ✅ (optionnel — permet au Freebox Player de déclencher la lecture depuis Jellyfin)
- Aucun port supplémentaire à ouvrir — Jellyfin expose le DLNA sur le port 1900/UDP (SSDP) et 8096/TCP.

Après activation, la Freebox détecte automatiquement le serveur Jellyfin dans `Freebox Player → Multimédia → Serveurs UPnP/DLNA`.

### Clients validés en direct-play

- **Freebox Player Ultra** (DLNA ou app Jellyfin Android TV) — H.265 HW decode natif
- **Jellyfin Android TV** (Nvidia Shield, Chromecast with Google TV, box Android TV)
- **Jellyfin Media Player** (desktop Windows/macOS/Linux)
- **Infuse** (Apple TV, iOS, macOS) — H.265 HW decode natif

### Transcodage hardware — option future (non activée)

`Dashboard → Playback → Transcoding` reste sur **None** par défaut. Activer le transcode hardware **uniquement** si un client incompatible direct-play est identifié (rare avec les clients ci-dessus).

La procédure complète pour activer le passthrough GPU NVIDIA (GTX 1060 / NVENC) est documentée dans [docs/gpu-passthrough-guide.md](./docs/gpu-passthrough-guide.md). ⚠️ Cette opération **prive l'hôte Proxmox de sa seule sortie vidéo** — ne pas exécuter sans nécessité avérée.

---

## 8. Syncthing — `http://192.168.1.200:8384`

### Sécuriser l'accès
`Settings → GUI` → définir un user/password → Save → Restart.

### Ajouter les dossiers à synchroniser
`+ Add Folder` :
- Folder Path : `/data/personal/photos`, `/data/personal/documents`, etc.
- Partager avec les appareils souhaités (téléphone, PC)

---

## 9. FlareSolverr — `http://192.168.1.200:9696` (via Prowlarr)

FlareSolverr n'a pas d'interface propre. Il se configure dans Prowlarr.

### Ajouter FlareSolverr comme proxy dans Prowlarr
`Settings → Indexers → + (Indexer Proxies)` → FlareSolverr :

| Champ | Valeur |
|---|---|
| Name | FlareSolverr |
| Host | `http://flaresolverr:8191` |
| Tags | `cloudflare` |

Test → ✅ → Save.

### Appliquer aux indexeurs Cloudflare
Pour chaque indexeur bloqué par Cloudflare, dans Prowlarr :
- Ouvrir l'indexeur → Tags → ajouter `cloudflare`

---

## 10. Jellyseerr — `http://192.168.1.200:5055`

### Premier accès
Assistant de configuration : cliquer **"Sign In with Jellyfin"**.

### Connexion Jellyfin
| Champ | Valeur |
|---|---|
| Jellyfin URL | `http://jellyfin:8096` |
| Utilisateur | compte admin Jellyfin |
| Mot de passe | *(mot de passe admin Jellyfin)* |

Se connecter → autoriser → Save.

### Importer les utilisateurs Jellyfin
`Settings → Users → Import Jellyfin Users` → importer tous les utilisateurs.

### Activer les notifications (optionnel)
`Settings → Notifications → Email ou Discord` selon préférence.

---

## 11. Immich — `http://192.168.1.200:2283`

### Premier accès
Créer le **compte administrateur** au premier accès (email + mot de passe).

### Créer les comptes famille
`Administration → Users → Create User` :
- Compte parent : email + mot de passe + quota stockage si souhaité
- Compte enfant : email + mot de passe + quota stockage si souhaité

> Maximum 3 utilisateurs sur cette installation (admin + parent + enfant).

### Activer la reconnaissance faciale
`Administration → Machine Learning` :
- Facial Recognition → **Enabled** ✅
- CLIP (Smart Search) → **Enabled** ✅ (activé par défaut)
- Lancer un scan initial : `Jobs → Face Detection → All`

### App mobile
1. Télécharger **Immich** (App Store / Play Store)
2. Scanner le QR code depuis `http://192.168.1.200:2283` → Settings → Account → QR Code
3. Activer la sauvegarde automatique dans l'app

---

## 12. Tailscale

Voir guide complet : `tailscale-guide.md`

### Installation rapide
```bash
sudo apt install tailscale
sudo tailscale up
# → ouvrir le lien affiché dans un navigateur pour authentifier
```

### Vérifier l'IP Tailscale
```bash
tailscale status
# → IP 100.x.x.x assignée à arr-server
```

### Accès externe via Tailscale
Depuis n'importe quel appareil avec Tailscale installé :

| Service | URL |
|---|---|
| Jellyfin | `http://100.x.x.x:8096` |
| Jellyseerr | `http://100.x.x.x:5055` |
| Immich | `http://100.x.x.x:2283` |
| qBittorrent | `http://100.x.x.x:8080` |

---

## Vérifications finales

### DNS conteneurs
```bash
docker exec -it radarr cat /etc/resolv.conf
# Doit afficher 1.1.1.1 et 1.0.0.1
```

### Hardlinks
```bash
# Après un premier import réel :
ls -i /data/media/movies/<film>/<fichier.mkv>
ls -i /data/torrents/movies/<fichier.mkv>
# Les numéros d'inode doivent être identiques
```

### Fichiers bloqués dans la queue ARR
Si "Downloaded - Unable to Import Automatically" :
Activity → Queue → Manual Import (icône tête humaine) → confirmer le film → Import.

---

## Optionnel — FlareSolverr (bypass Cloudflare pour Prowlarr)

Si Prowlarr échoue à indexer certains sites (erreur Cloudflare), ajouter au `docker-compose.yml` :

```yaml
  flaresolverr:
    <<: *common-keys
    container_name: flaresolverr
    image: ghcr.io/flaresolverr/flaresolverr:latest
    ports:
      - 8191:8191
    environment:
      - LOG_LEVEL=info
```

Puis dans Prowlarr :
`Settings → Indexers → + (Indexer Proxies)` → FlareSolverr :
- Name : `FlareSolverr`
- Host : `http://flaresolverr:8191`
- Tags : `cloudflare`
- Save

Appliquer le tag `cloudflare` aux indexeurs concernés.

---

## 13. Navidrome — Serveur musique (Subsonic API)

**URL :** `http://192.168.1.200:4533`

### Premier boot — Compte admin

1. Ouvrir `http://192.168.1.200:4533`
2. Créer le compte admin (username + password) au premier lancement
3. La bibliothèque `/data/media/music` (montée en `/music`) est scannée automatiquement au démarrage

### Comptes famille

`Settings → Users → Create User` pour chaque membre :
- Choisir un username et mot de passe
- Chaque compte a ses propres playlists, favoris et historique d'écoute
- La bibliothèque musicale est commune (read-only partagé)

### Clients mobiles (Subsonic API)

| App | Plateforme | Téléchargement |
|---|---|---|
| **Ultrasonic** | Android (gratuit) | Play Store / F-Droid |
| **DSub** | Android (gratuit) | Play Store |
| **Amperfy** | iOS (gratuit) | App Store |

Configuration dans l'app :
- Server URL : `http://192.168.1.200:4533` (LAN) ou URL Tailscale
- Username / Password : compte créé dans Navidrome

### Accès distant via Tailscale

`http://<tailscale-ip>:4533` — fonctionne depuis n'importe où sans config supplémentaire.
