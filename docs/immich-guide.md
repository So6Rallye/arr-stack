# Guide Immich — Gestion familiale des photos/vidéos

## Prérequis

- La stack Immich doit être démarrée : `make up-immich`
- Services en fonctionnement :
  - `immich-server` (serveur principal)
  - `immich-machine-learning` (reconnaissance faciale et CLIP)
  - `immich-postgres` (base de données)
  - `immich-redis` (cache)
- Accès à l'interface web : http://[IP-VM]:2283

## Création du compte administrateur

### Accès initial

1. Ouvrez un navigateur et allez à : http://[IP-VM]:2283
2. Vous êtes redirigé vers "Getting started"
3. Remplissez le formulaire :
   - **Email** : adresse email dédiée (ex : `admin@arr-server.local`)
   - **Nom d'utilisateur** : votre prénom ou nom
   - **Mot de passe** : mot de passe fort (il sera nécessaire pour les backups)

4. Validez le formulaire

Ce compte devient automatiquement **administrateur**.

### Recommandations

- Utilisez un email dédié à l'administration (pas votre email personnel principal)
- Conservez le mot de passe en lieu sûr (accès admin panel + backups de la DB)
- Cet email ne sera utilisé que pour la gestion, pas pour la sauvegarde d'appareils

## Création des comptes famille

### Accès admin

1. Connectez-vous avec le compte admin
2. Cliquez sur l'icône utilisateur en haut à droite → **Administration**
3. Dans le panneau Admin, allez à **Users** (Utilisateurs)
4. Cliquez sur **+ New user** (Nouvel utilisateur)

### Créer un compte parent

**Remplissez le formulaire :**
- **Email** : ex. `parent@arr-server.local`
- **Nom** : Prénom du parent
- **Mot de passe** : génériez un mot de passe ou laissez l'utilisateur le définir
- **Quota de stockage** : Recommandation : Laisser **illimité** (ou fixer à 200GB minimum)
- **Permissions** : Laissez les valeurs par défaut (l'utilisateur peut déplacer ses photos, créer des albums partagés)

Validez pour créer le compte.

### Créer un compte enfant

Même procédure que pour le parent, avec les paramètres :
- **Email** : ex. `enfant@arr-server.local`
- **Quota de stockage** : Vous pouvez fixer un quota plus petit (ex. 50GB) selon vos préférences

## Configuration de l'app mobile Immich

### Télécharger l'app

- **iOS** : App Store → Immich (https://apps.apple.com/...)
- **Android** : Google Play → Immich (https://play.google.com/...)

### Configurer la connexion

1. Ouvrez l'app Immich
2. Sur l'écran "Login" / "Sign In", cherchez une option **"Login with custom server URL"** ou **"Self-hosted"**
3. **URL du serveur** : 
   - **Sur le LAN local** : http://[IP-VM-locale]:2283 (ex. http://192.168.1.100:2283)
   - **Depuis l'extérieur** : http://[IP-Tailscale]:2283 (ex. http://100.x.x.x:2283) — nécessite Tailscale activé
4. **Email** : l'email du compte créé (ex. `parent@arr-server.local`)
5. **Mot de passe** : le mot de passe du compte

Validez la connexion.

### Activer la sauvegarde automatique

Une fois connecté dans l'app :

1. Allez à **Library** (Bibliothèque) en bas à gauche
2. Tapez sur l'icône engrenage ⚙️ (Paramètres)
3. Allez à **Backup** (Sauvegarde)
4. Activez **"Background Backup"** (Sauvegarde d'arrière-plan)
5. Configurez les options selon vos préférences :
   - **Backup mode** : WiFi seulement (recommandé) ou tout type de connexion
   - **Backup fréquency** : Quotidienne par défaut

Les photos et vidéos de la galerie seront synchronisées automatiquement.

## Activation de la reconnaissance faciale

### Activer le Machine Learning

1. Depuis l'interface admin web (Administration → Machine Learning)
2. Vous verrez les services de Machine Learning disponibles
3. Cochez **"Facial Recognition"** (Reconnaissance faciale)
4. Cliquez sur **"Enable"** pour activer

### Premier traitement

- Le système va analyser **toutes vos photos** et détecter les visages
- **Durée estimée** : plusieurs heures à plusieurs jours, selon le volume de photos
- Les visages sont groupés automatiquement par personne
- Vous pouvez donner des noms aux groupes après le traitement

### Vérifier la progression

Dans Administration → Machine Learning, vous verrez la barre de progression du traitement. Les visages reconnus apparaîtront progressivement dans **Library → People** (Personnes).

## Smart Search — Recherche intelligente avec CLIP

### Fonctionnement

Immich inclut par défaut **CLIP** (Contrastive Language-Image Pre-training), qui permet de chercher des photos par description texte naturelle, sans tags ni métadonnées.

**Exemples de recherches** :
- "photos à la mer" → trouve toutes les photos de plage
- "enfant qui rit" → trouve les photos avec des enfants qui sourient
- "coucher de soleil" → recherche les ambiances

### Vérifier qu'il est activé

1. Administration → Machine Learning
2. Cherchez **CLIP** dans la liste
3. Vérifiez que le statut est **"Enabled"**

CLIP est activé et fonctionnel automatiquement via le service `immich-machine-learning`.

### Utiliser Smart Search

1. Dans Library, tapez dans la barre **Search**
2. Entrez une description en français ou anglais
3. Les résultats intelligents s'affichent instantanément

## Partage de photos entre comptes famille

### Créer un album partagé

1. Dans Library, sélectionnez les photos à partager
2. Cliquez sur **"Create Album"** → donnez un nom
3. Ouvrez l'album → tapez sur l'icône **Partage** (ou bouton **Share**)
4. Ajoutez les autres utilisateurs de la famille (ex. `enfant@arr-server.local`)
5. Définissez les permissions : **Viewer** (lecture seule) ou **Editor** (modification)

### Avantage

Les photos ne sont stockées qu'une seule fois. Les autres comptes y accèdent sans dupliquer l'espace disque.

## Vérification du stockage

### Accéder aux informations de stockage

1. Administration → **Storage** (Stockage)
2. Vous verrez le montage du chemin Docker principal

### Point de montage Immich

Le conteneur Immich monte :
- **Chemin dans le conteneur** : `/usr/src/app/upload`
- **Chemin sur l'hôte** : `/data/photos/library` (selon votre docker-compose.yml)

Les photos uploadées, les métadonnées et les fichiers traités apparaissent dans ce répertoire.

### Vérifier l'espace disque

```bash
# Sur le serveur
df -h /data/photos/library
```

Vous pouvez aussi consulter l'Administration → Storage pour voir l'espace utilisé.

## Backup de la base de données Immich

### Méthode intégrée — Script arr-stack

Le script `backup-arr-stack.sh` du projet couvre automatiquement :
- **PostgreSQL** pour Immich → `/docker/appdata/immich-postgres`
- Toutes les données de configuration

### Backup manuel (si nécessaire)

Si vous souhaitez faire un backup manuel de la base PostgreSQL :

```bash
docker exec immich-postgres pg_dump -U immich immich > /backup/immich-db-$(date +%Y%m%d).sql
```

**Explication** :
- `docker exec` : exécute une commande dans le conteneur PostgreSQL
- `pg_dump` : exporte la base de données
- `-U immich` : utilisateur PostgreSQL (défini dans docker-compose.yml)
- `immich` : nom de la base de données
- `/backup/...` : le fichier est sauvegardé sur l'hôte

### Restaurer depuis un backup

```bash
# Connectez-vous au conteneur
docker exec -i immich-postgres psql -U immich immich < /backup/immich-db-YYYYMMDD.sql
```

Attendez que le service `immich-server` soit redémarré après la restauration.

## Recommandations de sécurité

1. **Mot de passe admin fort** — Au moins 16 caractères, avec majuscules, minuscules, chiffres et caractères spéciaux
2. **Accès Tailscale seulement** — N'exposez jamais le port 2283 directement à Internet
3. **Backups réguliers** — Exécutez `backup-arr-stack.sh` au moins une fois par semaine
4. **Mise à jour** — Vérifiez les mises à jour de la version Immich (Documentation Docker officielle)

## Dépannage courant

### L'app mobile ne peut pas se connecter

- Vérifiez l'URL du serveur : doit être accessible (LAN ou via Tailscale)
- Vérifiez le mot de passe et l'email
- Redémarrez l'app
- Si depuis l'extérieur : vérifiez que Tailscale est actif sur le téléphone et le serveur

### La reconnaissance faciale prend trop de temps

- C'est normal pour un volume important de photos
- Vérifiez les ressources : `docker stats immich-machine-learning`
- Vous pouvez laisser le service tourner en arrière-plan

### Espace disque faible

- Vérifiez `/data/photos/library` : `du -sh /data/photos/library`
- Supprimez les photos dupliquées dans l'interface (Administration → Duplicate Detection)
- Augmentez l'espace disque alloué à la VM si nécessaire
