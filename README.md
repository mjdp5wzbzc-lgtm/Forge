FORGE COACH : version autonome (application web installable)

Contenu : index.html, app.js, engine.js, data.js, body.js, sw.js, manifest.webmanifest, icons/
Aucun serveur ni base de données nécessaire : il suffit d'héberger ce dossier sur un site en HTTPS.

Mise en ligne gratuite la plus simple (depuis un ordinateur) :
1. Décompressez le zip.
2. Allez sur https://app.netlify.com/drop
3. Glissez le dossier « forge » dans la page. Vous obtenez une adresse https://….netlify.app
(Alternatives : GitHub Pages, Vercel, Cloudflare Pages.)

Installation sur iPhone :
1. Ouvrez l'adresse dans Safari.
2. Bouton Partager > « Sur l'écran d'accueil » > Ajouter.
L'application s'ouvre alors en plein écran et fonctionne hors connexion après la première ouverture.

Données :
- Enregistrées uniquement sur l'appareil (stockage du navigateur), sans compte.
- Profil > Données > Exporter : crée une sauvegarde JSON (à garder dans Fichiers/iCloud).
- Profil > Données > Importer : restaure la sauvegarde, ou transfère vers un autre appareil.
- Sur iPhone, utilisez toujours l'icône de l'écran d'accueil : Safari et l'icône n'ont pas le même stockage.

Ouvrir index.html directement depuis le disque fonctionne aussi, mais sans mode hors connexion ni installation.
