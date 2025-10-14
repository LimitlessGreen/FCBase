"""Extract controller, sensor, and MCU inventories from upstream firmware docs.

This helper pulls the latest hardware documentation for ArduPilot, iNAV, and
Betaflight and scrapes the flight controller names alongside any referenced
sensor or MCU identifiers. The combined inventory is written to
``meta/doc_inventory.yaml`` so the dataset can easily be compared against the
official firmware support lists.

The scraper intentionally keeps the parsing rules lightweight (regex based) to
avoid introducing additional dependencies. Each upstream source uses slightly
different formatting, so the parser normalises obvious identifiers (e.g.
``STM32H743``, ``ICM42688P``) and ignores ambiguous matches.
"""

from __future__ import annotations

import dataclasses
import datetime as _dt
import json
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Iterable, Mapping
from urllib.request import urlopen


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = BASE_DIR / "doc_inventory.yaml"


ARDUPILOT_BASE = (
    "https://raw.githubusercontent.com/ArduPilot/ardupilot_wiki/master/common/source/docs"
)
ARDUPILOT_INDEX = f"{ARDUPILOT_BASE}/common-autopilots.rst"
INAV_API_ROOT = "https://api.github.com/repos/iNavFlight/inav/contents/docs/boards"

BETAFPV_WIKI_REPO = "https://github.com/betaflight/betaflight.wiki.git"


SENSOR_REGEX = re.compile(
    r"\b((?:ICM|MPU|BMI|BMM|BNO|RM|IST|HMC|QMC)\d+[A-Z]?|MS5611|DPS310|BMP\d+|ICP20100)\b",
    re.IGNORECASE,
)

MCU_REGEX = re.compile(
    r"\b(STM32[HF]\d{3}[A-Z]?|F\d{3}(?:\w{2,3})?|H7\d{2})\b",
    re.IGNORECASE,
)


def _fetch(url: str) -> str:
    with urlopen(url) as resp:  # nosec - URLs are trusted upstream docs
        return resp.read().decode("utf-8", errors="replace")


WHITESPACE_RE = re.compile(r"\s+")


def _normalise_identifier(value: str) -> str:
    value = value.replace("\xa0", " ")
    value = value.replace("\n", " ")
    value = WHITESPACE_RE.sub(" ", value.strip())
    return value.upper()


def _scan_identifiers(text: str) -> tuple[set[str], set[str]]:
    sensors = {_normalise_identifier(match) for match in SENSOR_REGEX.findall(text)}
    mcus = {_normalise_identifier(match) for match in MCU_REGEX.findall(text)}
    # Clean up a few overly generic MCU aliases that sneak in (e.g. lone F7)
    filtered_mcus = {
        mcu
        for mcu in mcus
        if len(mcu) > 2 and not re.fullmatch(r"F\d", mcu) and mcu not in {"ALL"}
    }
    return sensors, filtered_mcus


def _first_heading_rst(text: str) -> str | None:
    match = re.search(r'^([\w\-/\s\+]+)\n[=~`^"\'\-]+\n', text, flags=re.MULTILINE)
    if match:
        return match.group(1).strip()
    return None


def _first_heading_md(text: str) -> str | None:
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("#"):
            return line.lstrip("# ").strip()
    return None


@dataclasses.dataclass
class Inventory:
    controllers: set[str]
    sensors: set[str]
    mcus: set[str]

    @classmethod
    def empty(cls) -> "Inventory":
        return cls(set(), set(), set())

    def update(self, controllers: Iterable[str], sensors: Iterable[str], mcus: Iterable[str]) -> None:
        for name in controllers:
            if not name:
                continue
            cleaned = _normalise_identifier(name)
            if not cleaned or cleaned.startswith("-"):
                continue
            if cleaned in BAD_HEADING_KEYWORDS:
                continue
            if not cleaned.isascii():
                continue
            self.controllers.add(cleaned)
        self.sensors.update(_normalise_identifier(name) for name in sensors if name)
        self.mcus.update(_normalise_identifier(name) for name in mcus if name)

    def as_dict(self) -> dict[str, list[str]]:
        return {
            "controllers": sorted(self.controllers),
            "sensors": sorted(self.sensors),
            "mcus": sorted(self.mcus),
        }


BAD_HEADING_KEYWORDS = {
    "WHERE TO BUY",
    "FEATURES",
    "PINOUT",
    "WIRING",
    "SPECIFICATIONS",
    "HARDWARE",
    "DESCRIPTION",
    "FIRMWARE TARGETS",
    "TARGET FIRMWARE",
    "NOTE FOR SERIAL RX CONFIGURATION (V3.3.0 AND LATER)",
    "NAME",
    "**OVERVIEW**",
    "TEMPLET",
    "THIS BOARD TARGET HAS BEEN RENAMED TO FF_PIKOBLX.",
}
BAD_LABEL_KEYWORDS = {"FIRMWARE LIMITATIONS"}


def scrape_ardupilot() -> Inventory:
    inventory = Inventory.empty()
    index = _fetch(ARDUPILOT_INDEX)

    controllers = []
    capture = False
    seen_entry = False
    for raw_line in index.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if stripped.startswith(".. toctree::"):
            capture = True
            seen_entry = False
            continue
        if not capture:
            continue
        if stripped.startswith(":"):
            continue
        if not stripped:
            if seen_entry:
                capture = False
                seen_entry = False
            else:
                seen_entry = True
            continue
        match = re.match(r"\s{4}([^<]+?)\s*<([^>]+)>", line)
        if not match:
            continue
        seen_entry = True
        label, target = match.groups()
        label = label.strip()
        if any(keyword in label.upper() for keyword in BAD_LABEL_KEYWORDS):
            continue
        controllers.append(label)
        if target.startswith("http"):
            # External resources are not scraped.
            continue
        target_path = f"{ARDUPILOT_BASE}/{target}.rst" if not target.endswith(".rst") else f"{ARDUPILOT_BASE}/{target}"
        try:
            content = _fetch(target_path)
        except Exception:
            continue
        heading = _first_heading_rst(content)
        if heading and heading.upper() not in BAD_HEADING_KEYWORDS:
            controllers.append(heading)
        sensors, mcus = _scan_identifiers(content)
        inventory.sensors.update(sensors)
        inventory.mcus.update(mcus)

    inventory.update(controllers, [], [])
    return inventory


def scrape_inav() -> Inventory:
    inventory = Inventory.empty()
    controllers = []

    api_listing = json.loads(_fetch(INAV_API_ROOT))
    for entry in api_listing:
        if not entry["name"].lower().endswith(".md"):
            continue
        raw_url = entry["download_url"]
        content = _fetch(raw_url)
        heading = _first_heading_md(content)
        if heading:
            controllers.append(heading)
        sensors, mcus = _scan_identifiers(content)
        inventory.sensors.update(sensors)
        inventory.mcus.update(mcus)

    inventory.update(controllers, [], [])
    return inventory


def scrape_betaflight() -> Inventory:
    inventory = Inventory.empty()
    controllers = []
    with tempfile.TemporaryDirectory() as tmpdir:
        repo_path = Path(tmpdir) / "betaflight.wiki"
        subprocess.run(
            [
                "git",
                "clone",
                "--depth",
                "1",
                BETAFPV_WIKI_REPO,
                str(repo_path),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for path in repo_path.glob("Board-*.md"):
            content = path.read_text(encoding="utf-8", errors="replace")
            heading = _first_heading_md(content)
            if heading:
                controllers.append(heading)
            sensors, mcus = _scan_identifiers(content)
            inventory.sensors.update(sensors)
            inventory.mcus.update(mcus)

    inventory.update(controllers, [], [])
    return inventory


def to_yaml(data: Mapping[str, Mapping[str, Iterable[str]]]) -> str:
    lines = ["# Generated on " + _dt.date.today().isoformat(), ""]
    for platform, payload in data.items():
        lines.append(f"{platform}:")
        for section, items in payload.items():
            lines.append(f"  {section}:")
            if not items:
                lines.append("    []")
                continue
            for item in items:
                lines.append(f"    - {item}")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    ardupilot = scrape_ardupilot()
    inav = scrape_inav()
    betaflight = scrape_betaflight()

    document = {
        "ardupilot": ardupilot.as_dict(),
        "inav": inav.as_dict(),
        "betaflight": betaflight.as_dict(),
    }
    OUTPUT_FILE.write_text(to_yaml(document), encoding="utf-8")


if __name__ == "__main__":
    main()
