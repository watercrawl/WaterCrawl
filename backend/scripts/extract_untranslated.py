#!/usr/bin/env python3
"""
Extract untranslated and fuzzy entries from .po files and generate JSON files.
Creates JSON files like fa.json with format: {"UNTRASLATED_TEXT": ""}
"""

import json
import sys
from pathlib import Path
from typing import List, Tuple

try:
    import polib
except ImportError:
    print("Error: polib library is required. Install it with: pip install polib")
    sys.exit(1)


def parse_po_file(file_path: Path) -> Tuple[List[str], List[str]]:
    """
    Parse .po file using polib and return lists of fuzzy and untranslated msgid strings.

    Returns:
        Tuple of (fuzzy_msgids, untranslated_msgids)
    """
    fuzzy_msgids = []
    untranslated_msgids = []

    try:
        po_file = polib.pofile(str(file_path))
    except Exception as e:
        print(f"  ✗ Error parsing {file_path}: {e}")
        return fuzzy_msgids, untranslated_msgids

    for entry in po_file:
        # Skip the header entry (empty msgid)
        if not entry.msgid:
            continue

        # Check if entry is fuzzy
        if entry.fuzzy:
            fuzzy_msgids.append(entry.msgid)
        # Check if entry is untranslated (empty msgstr)
        elif not entry.translated():
            untranslated_msgids.append(entry.msgid)

    return fuzzy_msgids, untranslated_msgids


def create_json_file(lang_code: str, msgids: List[str], output_dir: Path):
    """
    Create a JSON file with untranslated/fuzzy entries.

    Format: {"UNTRASLATED_TEXT": ""}
    """
    if not msgids:
        print(f"  No entries to write for {lang_code}")
        return

    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)

    # Create JSON structure
    json_data = {}
    for msgid in sorted(set(msgids)):  # Remove duplicates and sort
        json_data[msgid] = ""

    # Write JSON file
    output_file = output_dir / f"{lang_code}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    print(f"  ✓ Created {output_file} with {len(json_data)} entries")


def process_language(lang_dir: Path, output_dir: Path):
    """Process a single language directory."""
    lang_code = lang_dir.name
    po_file = lang_dir / "LC_MESSAGES" / "django.po"

    if not po_file.exists():
        print(f"  ✗ {lang_code}: django.po not found")
        return

    print(f"\nProcessing {lang_code}...")

    # Parse .po file
    fuzzy_msgids, untranslated_msgids = parse_po_file(po_file)

    print(f"  Found {len(fuzzy_msgids)} fuzzy entries")
    print(f"  Found {len(untranslated_msgids)} untranslated entries")

    # Combine fuzzy and untranslated (remove duplicates)
    all_msgids = list(set(fuzzy_msgids + untranslated_msgids))

    if all_msgids:
        create_json_file(lang_code, all_msgids, output_dir)
    else:
        print("  ✓ No untranslated or fuzzy entries found")


def main():
    """Main function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Extract untranslated and fuzzy entries from .po files and generate JSON files"
    )
    parser.add_argument(
        "--locale-dir",
        type=str,
        default="locale",
        help="Path to locale directory (default: locale)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="locale_translations",
        help="Path to output directory for JSON files (default: locale_translations)",
    )
    parser.add_argument(
        "--lang",
        type=str,
        nargs="+",
        help="Specific languages to process (default: all)",
    )

    args = parser.parse_args()

    # Find locale directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    locale_dir = project_root / args.locale_dir
    output_dir = project_root / args.output_dir

    if not locale_dir.exists():
        print(f"Error: Locale directory not found: {locale_dir}")
        sys.exit(1)

    # Find language directories
    lang_dirs = [
        d for d in locale_dir.iterdir() if d.is_dir() and not d.name.startswith(".")
    ]

    if args.lang:
        lang_dirs = [d for d in lang_dirs if d.name in args.lang]

    if not lang_dirs:
        print("No language directories found!")
        sys.exit(1)

    print(f"\n{'=' * 70}")
    print("Extract Untranslated/Fuzzy Entries from .po Files")
    print(f"{'=' * 70}")
    print(f"Locale directory: {locale_dir}")
    print(f"Output directory: {output_dir}")
    print(f"Found {len(lang_dirs)} language directories")

    # Process each language
    for lang_dir in sorted(lang_dirs):
        process_language(lang_dir, output_dir)

    print(f"\n{'=' * 70}")
    print("Processing complete!")
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    main()
