#Requires -Version 5.1
<#
.SYNOPSIS
    DigiMaker CLI Installer for Windows
.DESCRIPTION
    Installs the DigiMaker CLI tool via npm.
    Requires Node.js 18+ to be installed.
.EXAMPLE
    irm https://raw.githubusercontent.com/jenul-ferdinand/digimaker-cli/main/install.ps1 | iex
#>

$ErrorActionPreference = "Stop"

# Minimum Node.js version required
$MIN_NODE_VERSION = 18

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# ASCII Banner
Write-Host ""
Write-ColorOutput "  ____  _       _ __  __       _             " "Cyan"
Write-ColorOutput " |  _ \(_) __ _(_)  \/  | __ _| | _____ _ __ " "Cyan"
Write-ColorOutput " | | | | |/ _`` | | |\/| |/ _`` | |/ / _ \ '__|" "Cyan"
Write-ColorOutput " | |_| | | (_| | | |  | | (_| |   <  __/ |   " "Cyan"
Write-ColorOutput " |____/|_|\__, |_|_|  |_|\__,_|_|\_\___|_|   " "Cyan"
Write-ColorOutput "          |___/                              " "Cyan"
Write-Host ""
Write-Host "DigiMaker CLI Installer"
Write-Host "========================"
Write-Host ""

function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            $versionNum = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
            if ($versionNum -ge $MIN_NODE_VERSION) {
                Write-ColorOutput "[OK] Node.js $nodeVersion detected" "Green"
                return $true
            } else {
                Write-ColorOutput "[WARN] Node.js $nodeVersion detected, but v$MIN_NODE_VERSION+ is required" "Yellow"
                return $false
            }
        }
    } catch {
        Write-ColorOutput "[ERROR] Node.js is not installed" "Red"
        return $false
    }
    return $false
}

function Test-Npm {
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-ColorOutput "[OK] npm v$npmVersion detected" "Green"
            return $true
        }
    } catch {
        Write-ColorOutput "[ERROR] npm is not installed" "Red"
        return $false
    }
    return $false
}

function Show-NodeInstallInstructions {
    Write-Host ""
    Write-ColorOutput "Node.js $MIN_NODE_VERSION+ is required but not found." "Yellow"
    Write-Host ""
    Write-Host "Please install Node.js using one of these methods:"
    Write-Host ""
    Write-Host "  Using winget (Windows Package Manager):"
    Write-Host "    winget install OpenJS.NodeJS.LTS"
    Write-Host ""
    Write-Host "  Using Chocolatey:"
    Write-Host "    choco install nodejs-lts"
    Write-Host ""
    Write-Host "  Or download from:"
    Write-Host "    https://nodejs.org/en/download/"
    Write-Host ""
    Write-Host "After installing Node.js, restart your terminal and run this installer again."
}

# Main installation
Write-Host "Checking prerequisites..."
Write-Host ""

$nodeOk = Test-NodeJS
$npmOk = Test-Npm

Write-Host ""

if (-not $nodeOk) {
    Show-NodeInstallInstructions
    exit 1
}

if (-not $npmOk) {
    Write-ColorOutput "npm is required but not found." "Red"
    Write-Host "npm usually comes with Node.js. Please reinstall Node.js."
    exit 1
}

# Install the CLI
Write-Host "Installing @digimaker/cli..."
Write-Host ""

try {
    npm install -g @digimaker/cli

    Write-Host ""
    Write-ColorOutput "Installation successful!" "Green"
    Write-Host ""
    Write-Host "You can now use the DigiMaker CLI by running:"
    Write-Host ""
    Write-ColorOutput "  digimaker --help" "Cyan"
    Write-Host ""
    Write-ColorOutput "Note: " "Yellow" -NoNewline
    Write-Host "You'll need to set the GEMINI_API_KEY environment variable"
    Write-Host "for DOCX parsing to work:"
    Write-Host ""
    Write-Host '  $env:GEMINI_API_KEY = "your_api_key_here"'
    Write-Host ""
    Write-Host "To make it permanent, add it to your system environment variables:"
    Write-Host "  1. Press Win+R, type 'sysdm.cpl', press Enter"
    Write-Host "  2. Go to Advanced > Environment Variables"
    Write-Host "  3. Add GEMINI_API_KEY to User variables"
} catch {
    Write-Host ""
    Write-ColorOutput "Installation failed." "Red"
    Write-Host ""
    Write-Host "Error: $_"
    Write-Host ""
    Write-Host "If you see permission errors, try running PowerShell as Administrator."
    exit 1
}
