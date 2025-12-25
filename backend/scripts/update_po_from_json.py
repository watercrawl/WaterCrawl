#!/usr/bin/env python3
"""
Update .po files from translated JSON files.
Uses polib library to ensure .po files remain stable and valid.
"""

import json
import sys
from pathlib import Path
from typing import Dict

try:
    import polib
except ImportError:
    print("Error: polib library is required. Install it with: pip install polib")
    sys.exit(1)


def load_translations_from_json(json_file: Path) -> Dict[str, str]:
    """
    Load translations from a JSON file.

    Returns:
        Dictionary mapping msgid to translated msgstr
    """
    if not json_file.exists():
        print(f"  ✗ JSON file not found: {json_file}")
        return {}

    try:
        with open(json_file, "r", encoding="utf-8") as f:
            translations = json.load(f)

        # Filter out empty translations (skip untranslated entries)
        return {
            msgid: msgstr for msgid, msgstr in translations.items() if msgstr.strip()
        }
    except json.JSONDecodeError as e:
        print(f"  ✗ Error parsing JSON file {json_file}: {e}")
        return {}
    except Exception as e:
        print(f"  ✗ Error reading JSON file {json_file}: {e}")
        return {}


def update_po_file(po_file: Path, translations: Dict[str, str]) -> int:
    """
    Update .po file with translations from JSON.

    Args:
        po_file: Path to the .po file
        translations: Dictionary mapping msgid to translated msgstr

    Returns:
        Number of entries updated
    """
    if not po_file.exists():
        print(f"  ✗ .po file not found: {po_file}")
        return 0

    try:
        # Load .po file using polib
        po = polib.pofile(str(po_file))
    except Exception as e:
        print(f"  ✗ Error loading .po file {po_file}: {e}")
        return 0

    updated_count = 0
    not_found_count = 0

    # Update entries
    for entry in po:
        # Skip the header entry (empty msgid)
        if not entry.msgid:
            continue

        # Check if we have a translation for this msgid
        if entry.msgid in translations:
            translation = translations[entry.msgid].strip()

            # Only update if translation is not empty
            if translation:
                # Update the msgstr
                entry.msgstr = translation

                # Remove fuzzy flag if present (translation is now complete)
                # polib handles fuzzy as a special property
                if entry.fuzzy:
                    entry.fuzzy = False

                updated_count += 1

    # Check for translations that weren't found in .po file
    po_msgids = {entry.msgid for entry in po if entry.msgid}
    missing_msgids = set(translations.keys()) - po_msgids
    if missing_msgids:
        not_found_count = len(missing_msgids)
        print(f"  ⚠ Warning: {not_found_count} translations not found in .po file")

    # Save the updated .po file
    if updated_count > 0:
        try:
            po.save(str(po_file))
            return updated_count
        except Exception as e:
            print(f"  ✗ Error saving .po file {po_file}: {e}")
            return 0

    return updated_count


def process_language(lang_code: str, translations_dir: Path, locale_dir: Path) -> bool:
    """
    Process a single language: load JSON and update corresponding .po file.

    Returns:
        True if successful, False otherwise
    """
    # Find JSON file
    json_file = translations_dir / f"{lang_code}.json"
    if not json_file.exists():
        print(f"  ✗ JSON file not found: {json_file}")
        return False

    # Find .po file
    po_file = locale_dir / lang_code / "LC_MESSAGES" / "django.po"
    if not po_file.exists():
        print(f"  ✗ .po file not found: {po_file}")
        return False

    print(f"\nProcessing {lang_code}...")

    # Load translations from JSON
    translations = load_translations_from_json(json_file)
    if not translations:
        print(f"  ⚠ No valid translations found in {json_file}")
        return False

    print(f"  Loaded {len(translations)} translations from JSON")

    # Update .po file
    updated_count = update_po_file(po_file, translations)

    if updated_count > 0:
        print(f"  ✓ Updated {updated_count} entries in {po_file.name}")
        return True
    else:
        print("  ⚠ No entries were updated")
        return False


def main():
    """Main function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Update .po files from translated JSON files using polib"
    )
    parser.add_argument(
        "--translations-dir",
        type=str,
        default="locale_translations",
        help="Path to directory containing JSON translation files (default: locale_translations)",
    )
    parser.add_argument(
        "--locale-dir",
        type=str,
        default="locale",
        help="Path to locale directory containing .po files (default: locale)",
    )
    parser.add_argument(
        "--lang",
        type=str,
        nargs="+",
        help="Specific languages to process (default: all JSON files found)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without updating .po files",
    )

    args = parser.parse_args()

    # Find directories
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    translations_dir = project_root / args.translations_dir
    locale_dir = project_root / args.locale_dir

    if not translations_dir.exists():
        print(f"Error: Translations directory not found: {translations_dir}")
        sys.exit(1)

    if not locale_dir.exists():
        print(f"Error: Locale directory not found: {locale_dir}")
        sys.exit(1)

    # Find JSON files
    json_files = list(translations_dir.glob("*.json"))

    if args.lang:
        # Filter by specified languages
        json_files = [f for f in json_files if f.stem in args.lang]

    if not json_files:
        print("No JSON translation files found!")
        sys.exit(1)

    print(f"\n{'=' * 70}")
    print("Update .po Files from JSON Translations")
    print(f"{'=' * 70}")
    print(f"Translations directory: {translations_dir}")
    print(f"Locale directory: {locale_dir}")
    print(f"Found {len(json_files)} JSON file(s)")

    if args.dry_run:
        print("\n⚠ DRY RUN MODE - No files will be modified")

    # Process each language
    success_count = 0
    for json_file in sorted(json_files):
        lang_code = json_file.stem

        if args.dry_run:
            # In dry-run mode, just show what would be updated
            translations = load_translations_from_json(json_file)
            po_file = locale_dir / lang_code / "LC_MESSAGES" / "django.po"

            if po_file.exists() and translations:
                try:
                    po = polib.pofile(str(po_file))
                    po_msgids = {entry.msgid for entry in po if entry.msgid}
                    matching = len(set(translations.keys()) & po_msgids)
                    print(f"\n{lang_code}: Would update {matching} entries")
                except Exception as e:
                    print(f"\n{lang_code}: Error - {e}")
        else:
            if process_language(lang_code, translations_dir, locale_dir):
                success_count += 1

    print(f"\n{'=' * 70}")
    if args.dry_run:
        print("Dry run complete! Use without --dry-run to apply changes.")
    else:
        print(
            f"Processing complete! Updated {success_count}/{len(json_files)} language(s)"
        )
    print(f"{'=' * 70}\n")


if __name__ == "__main__":
    main()
