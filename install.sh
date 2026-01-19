#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "  ____  _       _ __  __       _             "
echo " |  _ \(_) __ _(_)  \/  | __ _| | _____ _ __ "
echo " | | | | |/ _\` | | |\/| |/ _\` | |/ / _ \ '__|"
echo " | |_| | | (_| | | |  | | (_| |   <  __/ |   "
echo " |____/|_|\__, |_|_|  |_|\__,_|_|\_\___|_|   "
echo "          |___/                              "
echo -e "${NC}"
echo "DigiMaker CLI Installer"
echo "========================"
echo ""

# Minimum Node.js version required
MIN_NODE_VERSION=18

# Function to compare version numbers
version_gte() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

# Check for Node.js
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge "$MIN_NODE_VERSION" ]; then
            echo -e "${GREEN}[OK]${NC} Node.js v$(node --version | cut -d'v' -f2) detected"
            return 0
        else
            echo -e "${YELLOW}[WARN]${NC} Node.js v$(node --version | cut -d'v' -f2) detected, but v${MIN_NODE_VERSION}+ is required"
            return 1
        fi
    else
        echo -e "${RED}[ERROR]${NC} Node.js is not installed"
        return 1
    fi
}

# Check for npm
check_npm() {
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} npm v$(npm --version) detected"
        return 0
    else
        echo -e "${RED}[ERROR]${NC} npm is not installed"
        return 1
    fi
}

# Install Node.js instructions
install_node_instructions() {
    echo ""
    echo -e "${YELLOW}Node.js ${MIN_NODE_VERSION}+ is required but not found.${NC}"
    echo ""
    echo "Please install Node.js using one of these methods:"
    echo ""

    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Using Homebrew:"
        echo "    brew install node"
        echo ""
        echo "  Or download from:"
        echo "    https://nodejs.org/en/download/"
    elif [[ "$OSTYPE" == "linux-gnu"* ]] || [[ -n "$WSL_DISTRO_NAME" ]]; then
        echo "  Using nvm (recommended):"
        echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
        echo "    source ~/.bashrc"
        echo "    nvm install ${MIN_NODE_VERSION}"
        echo ""
        echo "  Or using NodeSource:"
        echo "    curl -fsSL https://deb.nodesource.com/setup_${MIN_NODE_VERSION}.x | sudo -E bash -"
        echo "    sudo apt-get install -y nodejs"
    else
        echo "  Download from: https://nodejs.org/en/download/"
    fi
    echo ""
    echo "After installing Node.js, run this installer again."
}

# Main installation
main() {
    # Check prerequisites
    echo "Checking prerequisites..."
    echo ""

    NODE_OK=false
    NPM_OK=false

    if check_node; then
        NODE_OK=true
    fi

    if check_npm; then
        NPM_OK=true
    fi

    echo ""

    if [ "$NODE_OK" = false ]; then
        install_node_instructions
        exit 1
    fi

    if [ "$NPM_OK" = false ]; then
        echo -e "${RED}npm is required but not found.${NC}"
        echo "npm usually comes with Node.js. Please reinstall Node.js."
        exit 1
    fi

    # Install the CLI
    echo "Installing @digimakers/cli..."
    echo ""

    if npm install -g @digimakers/cli; then
        echo ""
        echo -e "${GREEN}Installation successful!${NC}"
        echo ""
        echo "You can now use the DigiMaker CLI by running:"
        echo ""
        echo -e "  ${BLUE}digimaker --help${NC}"
        echo ""
        echo -e "${YELLOW}Note:${NC} You'll need to set the GEMINI_API_KEY environment variable"
        echo "for DOCX parsing to work:"
        echo ""
        echo "  export GEMINI_API_KEY=your_api_key_here"
        echo ""
        echo "Add it to your ~/.bashrc or ~/.zshrc to make it permanent."
    else
        echo ""
        echo -e "${RED}Installation failed.${NC}"
        echo ""
        echo "Try installing with sudo:"
        echo "  sudo npm install -g @digimakers/cli"
        echo ""
        echo "Or fix npm permissions:"
        echo "  https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally"
        exit 1
    fi
}

main
