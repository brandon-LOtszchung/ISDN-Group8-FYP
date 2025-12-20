import re


_SPACE_RE = re.compile(r"\s+")
_KEEP_RE = re.compile(r"[^a-z0-9\s]")


def normalize_food_name(name: str) -> str:
    s = (name or "").strip().lower()
    s = _KEEP_RE.sub(" ", s)
    s = _SPACE_RE.sub(" ", s).strip()
    if s.endswith("es") and len(s) > 3:
        return s[:-2]
    if s.endswith("s") and len(s) > 2:
        return s[:-1]
    return s


