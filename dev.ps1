# HabTracker Development Server
# PowerShell script untuk menjalankan Vite dev server dengan cara yang reliable

param(
    [switch]$exposeHost = $false,
    [string]$port = "5173"
)

Write-Host "🚀 Starting HabTracker Development Server..." -ForegroundColor Green
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Determine vite arguments
$viteArgs = @()
if ($exposeHost) {
    $viteArgs += "--host"
}
if ($port) {
    $viteArgs += "--port", $port
}

# Run vite
& "$scriptDir\node_modules\.bin\vite.ps1" @viteArgs

# If vite exits with error
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Dev server encountered an error" -ForegroundColor Red
    Write-Host "Exit Code: $LASTEXITCODE" -ForegroundColor Red
}
