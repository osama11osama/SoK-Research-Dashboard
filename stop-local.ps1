# SoK Research Dashboard - Stop Local Services Script

Write-Host "=== Stopping SoK Research Dashboard Services ===" -ForegroundColor Cyan
Write-Host ""

$MongoContainerName = "sok-research-mongodb-local"

# Stop MongoDB container
Write-Host "Stopping MongoDB container..." -ForegroundColor Yellow
$container = docker ps -a --filter "name=$MongoContainerName" --format "{{.Names}}"
if ($container -eq $MongoContainerName) {
    docker stop $MongoContainerName 2>$null | Out-Null
    Write-Host "✓ MongoDB container stopped" -ForegroundColor Green
} else {
    Write-Host "✓ MongoDB container not found (already stopped or never created)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "NOTE: Backend and Frontend servers are running in separate PowerShell windows." -ForegroundColor Yellow
Write-Host "Please close those windows manually, or press Ctrl+C in each window." -ForegroundColor Yellow
Write-Host ""

# Option to remove container
$remove = Read-Host "Do you want to remove the MongoDB container? (y/N)"
if ($remove -eq "y" -or $remove -eq "Y") {
    docker rm $MongoContainerName 2>$null | Out-Null
    Write-Host "✓ MongoDB container removed" -ForegroundColor Green
} else {
    Write-Host "✓ MongoDB container kept (you can restart it with: docker start $MongoContainerName)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green
Write-Host ""

