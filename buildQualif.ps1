$dossierCourant = Get-Location
$prod = Join-Path (Get-Location) "prod"
$distFolder = Join-Path (Get-Location) "frontend/dist"

# On supprime le dossier dist dans frontend
Remove-Item -Path $distFolder -Recurse -Force

# On se place dans le dossier frontend
Set-Location -Path "frontend/"

# On génère le build du frontend
npm run build:qualif

# On se place dans le dossier frontend
Set-Location -Path $dossierCourant

# On supprime le dossier prod
Remove-Item $prod -Recurse -Force

# On créer le dossier prod
New-Item -ItemType "directory" -Path $prod

# On copie le dossier dist dans le dossier prod
Copy-Item $distFolder -Destination (Join-Path $prod "\dist") -Recurse

# on copie les fichiers et dossier du backend dans le dossier de prod
Copy-Item './server.js', './node_modules', './serviceAccountKey.json', './ecosystem_production.config.js' -Destination $prod -Exclude "frontend/" -Recurse