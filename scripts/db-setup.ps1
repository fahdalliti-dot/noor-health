<#
.SYNOPSIS
    Idempotent PostgreSQL setup wrapper for SaaS for Doctors in Morocco.
    Run as Administrator or with a superuser account (e.g., postgres).

.DESCRIPTION
    Executes scripts/db-setup.sql via psql with variables.
    Uses \gexec for idempotent role/extension/database creation.
    Does not alter existing roles beyond password sync.

.PARAMETER Superuser
    PostgreSQL superuser name (default: postgres).

.PARAMETER Host
    PostgreSQL host (default: 127.0.0.1).

.PARAMETER Port
    PostgreSQL port (default: 5432).

.PARAMETER Password
    Superuser password (default: saas_pass).

.EXAMPLE
    .\scripts\db-setup.ps1
    .\scripts\db-setup.ps1 -Superuser "postgres" -Host "127.0.0.1" -Port 5432
#>

param(
    [string]$Superuser = "postgres",
    [string]$Host = "127.0.0.1",
    [int]$Port = 5432,
    [string]$Password = "saas_pass"
)

$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

if (-not (Test-Path $psqlPath)) {
    Write-Error "psql not found at $psqlPath"
    exit 1
}

$scriptPath = Join-Path $PSScriptRoot "db-setup.sql"

if (-not (Test-Path $scriptPath)) {
    Write-Error "SQL script not found at $scriptPath"
    exit 1
}

Write-Host "Running PostgreSQL setup..." -ForegroundColor Cyan
Write-Host "  Superuser: $Superuser" -ForegroundColor Gray
Write-Host "  Host: $Host" -ForegroundColor Gray
Write-Host "  Port: $Port" -ForegroundColor Gray

$env:PGPASSWORD = $Password

$cmd = & $psqlPath -U $Superuser -h $Host -p $Port -f $scriptPath -v ON_ERROR_STOP=1 2>&1
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Error "psql failed with exit code $exitCode"
    Write-Host $cmd
    exit $exitCode
}

Write-Host "PostgreSQL setup completed successfully." -ForegroundColor Green
Write-Host $cmd
exit 0