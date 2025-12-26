# SoK Research Dashboard - Complete Local Setup and Run Script
# This script sets up and runs the entire application locally

$ErrorActionPreference = "Stop"

Write-Host "=== SoK Research Dashboard - Local Setup & Run ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$MongoContainerName = "sok-research-mongodb-local"
$MongoPort = "27017"
$BackendPort = "3000"
$FrontendPort = "4200"
$FrontendUrl = "http://localhost:$FrontendPort"

# Function to check if a command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Function to check if port is in use
function Test-Port {
    param($Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "docker")) {
    Write-Host "ERROR: Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✓ All prerequisites found" -ForegroundColor Green
Write-Host ""

# Check if MongoDB container is already running
Write-Host "Setting up MongoDB..." -ForegroundColor Yellow
$existingContainer = docker ps -a --filter "name=$MongoContainerName" --format "{{.Names}}"

if ($existingContainer -eq $MongoContainerName) {
    $running = docker ps --filter "name=$MongoContainerName" --format "{{.Names}}"
    if ($running -eq $MongoContainerName) {
        Write-Host "✓ MongoDB container '$MongoContainerName' is already running" -ForegroundColor Green
    } else {
        Write-Host "Starting existing MongoDB container..." -ForegroundColor Yellow
        docker start $MongoContainerName | Out-Null
        Start-Sleep -Seconds 3
        Write-Host "✓ MongoDB container started" -ForegroundColor Green
    }
} else {
    Write-Host "Creating new MongoDB container '$MongoContainerName'..." -ForegroundColor Yellow
    docker run -d `
        --name $MongoContainerName `
        -p "${MongoPort}:27017" `
        -e MONGO_INITDB_DATABASE=sok_research `
        mongo:7.0 | Out-Null
    Start-Sleep -Seconds 5
    Write-Host "✓ MongoDB container created and started" -ForegroundColor Green
}

Write-Host ""

# Check if ports are available
Write-Host "Checking ports..." -ForegroundColor Yellow
if (Test-Port $BackendPort) {
    Write-Host "WARNING: Port $BackendPort is already in use. Backend may not start correctly." -ForegroundColor Yellow
}
if (Test-Port $FrontendPort) {
    Write-Host "WARNING: Port $FrontendPort is already in use. Frontend may not start correctly." -ForegroundColor Yellow
}
Write-Host ""

# Setup Backend
Write-Host "Setting up Backend..." -ForegroundColor Yellow
Push-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install backend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Backend dependencies already installed" -ForegroundColor Green
}

Pop-Location
Write-Host ""

# Setup Frontend
Write-Host "Setting up Frontend..." -ForegroundColor Yellow
Push-Location "frontend\sok-frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install frontend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Write-Host "Installing Tailwind CSS dependencies..." -ForegroundColor Yellow
    npm install -D tailwindcss postcss autoprefixer
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Failed to install Tailwind CSS dependencies" -ForegroundColor Yellow
    }
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}

Pop-Location
Write-Host ""

# Check if super admin exists (wait a bit for MongoDB to be ready)
Write-Host "Checking for super admin account..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Push-Location backend
try {
    $userCheckScript = @"
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sok_research', { serverSelectionTimeoutMS: 3000 });
        const count = await User.countDocuments({ role: 'SUPER_ADMIN', status: 'APPROVED' });
        console.log(count);
        await mongoose.disconnect();
        process.exit(0);
    } catch(e) {
        console.log('0');
        process.exit(0);
    }
})();
"@
    $userCheck = node -e $userCheckScript 2>$null
    if ([int]$userCheck -eq 0) {
        Write-Host ""
        Write-Host "⚠ No super admin account found!" -ForegroundColor Yellow
        Write-Host "You can create one by:" -ForegroundColor White
        Write-Host "  1. Registering at $FrontendUrl/register (first user = SUPER_ADMIN)" -ForegroundColor Gray
        Write-Host "  2. Running: cd backend && npm run bootstrap-admin" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After creating admin, seed initial papers:" -ForegroundColor White
        Write-Host "  cd backend && npm run seed-papers" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "✓ Super admin account exists" -ForegroundColor Green
        # Check if papers exist
        $paperCheckScript = @"
require('dotenv').config();
const mongoose = require('mongoose');
const Paper = require('./src/models/Paper');
(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sok_research', { serverSelectionTimeoutMS: 3000 });
        const count = await Paper.countDocuments();
        console.log(count);
        await mongoose.disconnect();
        process.exit(0);
    } catch(e) {
        console.log('0');
        process.exit(0);
    }
})();
"@
        $paperCheck = node -e $paperCheckScript 2>$null
        if ([int]$paperCheck -eq 0) {
            Write-Host "💡 Tip: Run 'cd backend && npm run seed-papers' to add 22 initial papers" -ForegroundColor Cyan
        } else {
            Write-Host "✓ Database contains $paperCheck paper(s)" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "⚠ Could not check for super admin (MongoDB may still be initializing)" -ForegroundColor Yellow
}
Pop-Location
Write-Host ""

# Start services
Write-Host "=== Starting Services ===" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "Starting Backend on port $BackendPort..." -ForegroundColor Yellow
Push-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Backend Server (Port $BackendPort)' -ForegroundColor Cyan; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3
Pop-Location
Write-Host "✓ Backend starting..." -ForegroundColor Green
Write-Host ""

# Start Frontend
Write-Host "Starting Frontend on port $FrontendPort..." -ForegroundColor Yellow
Push-Location "frontend\sok-frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend Server (Port $FrontendPort)' -ForegroundColor Cyan; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host ''; npm start" -WindowStyle Normal
Pop-Location
Write-Host "✓ Frontend starting..." -ForegroundColor Green
Write-Host ""

# Wait a bit for services to start
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Open browser
Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Services are running:" -ForegroundColor White
Write-Host "  • MongoDB:      Container '$MongoContainerName' on port $MongoPort" -ForegroundColor Gray
Write-Host "  • Backend API:  http://localhost:$BackendPort" -ForegroundColor Gray
Write-Host "  • Frontend:     $FrontendUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process $FrontendUrl
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor White
Write-Host "  • Close the PowerShell windows for Backend and Frontend" -ForegroundColor Gray
Write-Host "  • Run: .\stop-local.ps1" -ForegroundColor Gray
Write-Host "  • Or manually: docker stop $MongoContainerName" -ForegroundColor Gray
Write-Host ""
Write-Host "MongoDB Container Name: $MongoContainerName (easily recognizable in Docker)" -ForegroundColor Gray
Write-Host ""
