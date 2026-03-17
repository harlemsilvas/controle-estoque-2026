$sourceRoot = "C:\controle-estoque\front-end\dist"
$targetRoot = "C:\inetpub\controle-estoque-proxy"
$targetAssets = Join-Path $targetRoot "assets"

New-Item -ItemType Directory -Path $targetAssets -Force | Out-Null
Remove-Item (Join-Path $targetAssets "*") -Recurse -Force -ErrorAction SilentlyContinue

Copy-Item (Join-Path $sourceRoot "index.html") (Join-Path $targetRoot "index.html") -Force
Copy-Item (Join-Path $sourceRoot "assets\*") $targetAssets -Recurse -Force

# NET STOP w3svc # Para o serviço de publicação na web
# NET START w3svc # Inicia o serviço de publicação na web