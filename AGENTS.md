# 🤖 FCBase Agents Guide

## 🧭 Project Overview
**FCBase** is an open, static hardware database for ArduPilot, PX4, iNAV, and EdgeTX ecosystems.
The project combines structured YAML content, JSON schemas, Astro pages, and community-sourced evidence.

> 🔤 **Language Requirement**: All user-facing content must be written in English.

---

## 📁 Core Directories
| Path | Description |
|------|-------------|
| `/src/content/controllers/` | Flight controller entries (grouped by manufacturer folders) |
| `/src/content/transmitters/` | Transmitter entries (grouped by manufacturer folders) |
| `/src/content/manufacturers/` | Manufacturer registry |
| `/src/content/mcu/` | MCU definitions |
| `/src/content/sensors/` | Sensor definitions (IMU, barometer, magnetometer) |
| `/src/content/firmware/` | Firmware metadata |
| `/src/content/sources/` | Source/evidence records |
| `/src/assets/images/controllers/` | Controller images |
| `/src/assets/images/transmitters/` | Transmitter images |
| `/meta/schema/` | JSON schemas |
| `/meta/vocab/` | Shared vocabularies |

Agents should not create new top-level directories unless explicitly requested.

---

## 📄 File Standards
- Content files are **YAML** with UTF-8 and LF line endings.
- IDs use `kebab-case` and must stay stable once published.
- Use double quotes when strings contain special characters.
- Reference fields (`brand`, `mcu`, `sensors`, `sources`, `firmware_support.id`) must point to existing IDs.
- Boolean fields must be real booleans (`true`/`false`), not string aliases.
- Omit empty optional fields instead of storing `null`.

---

## 🧠 Data & Schema Rules
### Controllers (`/src/content/controllers/**/*.yaml`)
Minimum required fields include:
- `id`, `title`, `brand`, `mcu`, `mounting`
- `power` (must define `voltage_in` or `inputs`)
- `io` (including `uarts`, `can`, `pwm`, `sd_card`)
- `sensors`
- `firmware_support` (non-empty)
- `sources` (non-empty)
- `verification.level`, `verification.last_updated`

Validation sources:
- `/meta/schema/controller.schema.json`
- `scripts/validate-controllers.ts` (schema + cross-reference checks)

### Transmitters (`/src/content/transmitters/**/*.yaml`)
Required fields include:
- `id`, `title`, `brand`
- `support.level`, `support.since_version`, `support.status`
- `sources` (non-empty)
- `keywords` (non-empty)
- `verification.level`, `verification.last_updated`

Validation sources:
- `/meta/schema/transmitter.schema.json`
- `scripts/validate-transmitters.ts` (schema + enum/reference checks)

---

## 🔍 Vocabulary & Consistency
- Reuse existing values from `/meta/vocab/*.yaml` where applicable.
- Keep units normalized (`mm`, `V`, `g`, `MHz`).
- Use date format `YYYY-MM-DD`.
- Prefer integer formatting without trailing `.0`.
- Keep arrays sorted alphabetically when order is not semantically meaningful.

---

## 🧩 Relations & Integrity
For every content entry:
- `brand` must reference an existing manufacturer.
- `sources` must reference existing source IDs.
- Controllers must reference existing MCU/sensor/firmware IDs.
- Image `src` values must match files under the corresponding local image directory.

Do not break cross-links between collections.

---

## 📸 Images & UI Changes
- Store images locally under `src/assets/images/...`.
- Do not hotlink new external images.
- Preserve metadata fields in YAML image objects (`alt`, `credit`, `source_url`).
- If a change affects UI output, capture and attach an updated screenshot.

---

## 🎨 Frontend Stack
FCBase currently uses:
- Astro `5.16.9`
- React `19.2.3`
- Tailwind CSS `4.1.18` via `@tailwindcss/vite`
- shadcn/ui patterns with Radix primitives

Guidelines:
- Use `@import "tailwindcss";` in global CSS (Tailwind v4 style).
- Use `cn()` from `@/lib/utils` for class merging.
- In Astro pages, mount interactive React components with `client:load`.
- Path alias `@/*` maps to `./src/*`.

---

## 🧩 Contribution Workflow
1. Add/update sources in `/src/content/sources/`.
2. Add/update content entry in the relevant collection.
3. Ensure `verification` is present and `last_updated` reflects the current change date.
4. Run validation:
   - `pnpm run validate` (controllers)
   - `pnpm run validate:transmitters` (transmitters)
   - or `pnpm run validate:all`
5. Open PR with clear changelog and rationale.

Recommended PR title tags:
- `feat(controller): <id>`
- `fix(data): <id>`
- `feat(transmitter): <id>`

---

## 🔏 Licensing
- Code: MIT
- Data: CC-BY 4.0
- Images: © respective manufacturers/owners (with attribution)

Do not remove attribution or license-relevant metadata.

---

## ✅ Agent Do / Don't
Agents should:
- add `sources` and `verification` for new data entries,
- keep IDs and cross-references valid,
- run relevant validation scripts before handing off,
- keep user-facing copy in English.

Agents should never:
- invent hardware specs without a source,
- silently change verified facts without evidence,
- auto-delete fields marked or implied as verified provenance.

---

## 💬 Notes
This guide is for AI coding assistants and human contributors working inside the FCBase repository.
