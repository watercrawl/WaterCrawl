import logging
import sys
import re
from typing import List, Dict

LOGGER = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)

# ────────────────────────────────── helpers ──────────────────────────────────── #

def _early_exit(msg: str, code: int = 1) -> None:  # noqa: D401
    """Log *msg* as an error and exit with *code*."""
    LOGGER.error(msg)
    sys.exit(code)


def _debug_print(msg: str, debug_mode: bool = False) -> None:
    """Print debug message if debug mode is enabled."""
    if debug_mode:
        print(f"[DEBUG] {msg}")


def _debug_print_separator(title: str, debug_mode: bool = False) -> None:
    """Print debug separator with title."""
    if debug_mode:
        print("\n" + "=" * 80)
        print(f"DEBUG: {title}")
        print("=" * 80)


def _debug_print_content(content: str, title: str, debug_mode: bool = False, max_chars: int = 2000) -> None:
    """Print content with title for debugging."""
    if debug_mode:
        print(f"\n[DEBUG CONTENT: {title}]")
        print("-" * 60)
        if len(content) > max_chars:
            print(content[:max_chars])
            print(f"\n... [TRUNCATED - showing first {max_chars} of {len(content)} chars] ...")
        else:
            print(content)
        print("-" * 60)
import re
from typing import List, Set, Dict

# --------------------------------------------------------------------------- #
#  Lightweight helpers – keep them nested so they stay private to the filter  #
# --------------------------------------------------------------------------- #
import re
from pathlib import Path
from typing import Tuple


_IGNORE_TOKENS = {
    "http", "https", "www", "com", "net", "org",
    "html", "htm", "php", "asp", "aspx"
}

_NUM_ORD_SUFFIX = ("st", "nd", "rd", "th")



def _tokenise(text: str) -> List[str]:
    """
    Split `text` on anything that is NOT a-Z or 0-9, lowercase the pieces,
    and add a few normalised variants so that
        3rd      -> ['3rd', '3']
        3a       -> ['3a', '3']
        pillar-3 -> ['pillar', '3']
    """
    # NOTE: These would be defined elsewhere in your actual code.
    _IGNORE_TOKENS = set() 
    _NUM_ORD_SUFFIX = ["st", "nd", "rd", "th"]
    
    raw = re.findall(r"[A-Za-z0-9]+", text.lower())
    normalised: List[str] = []

    for tok in raw:
        if tok in _IGNORE_TOKENS:
            continue

        # 3rd, 21st, 4th  → 3, 21, 4
        m = re.match(r"^(\d+)(?:%s)$" % "|".join(_NUM_ORD_SUFFIX), tok)
        if m:
            normalised.append(m.group(1))

        # 3a  → 3        |  pillar3 → 3
        m = re.match(r"^(\d+)[a-z]+$", tok) or re.match(r"^[a-z]+(\d+)$", tok)
        if m:
            normalised.append(m.group(1))

        # crude singular-ise: services → service (helps plural ≈ singular)
        if tok.endswith("s") and len(tok) > 3:
            normalised.append(tok[:-1])

        normalised.append(tok)

    # Return unique tokens
    return sorted(list(set(normalised)))


def _parse_strategy(raw_strategy: str) -> List[Dict[str, List[str]]]:
    """
    Split the strategy on OR (top-level) and return a list of dicts:
        { 'keywords': [...], 'sites': [...] }
    Each *part* in   "pillar-3 overview site:faq OR site:explained"
    becomes          {"keywords": ["pillar-3","overview"],
                      "sites"   : ["faq"]}      etc.
    """
    alt_parts = re.split(r"\s+or\s+", raw_strategy, flags=re.I)
    parsed: List[Dict[str, List[str]]] = []

    for part in alt_parts:
        kws:   List[str] = []
        sites: List[str] = []

        for word in part.strip().split():
            if word.lower().startswith("site:"):
                sites.append(word[5:].lower())
            else:
                kws.append(word)

        parsed.append({"keywords": kws, "sites": sites})

    return parsed
