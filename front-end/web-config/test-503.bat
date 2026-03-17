@echo off
REM Script de teste rápido para diagnosticar erro 503
REM Execute como ADMINISTRADOR

echo ==========================================
echo Diagnostic: HTTP 503 Error
echo ==========================================
echo.

echo [1] IIS Service Status:
sc query w3svc | find "STATE"

echo.
echo [2] Backend Port 3000:
netstat -ano | find "3000"

echo.
echo [3] HTTPS Port 443:
netstat -ano | find "443"

echo.
echo [4] Reiniciando IIS...
iisreset /restart

echo.
echo [5] Aguardando 5 segundos...
timeout /t 5 /nobreak

echo.
echo [6] Teste de conectividade:
curl -k https://estoque.local/index.html 2>&1 | findstr "Online"

echo.
echo ==========================================
echo Se acima mostra "Online", serviço está OK!
echo ==========================================
pause
