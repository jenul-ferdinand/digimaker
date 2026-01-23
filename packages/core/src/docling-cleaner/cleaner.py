#!/usr/bin/env python3
"""
Convert DOCX to markdown with image placeholders using Docling.

Usage:
    python cleaner.py <path-to-docx>

Outputs markdown to stdout with <!-- image --> markers for images.
"""

import sys
import logging
from pathlib import Path
from docling.document_converter import DocumentConverter

logging.getLogger('docling.backend.msword_backend').setLevel(logging.ERROR)

def main():
    # Force UTF-8 stdout/stderr to avoid CP1252 mojibake on Windows.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    if len(sys.argv) < 2:
        print("Usage: python cleaner.py <path-to-docx>", file=sys.stderr)
        sys.exit(1)

    src = Path(sys.argv[1])
    if not src.exists():
        print(f"Error: File not found: {src}", file=sys.stderr)
        sys.exit(1)

    conv = DocumentConverter()
    result = conv.convert(src)
    markdown = result.document.export_to_markdown()
    print(markdown)

if __name__ == "__main__":
    main()
