# 🤖 FCBase Agents Guide

## 🧭 Project Overview
**FCBase** is an open, static database of flight controllers for ArduPilot, PX4, and iNAV.
The project combines a structured YAML/JSON dataset, static Astro pages, and community-contributed metadata.

> 🔤 **Language Requirement**: All user-facing content must be written in English.

---

## 📁 Core Directories
| Path | Description |
|------|--------------|
| `/content/controllers/` | One file per controller, e.g. `matek-h743-slim-v4.yaml` |
| `/content/manufacturers/` | Manufacturer registry |
| `/content/mcu/` | MCU types |
| `/content/sensors/` | Sensor specs (IMU, Baro, Mag) |
| `/content/firmware/` | Supported firmware metadata |
| `/content/issues/` | Known hardware issues |
| `/content/sources/` | Data sources & evidence |
| `/meta/` | Schemas, vocabularies, changelogs |

Agents should not create new directories without explicit mention here.

---

## 📄 File Standards
- All content files are **YAML**, UTF-8, LF line endings.
- IDs use `kebab-case`, e.g. `matek-h743-slim-v4`.
- Strings use **double quotes** when containing special characters.
- Reference fields (`mcu`, `brand`, `sensors`) must point to existing IDs.
- Boolean fields (`sd_card`, `can`) must be `true`/`false`, not `"yes"`.

---

## 🧠 Schema Summary
Minimum required fields for `/content/controllers/*.yaml`:

| Field | Type | Description |
|--------|------|-------------|
| `id` | string | unique identifier |
| `title` | string | product name |
| `brand` | string | manufacturer ID |
| `mcu` | string | MCU reference |
| `mounting` | enum | e.g. `20x20`, `30.5x30.5`, `cube`, `wing` |
| `power.voltage_in` | string | supply range |
| `io.uarts` | number | number of UARTs |
| `firmware_support` | list | supported firmware objects |
| `sources` | list | source IDs |
| `verification.level` | enum | `unverified`, `community`, `reviewed` |
| `verification.last_updated` | date | ISO format |

Agents must validate each file against `/meta/schema/controller.schema.json` before PR submission.

---

## 🔍 Vocabulary Validation
- Use enums from `/meta/vocab/*.yaml`
- Disallowed values: any that do not match vocab
- Normalize units (mm, V, g, MHz)

---

## 🧩 Relations
- Each controller must reference:
  - one existing `manufacturer`
  - one existing `mcu`
  - zero or more `sensors`
- Cross-links must not be broken.

---

## 📸 Images
- Place images in `/assets/images/controllers/`
- Filename: `<controller-id>-<view>.jpg`
- Metadata in controller YAML:
  - `alt`, `credit`, `source_url` required
- Agents may **not** auto-download or hotlink external images.

---

## 🔏 Licensing
- Code: MIT License  
- Data: CC-BY 4.0  
- Images: © respective manufacturers (fair use only)  

Agents must preserve attribution fields and license headers.

---

## 🧩 Contribution Flow
1. Validate new data via schema.
2. Add sources in `/content/sources/`.
3. Add or update controller file.
4. Run CI checks (`pnpm run validate`).
5. Create Pull Request with clear changelog entry.

Agents must:
- Add `sources` and `verification` fields.
- Include `last_updated` date automatically.
- Tag PR title as `feat(controller): <id>` or `fix(data): <id>`.

---

## 🧮 Data Quality Rules
- Numerical values: no trailing `.0`
- Arrays sorted alphabetically
- Date format: `YYYY-MM-DD`
- Empty optional fields omitted, not `null`

---

## 🪪 Metadata for Agents
```yaml
agent:
  name: FCBase Data Assistant
  language: en
  data_format: yaml
  schema_path: /meta/schema/controller.schema.json
  enforce_vocabulary: true
  auto_add_last_updated: true
  auto_format: true
  review_required: true
```

---

## 🤝 Guidelines for PR Generation
When generating a new controller entry, include:
- A short `summary`
- Minimum 1 source (manufacturer or datasheet)
- Verification = `community`
- Set `last_updated` = current date
- Generate `keywords` from title, brand, MCU, and form factor

Agents should never:
- invent specs without a source  
- modify existing verified entries without explicit request  
- auto-delete fields marked `verified: true`

---

### ✅ Example Command for Data Agent
> "Create a new controller entry for *Holybro Kakute H743 Wing* using the FCBase schema.  
> Use manufacturer docs as the primary source, include ports, firmware support, and add a verification level of `community`."

---

# 💬 Notes
This file is intended for:
- GitHub Copilot / ChatGPT agents  
- Local AI assistants (Cursor, Continue, OpenDevin)  
- Human contributors who want to understand data standards
