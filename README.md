# FCBase

## Overview
FCBase is an open, community-maintained database of multirotor and fixed-wing flight controllers for ArduPilot, PX4, and iNAV. The project centralizes hardware specifications, firmware compatibility, and provenance so pilots, manufacturers, and reviewers can evaluate boards with consistent, transparent data.

## Features
- **Searchable catalog** of flight controllers with standardized metadata for quick comparison.
- **Revision-aware specs** that document hardware changes, overrides, and supporting sources.
- **Validation pipeline** that enforces schema compliance, vocabulary consistency, and cross-file links.
- **Static site frontend** built with Astro, Tailwind CSS v4, and shadcn/ui components for fast browsing.
- **Community contributions** tracked through structured YAML files and attribution-friendly licensing.

## Architecture
- **Content layer**: YAML files in `/content/**` capture controller, manufacturer, MCU, sensor, firmware, and source records.
- **Schemas & vocabularies**: JSON Schema definitions in `/meta/schema` and enumerations in `/meta/vocab` govern allowed fields and values.
- **Presentation**: Astro 5 renders the static site, while React components and Tailwind CSS v4 deliver the interactive UI.
- **Tooling**: pnpm scripts provide validation, development, and build workflows; data integrity checks run before publishing.

## Installation
1. Install [pnpm](https://pnpm.io/) if it is not already available.
2. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```

## Usage
- Start the local development server:
  ```bash
  pnpm run dev
  ```
- Validate content updates before committing:
  ```bash
  pnpm run validate
  ```
- Build the production site when ready to publish:
  ```bash
  pnpm run build
  ```

## Contributing
- Keep all user-facing content in English and follow the directory structure outlined in `AGENTS.md`.
- Add or update YAML content files with complete metadata, sources, and `verification` blocks.
- Run `pnpm run validate` to ensure schema compliance and fix any reported issues before opening a pull request.
- Summarize changes clearly in the PR description and follow the repository naming conventions for new controller entries.

## License
- **Code** is released under the [MIT License](./LICENSE).
- **Data** is provided under the [Creative Commons Attribution 4.0 International License](./LICENSE).
- **Images** remain © their respective owners and must retain proper attribution when used.
