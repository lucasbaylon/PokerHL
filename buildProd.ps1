$dossierCourant = Get-Location
$prod = Join-Path (Get-Location) "prod"
$distFolder = Join-Path (Get-Location) "frontend/dist"

# On supprime le dossier prod
Remove-Item $prod -Recurse

# On copie le dossier dist dans le dossier prod
Copy-Item $distFolder -Destination (Join-Path $prod "\dist") -Recurse

# on copie les fichiers et dossier du backend dans le dossier de prod
Copy-Item './server.js', './package.json', './node_modules', './run.bat' -Destination $prod -Exclude "frontend/" -Recurse

# On créer le dossier Situations
New-Item -ItemType Directory -Path (Join-Path $prod "\situations")

# Création du zip final
Compress-Archive -Path $prod -DestinationPath (Join-Path $dossierCourant "\PokerTraining.zip")
