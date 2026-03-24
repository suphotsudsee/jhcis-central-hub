# Run this script AS ADMINISTRATOR

# 1. Stop MySQL service
Write-Host "Stopping MySQL service..."
Stop-Service -Name MySQL56_JHCIS -Force

# 2. Update my.ini port from 3333 to 3306
$iniPath = "C:\Program Files\JHCIS\MySQL5.6\my.ini"
Write-Host "Updating $iniPath..."
$content = Get-Content $iniPath -Raw
$content = $content -replace 'port = 3333', 'port = 3306'
$content | Set-Content $iniPath -Encoding UTF8

# 3. Start MySQL service
Write-Host "Starting MySQL service..."
Start-Service -Name MySQL56_JHCIS

# 4. Verify port
Write-Host "Verifying port..."
netstat -ano | findstr :3306

# 5. Restart API backend
Write-Host "Restarting API backend..."
$apiPath = "C:\fullstack\jhcis-central-hub\api-backend"
Get-Process -Path "$apiPath\src\index.js" -ErrorAction SilentlyContinue | Stop-Process -Force
Set-Location $apiPath
node src/index.js

Write-Host "Done!"
