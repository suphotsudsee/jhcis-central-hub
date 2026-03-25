@echo off
REM JHCIS Central Hub - Windows Deployment Package Script
REM This script creates a deployment package for server deployment

echo ==========================================
echo JHCIS Central Hub - Creating Deployment Package
echo ==========================================

set PACKAGE_DIR=jhcis-central-hub-deploy
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set ZIP_FILE=jhcis-central-hub-%TIMESTAMP%.zip

echo Creating package directory...
if exist %PACKAGE_DIR% rmdir /s /q %PACKAGE_DIR%
mkdir %PACKAGE_DIR%

echo Copying files...
xcopy /E /I /Y api-backend %PACKAGE_DIR%\api-backend
xcopy /E /I /Y database %PACKAGE_DIR%\database
xcopy /E /I /Y nginx %PACKAGE_DIR%\nginx
xcopy /E /I /Y docs %PACKAGE_DIR%\docs
xcopy /E /I /Y deploy %PACKAGE_DIR%\deploy

copy docker-compose.yml %PACKAGE_DIR%\
copy .env.example %PACKAGE_DIR%\
copy README.md %PACKAGE_DIR%\

echo Removing node_modules from package...
if exist %PACKAGE_DIR%\api-backend\node_modules rmdir /s /q %PACKAGE_DIR%\api-backend\node_modules

echo Creating README for deployment...
echo # JHCIS Central Hub - Deployment Package > %PACKAGE_DIR%\DEPLOY_README.md
echo. >> %PACKAGE_DIR%\DEPLOY_README.md
echo ## การ Deploy >> %PACKAGE_DIR%\DEPLOY_README.md
echo. >> %PACKAGE_DIR%\DEPLOY_README.md
echo 1. Upload package ไปยัง server >> %PACKAGE_DIR%\DEPLOY_README.md
echo    ```bash >> %PACKAGE_DIR%\DEPLOY_README.md
echo    scp -r %ZIP_FILE% user@server:/opt/ >> %PACKAGE_DIR%\DEPLOY_README.md
echo    ``` >> %PACKAGE_DIR%\DEPLOY_README.md
echo. >> %PACKAGE_DIR%\DEPLOY_README.md
echo 2. Extract and run deploy script >> %PACKAGE_DIR%\DEPLOY_README.md
echo    ```bash >> %PACKAGE_DIR%\DEPLOY_README.md
echo    cd /opt >> %PACKAGE_DIR%\DEPLOY_README.md
echo    unzip %ZIP_FILE% >> %PACKAGE_DIR%\DEPLOY_README.md
echo    cd jhcis-central-hub >> %PACKAGE_DIR%\DEPLOY_README.md
echo    chmod +x deploy/deploy.sh >> %PACKAGE_DIR%\DEPLOY_README.md
echo    ./deploy/deploy.sh >> %PACKAGE_DIR%\DEPLOY_README.md
echo    ``` >> %PACKAGE_DIR%\DEPLOY_README.md
echo. >> %PACKAGE_DIR%\DEPLOY_README.md
echo ## Endpoints >> %PACKAGE_DIR%\DEPLOY_README.md
echo - API: http://ubonlocal.phoubon.in.th/api/v1 >> %PACKAGE_DIR%\DEPLOY_README.md
echo - Health: http://ubonlocal.phoubon.in.th/health >> %PACKAGE_DIR%\DEPLOY_README.md

echo.
echo Compressing package...
powershell -command "Compress-Archive -Path %PACKAGE_DIR% -DestinationPath %ZIP_FILE% -Force"

echo.
echo ==========================================
echo Package created: %ZIP_FILE%
echo ==========================================
echo.
echo Next steps:
echo 1. Upload %ZIP_FILE% to your server
echo 2. Extract and run deploy/deploy.sh
echo.

pause