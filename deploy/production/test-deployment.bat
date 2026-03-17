@echo off
REM Test production deployment

echo.
echo ===================================
echo   PRODUCTION DEPLOYMENT TEST
echo ===================================
echo.

echo [1] Testing Frontend HTTPS...
curl -s -o nul -w "Status: %%{http_code}\n" https://estoque.local
echo.

echo [2] Testing API Docs (IIS Proxy)...
curl -s -o nul -w "Status: %%{http_code}\n" https://estoque.local/api-docs
echo.

echo [3] Testing Backend Direct (Internal)...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:3000/api-docs
echo.

echo [4] Testing /totais endpoint...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:3000/totais
echo.

echo [5] Testing HTTPS login...
curl -s -o nul -w "Status: %%{http_code}\n" https://estoque.local/login
echo.

echo [6] Checking ports...
netstat -ano | findstr :3000
netstat -ano | findstr :443
echo.

echo ===================================
echo   SUMMARY
echo ===================================
echo Frontend: https://estoque.local
echo API Docs: https://estoque.local/api-docs
echo Backend: http://localhost:3000 (port 3000)
echo IIS HTTPS: Port 443
echo.
