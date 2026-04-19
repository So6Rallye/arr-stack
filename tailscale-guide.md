# Guide Tailscale — Accès distant sécurisé

## Pourquoi Tailscale

Tailscale offre un VPN mesh chiffré de bout en bout qui permet d'accéder au serveur de n'importe où, sans risque :

- **VPN mesh chiffré** — Communication sécurisée entre tous vos appareils (PC, téléphone, Mac, etc.)
- **Pas d'ouverture de ports sur la Freebox** — Aucune exposition directe à Internet
- **IP fixe 100.x.x.x** — Adresse Tailscale stable dans le réseau privé virtuel
- **Accès multi-appareils** — Un seul compte pour tous vos appareils
- **Gratuit pour usage personnel** — Jusqu'à 3 appareils gratuitement

## Installation sur Debian 12

### Étape 1 : Installer Tailscale

Connectez-vous au serveur (SSH sur la VM Proxmox) et exécutez :

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

### Étape 2 : Démarrer Tailscale

```bash
sudo tailscale up
```

Une URL d'authentification s'affiche dans le terminal. Ouvrez-la dans votre navigateur et authentifiez-vous avec votre compte Tailscale (créer un compte gratuit si nécessaire sur https://login.tailscale.com).

Acceptez l'invitation pour ajouter ce serveur à votre réseau Tailscale.

### Étape 3 : Vérification de l'installation

```bash
tailscale status
```

La sortie doit afficher :

```
   100.x.x.x   arr-server          linux-amd64   -
```

Cette IP `100.x.x.x` est votre adresse Tailscale. Notez-la pour la configuration des clients.

## Accès aux services via Tailscale

Une fois Tailscale activé, tous les services sont accessibles à distance via les URLs Tailscale :

| Service | Port local | URL Tailscale |
|---|---|---|
| Jellyfin | 8096 | http://100.x.x.x:8096 |
| Jellyseerr | 5055 | http://100.x.x.x:5055 |
| Immich | 2283 | http://100.x.x.x:2283 |
| qBittorrent | 8080 | http://100.x.x.x:8080 |
| Syncthing | 8384 | http://100.x.x.x:8384 |

Remplacez `100.x.x.x` par l'IP obtenue avec `tailscale status`.

## Principe important : Ne jamais exposer directement à Internet

**⚠️ Règle d'or :** Ces services doivent UNIQUEMENT être accessibles via Tailscale. Ne configurez jamais :
- La redirection de ports sur la Freebox
- Un proxy inverse ou VPN classique qui exposerait les ports
- L'accès direct par IP publique

Tailscale est la seule voie d'accès distant sécurisée. Utilisez-la systématiquement.

## Configuration des clients (PC, téléphone, tablette)

### Sur Windows / Mac / Linux

1. Télécharger Tailscale : https://tailscale.com/download
2. Installer et lancer l'application
3. Cliquer sur "Login" et s'authentifier avec le même compte que le serveur
4. L'app s'ajoute automatiquement au réseau du serveur

### Sur iOS / Android

1. Télécharger "Tailscale" depuis l'App Store ou Google Play
2. Ouvrir l'app et "Login" avec le même compte
3. Accepter l'invitation
4. Les services sont accessibles via l'IP Tailscale `100.x.x.x`

## Gestion de Tailscale

### Désactiver temporairement

```bash
sudo tailscale down
```

Les appareils perdent accès au serveur, mais la connexion reste configurée.

### Réactiver après désactivation

```bash
sudo tailscale up
```

### Déconnecter complètement

```bash
sudo tailscale logout
```

Vous devrez réauthentifier avec `sudo tailscale up` pour réactiver.

### Gestion en ligne

Accédez à https://login.tailscale.com pour :
- Voir tous les appareils connectés
- Vérifier les IP assignées
- Gérer les droits d'accès
- Ajouter / supprimer des appareils

## Accès admin et dépannage

### Vérifier l'état réseau Tailscale

```bash
ip addr | grep 100
```

Doit afficher une interface `tailscale0` avec l'IP `100.x.x.x`.

### Logs

```bash
sudo journalctl -u tailscaled -f
```

Suiv en temps réel les connexions Tailscale.

### Restart du service

```bash
sudo systemctl restart tailscaled
```

## Cas d'usage typique : Accès à Jellyfin depuis le téléphone

1. Installer Tailscale sur le téléphone
2. S'authentifier avec le même compte que le serveur
3. Ouvrir le navigateur et aller à : `http://100.x.x.x:8096` (remplacer `100.x.x.x` par l'IP réelle)
4. Vous êtes authentifié et en HTTPS chiffré, sans exposition directe

C'est la même adresse que sur le LAN local, mais via Tailscale sécurisé de n'importe où.
