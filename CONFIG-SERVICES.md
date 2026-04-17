# CONFIG-SERVICES.md — Configuration post-déploiement

Configuration manuelle des services après `make up`.
Toutes les URLs utilisent l'IP fixe `192.168.1.200`.
Communication inter-conteneurs via **noms Docker** (pas les IPs).

---

## Ordre de configuration recommandé

1. qBittorrent (catégories d'abord — critique)
2. Prowlarr (indexeurs + download client)
3. Radarr
4. Sonarr
5. Lidarr
6. Bazarr
7. Jellyfin
8. Syncthing

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

### Hardware acceleration (Intel QuickSync)
`Dashboard → Playback → Transcoding` :
- Hardware acceleration : **Intel QuickSync Video (QSV)**
- Vérifier que `/dev/dri` est présent sur le host : `ls /dev/dri`
- Le device est déjà passé dans le docker-compose (`devices: /dev/dri:/dev/dri`)
- **Si `/dev/dri` est absent** (iGPU désactivé dans le BIOS ou machine sans iGPU Intel) : Jellyfin démarre quand même mais bascule en **software transcoding** (plus lent, charge CPU). Retirer le bloc `devices:` du docker-compose si l'erreur persiste au démarrage.

---

## 8. Syncthing — `http://192.168.1.200:8384`

### Sécuriser l'accès
`Settings → GUI` → définir un user/password → Save → Restart.

### Ajouter les dossiers à synchroniser
`+ Add Folder` :
- Folder Path : `/data/personal/photos`, `/data/personal/documents`, etc.
- Partager avec les appareils souhaités (téléphone, PC)

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
