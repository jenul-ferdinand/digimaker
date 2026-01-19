# CLI tool for Digimaker

This mainly converts Digimaker's old .docx lessons to the new format in PDF form.
If you're not apart of Digimaker's team, this tool is of no use for you.

## Installation
Install with npm
```bash
npm install @digimaker/cli
```

Install script for powershell/windows
```bash
irm https://raw.githubusercontent.com/jenul-ferdinand/digimaker/main/install.ps1 | iex
```

Install script for macos/linux/wsl
```bash
curl -fsSL https://raw.githubusercontent.com/jenul-ferdinand/digimaker/main/install.sh | bash
```

## How to use it
Converting docx in the current directory.
```bash
digimaker convert 
```

Converting docx in some path, with a specified output location.
```bash
digimaker convert "path/to/folder" -o "path/to/output/folder"
```