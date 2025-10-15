# FCBase
An open, community-maintained database of flight controllers for ArduPilot, PX4, and iNAV – searchable, comparable, and fully documented.

## Hardware Openness Metadata

Each controller entry records a `hardware.openness` flag (`open`, `closed`, or `mixed`) sourced from the ArduPilot Autopilot Hardware guide. This highlights whether designs follow the open Pixhawk standard or are distributed as closed hardware.

Controllers can also enumerate `hardware.revisions` entries to describe manufacturer hardware updates, including optional release dates, notes, change summaries, and supporting sources.

Each revision may declare an `overrides` block to document spec changes relative to the base controller definition. Overrides support the following sections:

- `sensors`: provide replacement `imu`, `barometer`, or `magnetometer` lists when a variant swaps sensing hardware. Arrays replace the base list for that sensor type, so include the full set used by the revision.
- `io`: supply only the changed fields (e.g., `uarts`, `peripherals`) to update port counts or connectors for a specific revision.
- `power`: override properties such as `voltage_in`, `inputs`, or `redundant` when a revision alters the power subsystem.

When overrides are present the site automatically merges them with the base controller spec so the detail page can toggle between revisions. Keep narrative `notes`, `changes`, and `sources` alongside overrides to help reviewers understand why the data differs.

## Development

Set up the project with [pnpm](https://pnpm.io/) to ensure the correct dependency tree:

```bash
pnpm install
pnpm run dev
```

Additional scripts such as `pnpm run build` and `pnpm run preview` are available through the standard `package.json` commands.

## Data Validation

Run `pnpm run validate` before committing controller updates. The validator checks every file in
`src/content/controllers/` against `meta/schema/controller.schema.json` and verifies cross-file
references for manufacturers, MCUs, sensors, firmware entries, and sources. The command exits with a
non-zero status when schema or reference errors are found so issues can be fixed before opening a
pull request.
