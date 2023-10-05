#!/bin/bash

# Définissez vos chemins
dossierCourant=$(pwd)
prod="$dossierCourant/prod"
distFolder="$dossierCourant/frontend/dist"

# Supprimez le dossier dist dans frontend
rm -rf $distFolder

# Changez le répertoire courant dans le dossier frontend
cd frontend/

# Générez le build du frontend
npm run build:production

# Revenez dans le dossier courant
cd $dossierCourant

# Supprimez le dossier prod
rm -rf $prod

# Créez le dossier prod
mkdir -p $prod

# Copiez le dossier dist dans le dossier prod
cp -r $distFolder $prod/dist

# Copiez les fichiers et dossiers du backend dans le dossier prod
cp -r server.js node_modules serviceAccountKey.json $prod

# Créez le dossier Situations
mkdir -p $prod/situations