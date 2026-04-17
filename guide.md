# Guide d'installation et de configuration - ARR Stack Home Server

Ce guide regroupe toutes les instructions utiles pour installer et configurer une stack home server basée sur :

- Radarr
- Sonarr
- Lidarr
- Bazarr
- Prowlarr
- qBittorrent
- Jellyfin
- Syncthing
- Samba / SMB côté hôte

Cette version est pensée pour un usage simple, fiable et accessible sur Debian ou Ubuntu, avec une structure de dossiers compatible hardlinks et une séparation propre entre médias, téléchargements et fichiers personnels.

---

## 1. Vue d'ensemble

### Services inclus

- **Radarr** : gestion des films
- **Sonarr** : gestion des séries
- **Lidarr** : gestion de la musique
- **Bazarr** : sous-titres
- **Prowlarr** : gestion centralisée des indexers
- **qBittorrent** : client torrent
- **Jellyfin** : serveur média
- **Syncthing** : synchronisation fichiers perso / téléphone
- **Samba** : partages réseau SMB sur l'hôte

### Objectifs

- installation propre
- maintenance simple
- accès local facile
- stockage cohérent
- compatibilité hardlinks
- extension future possible

---

## 2. Architecture recommandée

### SSD système

À utiliser pour :

- Debian / Ubuntu
- Docker
- `/docker/appdata`

### Stockage données

À utiliser pour :

- `/data/torrents`
- `/data/media`
- `/data/personal`

### Arborescence recommandée

```text
/docker/appdata/
  radarr/
  sonarr/
  lidarr/
  bazarr/
  prowlarr/
  qbittorrent/
  jellyfin/
  syncthing/

/data/
  torrents/
    tv/
    movies/
    music/
  media/
    tv/
    movies/
    music/
  personal/
    photos/
    phone-camera/
    videos/
    documents/
    shared/
```

### Règle importante sur les hardlinks

`/data/torrents` et `/data/media` doivent être sur **le même filesystem**.

C'est ce qui permet aux hardlinks de fonctionner correctement entre les fichiers téléchargés et la bibliothèque finale.

---

## 3. Prérequis

- Debian 12 ou Ubuntu Server récent
- Docker Engine
- Docker Compose plugin
- un volume monté sur `/data`
- idéalement `/docker/appdata` sur SSD

---

## 4. Installation de Docker

Références officielles :

- https://docs.docker.com/engine/install/
- https://docs.docker.com/compose/

Préparation de base :

```bash
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
```

Ensuite, suivre la documentation officielle Docker adaptée à ton système.

Une fois le dépôt Docker configuré, installer Docker et Compose :

```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl status docker
sudo docker run hello-world
docker compose version
```

---

## 5. Création de la structure de dossiers

Créer la structure suivante :

```bash
sudo mkdir -p /data/{torrents/{tv,movies,music},media/{tv,movies,music},personal/{photos,phone-camera,videos,documents,shared}}
sudo apt install tree
tree /data
sudo chown -R 1000:1000 /data
sudo chmod -R a=,a+rX,u+w,g+w /data
ls -ln /data
```

### À quoi servent ces dossiers

- `/data/torrents/...` → dossiers de téléchargement qBittorrent
- `/data/media/...` → bibliothèque finale utilisée par Jellyfin, Radarr, Sonarr et Lidarr
- `/data/personal/...` → fichiers personnels, photos téléphone, vidéos, documents et partages SMB

---

## 6. Préparation de `/docker/appdata`

Créer les dossiers de configuration :

```bash
sudo mkdir -p /docker/appdata/{radarr,sonarr,lidarr,bazarr,prowlarr,qbittorrent,jellyfin,syncthing}
sudo chown -R 1000:1000 /docker/appdata
```

### Vérifier UID / GID

Le compose utilise généralement :

- `PUID=1000`
- `PGID=1000`

Vérifier avec :

```bash
id
```

Si ton utilisateur principal n'est pas `1000:1000`, il faudra adapter le `docker-compose.yml`.

---

## 7. Vérifications avant lancement

### Vérifier que les ports sont libres

Ports utilisés par défaut :

- 8080
- 6881
- 7878
- 8989
- 8686
- 6767
- 9696
- 8096
- 8384

---

## 8. Quick start

1. Installer Docker et Docker Compose
2. Créer la structure `/data`
3. Créer `/docker/appdata`
4. Vérifier UID/GID
5. Placer `docker-compose.yml` dans le dossier du projet
6. Lancer la stack
7. Configurer qBittorrent
8. Configurer Radarr / Sonarr / Lidarr
9. Lier Prowlarr aux apps
10. Ajouter les bibliothèques Jellyfin
11. Configurer Syncthing
12. Configurer Samba si besoin

---

## 9. Démarrage de la stack

Depuis le dossier contenant `docker-compose.yml` :

```bash
sudo docker compose up -d
```

Pour redémarrer plus tard :

```bash
sudo docker compose down
sudo docker compose up -d
```

---

## 10. URLs des services

### Depuis le serveur

- qBittorrent : `http://localhost:8080`
- Prowlarr : `http://localhost:9696`
- Radarr : `http://localhost:7878`
- Sonarr : `http://localhost:8989`
- Lidarr : `http://localhost:8686`
- Bazarr : `http://localhost:6767`
- Jellyfin : `http://localhost:8096`
- Syncthing : `http://localhost:8384`

### Depuis un autre appareil du réseau local

Remplacer `IP_DU_SERVEUR` par l'IP du serveur :

- `http://IP_DU_SERVEUR:8080`
- `http://IP_DU_SERVEUR:9696`
- `http://IP_DU_SERVEUR:7878`
- `http://IP_DU_SERVEUR:8989`
- `http://IP_DU_SERVEUR:8686`
- `http://IP_DU_SERVEUR:6767`
- `http://IP_DU_SERVEUR:8096`
- `http://IP_DU_SERVEUR:8384`

---

## 11. Premier login qBittorrent

Récupérer le mot de passe temporaire :

```bash
sudo docker logs qbittorrent
```

Tu devrais voir quelque chose comme :

- utilisateur : `admin`
- mot de passe temporaire généré

Ensuite, connecte-toi à l'interface WebUI et change les identifiants si besoin.

---

## 12. Réglages recommandés qBittorrent

Créer les catégories suivantes :

- `movies`
- `tv`
- `music`

Utiliser ces chemins :

- `movies`
- `tv`
- `music`

Puis aller dans :

`Tools > Options > Downloads`

Réglages recommandés :

- **Default Save Path** : `/data/torrents`
- **Default Torrent Management Mode** : `Automatic`
- **When Torrent Category changed** : `Relocate torrent`
- **When Default Save Path Changed** : `Switch affected torrents to Manual Mode`
- **When Category Save Path Changed** : `Switch affected torrents to Manual Mode`

Activer aussi :

- `Use Subcategories`
- `Use Category paths in Manual Mode`

---

## 13. Configuration des applications ARR

### Radarr

URL :

```text
http://IP_DU_SERVEUR:7878
```

Réglages recommandés :

- Root Folder : `/data/media/movies`
- activer **Use Hardlinks instead of Copy**

Client qBittorrent :

- Host : `qbittorrent`
- Port : `8080`
- SSL : désactivé
- Category : `movies`

---

### Sonarr

URL :

```text
http://IP_DU_SERVEUR:8989
```

Réglages recommandés :

- Root Folder : `/data/media/tv`
- activer **Use Hardlinks instead of Copy**

Client qBittorrent :

- Host : `qbittorrent`
- Port : `8080`
- SSL : désactivé
- Category : `tv`

---

### Lidarr

URL :

```text
http://IP_DU_SERVEUR:8686
```

Réglages recommandés :

- Root Folder : `/data/media/music`

Client qBittorrent :

- Host : `qbittorrent`
- Port : `8080`
- SSL : désactivé
- Category : `music`

---

### Prowlarr

URL :

```text
http://IP_DU_SERVEUR:9696
```

Ajouter qBittorrent comme client de téléchargement avec :

- Host : `qbittorrent`
- Port : `8080`
- SSL : désactivé

Puis connecter :

- Radarr
- Sonarr
- Lidarr

à l'aide de leurs clés API.

---

### Bazarr

URL :

```text
http://IP_DU_SERVEUR:6767
```

Configurer ensuite :

- profils de langue
- fournisseurs de sous-titres
- intégration Radarr et Sonarr

---

## 14. Jellyfin

URL :

```text
http://IP_DU_SERVEUR:8096
```

Bibliothèques recommandées :

- Movies → `/data/media/movies`
- TV Shows → `/data/media/tv`
- Music → `/data/media/music`

### Transcode — stratégie Phase 1

Transcode hardware **désactivé par défaut**. Stratégie = **direct-play pur** via le serveur DLNA Jellyfin vers le Freebox Player Ultra, qui décode H.265 nativement en hardware.

Activer DLNA dans Jellyfin : Dashboard → Plugins → DLNA (ou Dashboard → Networking → DLNA selon version).

Clients direct-play validés : Freebox Player Ultra (DLNA), Jellyfin Android TV, Jellyfin Media Player (desktop), Infuse (Apple TV).

Passthrough NVIDIA (GTX 1060 NVENC) documenté comme option future dans `docs/gpu-passthrough-guide.md` — non activé en Phase 1 (la GTX 1060 reste la sortie console physique de l'hôte Proxmox).

---

## 15. Syncthing

URL :

```text
http://IP_DU_SERVEUR:8384
```

Usage recommandé :

- uploads appareil photo téléphone → `/data/personal/phone-camera`
- photos triées → `/data/personal/photos`
- vidéos → `/data/personal/videos`
- documents → `/data/personal/documents`

Cas d'usage typiques :

- upload automatique des photos téléphone
- synchronisation de documents entre plusieurs PC
- sauvegarde légère sans stack cloud complète

---

## 16. SMB / Samba

Samba n'est **pas** lancé dans Docker dans cette configuration.

C'est volontaire : pour ce projet, Samba est plus propre et plus fiable directement sur l'hôte Debian / Ubuntu.

### Installer Samba

```bash
sudo apt update
sudo apt install samba smbclient
```

### Éditer la configuration Samba

```bash
sudo nano /etc/samba/smb.conf
```

Exemple de partages :

```ini
[personal]
   path = /data/personal
   browseable = yes
   read only = no
   create mask = 0664
   directory mask = 0775
   valid users = tonuser

[media]
   path = /data/media
   browseable = yes
   read only = yes
   valid users = tonuser
```

Créer ensuite le mot de passe Samba et redémarrer le service :

```bash
sudo smbpasswd -a tonuser
sudo systemctl restart smbd
sudo systemctl enable smbd
```

### Politique recommandée

- partage `personal` : lecture / écriture
- partage `media` : lecture seule

Cela évite les modifications accidentelles dans la bibliothèque média gérée par les apps ARR et Jellyfin.

---

## 17. Vérification des hardlinks

Les hardlinks doivent fonctionner entre `/data/torrents` et `/data/media`.

Pour vérifier, comparer les numéros d'inode :

```bash
ls -i /data/media/movies/<fichier>
ls -i /data/torrents/movies/<fichier>
```

Si l'inode est identique, les hardlinks fonctionnent correctement.

---

## 18. Dépannage

### Les fichiers sont copiés au lieu d'être hardlinkés

Causes fréquentes :

- source et destination pas sur le même filesystem
- permissions incorrectes
- mauvais chemins configurés dans les applications

### Les fichiers ne remontent pas dans la bibliothèque média

Vérifier :

- Activity / Queue dans Radarr ou Sonarr
- catégorie qBittorrent
- chemins root folder ARR
- permissions sur `/data`

### qBittorrent n'organise pas correctement les téléchargements

Vérifier :

- les catégories existent
- Default Save Path = `/data/torrents`
- le mode automatique est activé

---

## 19. Checklist post-installation

Une fois la stack lancée, vérifier les points suivants :

- Docker démarre correctement
- tous les conteneurs sont sains
- les catégories qBittorrent sont créées
- Radarr, Sonarr et Lidarr utilisent les bons root folders
- Prowlarr est connecté aux apps
- les bibliothèques Jellyfin sont ajoutées
- les dossiers Syncthing sont créés et synchronisés
- les partages Samba sont accessibles depuis un autre appareil
- les hardlinks fonctionnent correctement

---

## 20. Notes de sécurité

Ne pas exposer directement ces ports sur Internet.

Pour un accès distant sécurisé, préférer :

- Tailscale
- un VPN privé
- une couche d'accès sécurisée contrôlée

---

## 21. Philosophie de la stack

Cette stack est pensée pour un serveur personnel orienté :

- automatisation média
- fichiers personnels
- synchronisation téléphone
- accès LAN simple
- faible maintenance

Principe directeur :

- Docker pour les applications
- Samba sur l'hôte pour les partages SMB
- Syncthing pour la synchro perso
- Jellyfin pour la lecture média

---

## 22. Notes importantes

- `TZ` est réglé sur `Europe/Paris`
- qBittorrent conserve explicitement `PUID`, `PGID` et `TZ`
- Syncthing est inclus pour les fichiers personnels et la synchro téléphone
- Jellyfin tourne en direct-play pur (DLNA → Freebox Player Ultra) — pas de transcode hardware en Phase 1
- `/data/personal` est inclus dans la structure de dossiers

---

## 23. Améliorations possibles

- Tailscale pour l'accès distant
- scripts de sauvegarde pour `/docker/appdata`
- snapshots / backups VM Proxmox (Datacenter → Backup)
- passthrough GPU NVIDIA (GTX 1060) documenté comme option future — voir `docs/gpu-passthrough-guide.md`
- support `.env` optionnel pour une personnalisation plus propre
