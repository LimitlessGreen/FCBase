import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  COMPARE_EVENT_NAME,
  type CompareEventDetail,
  clearCompareList,
  getCompareStorageKey,
  readCompareList,
  writeCompareList,
} from "@/lib/compare";
import { getCompareComponentDefinition } from "@/lib/component-registry";

interface ControllerCompareImage {
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

interface FirmwareSupportEntry {
  id: string;
  name: string;
  status?: string | null;
  since?: string | null;
  last?: string | null;
  notes?: string | null;
}

interface DimensionsInfo {
  length?: number | null;
  width?: number | null;
  height?: number | null;
  weight?: number | null;
}

interface VoltageRange {
  min?: number | null;
  max?: number | null;
  nominal?: number | null;
  unit?: string | null;
  notes?: string | null;
  cells?: {
    min?: number | null;
    max?: number | null;
  } | null;
}

interface CurrentSpec {
  continuous?: number | null;
  max?: number | null;
  peak?: number | null;
  unit?: string | null;
  notes?: string | null;
}

interface PowerInputInfo {
  name: string;
  type?: string | null;
  connector?: string | null;
  voltage?: VoltageRange | null;
  current?: CurrentSpec | null;
  notes?: string | null;
}

interface PowerInfo {
  voltageIn?: string | null;
  redundant?: boolean | null;
  notes?: string | null;
  inputs: PowerInputInfo[];
}

interface PeripheralInfo {
  name: string;
  type?: string | null;
  count?: number | null;
  interfaces: string[];
  connector?: string | null;
  voltage?: string | null;
  notes?: string | null;
}

interface IOInfo {
  uarts?: number | null;
  can?: number | null;
  pwm?: number | null;
  ethernet?: boolean | null;
  sdCard?: boolean | null;
  peripherals: PeripheralInfo[];
}

interface SensorItem {
  id: string;
  name: string;
  count?: number | null;
}

interface SensorInfo {
  imu: SensorItem[];
  barometer: SensorItem[];
  magnetometer: SensorItem[];
}

interface PeripheralPortInfo {
  port: string;
  type?: string | null;
  defaultUse?: string | null;
  voltage?: string | null;
  connector?: string | null;
  notes?: string | null;
}

interface HardwareInfo {
  openness?: string | null;
}

interface ControllerCompareItem {
  id: string;
  slug: string;
  title: string;
  manufacturer: string;
  image?: ControllerCompareImage | null;
  mounting?: string | null;
  mcu?: string | null;
  firmwares: FirmwareSupportEntry[];
  dimensions?: DimensionsInfo;
  power: PowerInfo;
  io: IOInfo;
  sensors: SensorInfo;
  features: string[];
  peripheralPorts: PeripheralPortInfo[];
  hardware: HardwareInfo;
  notes?: string | null;
}

interface ControllerCompareTableProps {
  items: ControllerCompareItem[];
  basePath: string;
}

const controllerComponent = getCompareComponentDefinition("controller");
export const compareComponentId = controllerComponent.id;
const type = compareComponentId;

interface SpecRow {
  id: string;
  label: string;
  render: (item: ControllerCompareItem) => React.ReactNode;
  hasContent?: (item: ControllerCompareItem) => boolean;
}

interface SpecSection {
  id: string;
  label: string;
  rows: SpecRow[];
}

const formatMounting = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  if (value === "cube" || value === "wing" || value === "custom") {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  return `${value.replace(/x/gi, "×")}mm`;
};

const formatMcu = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  return value.toUpperCase();
};

const formatBoolean = (value?: boolean | null) => {
  if (value === undefined || value === null) {
    return "—";
  }

  return value ? "Yes" : "No";
};

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) {
    return "—";
  }

  return value.toString();
};

const formatWeight = (value?: number | null) => {
  if (value === undefined || value === null) {
    return "—";
  }

  return `${value}g`;
};

const formatDimensions = (value?: DimensionsInfo) => {
  if (!value) {
    return "—";
  }

  const parts: string[] = [];

  if (typeof value.length === "number" && typeof value.width === "number") {
    const height =
      typeof value.height === "number" ? ` × ${value.height.toString()} mm` : " mm";
    parts.push(`${value.length.toString()} × ${value.width.toString()}${height}`);
  } else if (typeof value.length === "number" || typeof value.width === "number") {
    const dimension = value.length ?? value.width;
    if (typeof dimension === "number") {
      parts.push(`${dimension.toString()} mm`);
    }
  }

  return parts.length > 0 ? parts.join(" / ") : "—";
};

const formatOpenness = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatSupportStatus = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[_-]+/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatVoltageRange = (range?: VoltageRange | null) => {
  if (!range) {
    return null;
  }

  const unit = range.unit ?? "V";
  const parts: string[] = [];

  if (typeof range.min === "number" && typeof range.max === "number") {
    parts.push(`${range.min}–${range.max} ${unit}`);
  } else if (typeof range.min === "number") {
    parts.push(`≥${range.min} ${unit}`);
  } else if (typeof range.max === "number") {
    parts.push(`≤${range.max} ${unit}`);
  } else if (typeof range.nominal === "number") {
    parts.push(`${range.nominal} ${unit}`);
  }

  if (range.cells && (range.cells.min || range.cells.max)) {
    if (
      typeof range.cells.min === "number" &&
      typeof range.cells.max === "number" &&
      range.cells.min !== range.cells.max
    ) {
      parts.push(`${range.cells.min}–${range.cells.max}S`);
    } else if (typeof range.cells.min === "number") {
      parts.push(`${range.cells.min}S`);
    } else if (typeof range.cells.max === "number") {
      parts.push(`${range.cells.max}S`);
    }
  }

  const base = parts.join(" / ");

  if (range.notes) {
    return base ? `${base} (${range.notes})` : range.notes;
  }

  return base || null;
};

const formatCurrent = (spec?: CurrentSpec | null) => {
  if (!spec) {
    return null;
  }

  const unit = spec.unit ?? "A";

  if (typeof spec.continuous === "number" && typeof spec.max === "number") {
    return `${spec.continuous}${unit} continuous, ${spec.max}${unit} peak`;
  }

  if (typeof spec.max === "number") {
    return `${spec.max}${unit} max`;
  }

  if (typeof spec.continuous === "number") {
    return `${spec.continuous}${unit}`;
  }

  if (typeof spec.peak === "number") {
    return `${spec.peak}${unit} peak`;
  }

  return null;
};

const PERIPHERAL_LABEL_SYNONYMS: Record<string, string> = {
  usb: "USB",
  uart: "UART",
  can: "CAN",
  pwm: "PWM",
  ppm: "PPM",
  spi: "SPI",
  i2c: "I2C",
  i2s: "I2S",
  mavlink: "MAVLink",
  sbus: "SBUS",
  sbus2: "SBUS2",
  dsm: "DSM",
  fport: "FPort",
  crsf: "CRSF",
  srxl2: "SRXL2",
  dshot: "DShot",
  smbus: "SMBus",
  esc: "ESC",
  rc: "RC",
  led: "LED",
  leds: "LEDs",
  gps: "GPS",
  adc: "ADC",
  jtag: "JTAG",
  uavcan: "UAVCAN",
  dronecan: "DroneCAN",
};

const canonicalizePeripheralLabel = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const sanitized = value
    .replace(/[_-]+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) {
    return "";
  }

  const lower = sanitized.toLowerCase();
  const synonym = PERIPHERAL_LABEL_SYNONYMS[lower];
  if (synonym) {
    return synonym;
  }

  const words = sanitized.split(" ").map((word) => {
    if (word === "/" || word === "&") {
      return word;
    }

    const normalized = word.toLowerCase();
    const match = PERIPHERAL_LABEL_SYNONYMS[normalized];
    if (match) {
      return match;
    }

    if (/^[a-z0-9]+$/.test(normalized) && /[0-9]/.test(normalized)) {
      return normalized.toUpperCase();
    }

    if (/^[a-z]+$/.test(normalized) && normalized.length <= 3) {
      return normalized.toUpperCase();
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  });

  return words
    .join(" ")
    .replace(/\s+\/\s+/g, " / ")
    .replace(/\s+&\s+/g, " & ")
    .trim();
};

const formatPeripheralType = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const label = canonicalizePeripheralLabel(value);
  return label || null;
};

const formatInterfaceList = (interfaces: string[]) => {
  if (!interfaces || interfaces.length === 0) {
    return null;
  }

  const formatted = interfaces
    .map((entry) => canonicalizePeripheralLabel(entry))
    .filter((label) => label.length > 0);

  if (formatted.length === 0) {
    return null;
  }

  return formatted.join(", ");
};

const renderSensorList = (sensors: SensorItem[]) => {
  if (!sensors || sensors.length === 0) {
    return "—";
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {sensors.map((sensor, index) => {
        const countLabel =
          typeof sensor.count === "number" && sensor.count > 0
            ? `×${sensor.count}`
            : null;

        return (
          <Badge
            key={`${sensor.id}-${index}`}
            variant="outline"
            className="border-border/60"
          >
            <span className="font-medium">{sensor.name}</span>
            {countLabel ? <span className="ml-1 text-xs text-muted-foreground">{countLabel}</span> : null}
          </Badge>
        );
      })}
    </div>
  );
};

const renderFeatureList = (features: string[]) => {
  if (!features || features.length === 0) {
    return "—";
  }

  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
      {features.map((feature) => (
        <li key={feature}>{feature}</li>
      ))}
    </ul>
  );
};

const renderFirmwareSupport = (entries: FirmwareSupportEntry[]) => {
  if (!entries || entries.length === 0) {
    return "—";
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const statusLabel = formatSupportStatus(entry.status);
        return (
          <div
            key={entry.id}
            className="rounded-lg border border-border/40 bg-muted/10 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-border/60">
                {entry.name}
              </Badge>
              {statusLabel ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {statusLabel}
                </span>
              ) : null}
            </div>
            {(entry.since || entry.last) && (
              <div className="mt-1 text-xs text-muted-foreground">
                {entry.since ? `Since ${entry.since}` : null}
                {entry.since && entry.last ? " · " : null}
                {entry.last ? `Last ${entry.last}` : null}
              </div>
            )}
            {entry.notes ? (
              <p className="mt-1 text-xs text-muted-foreground">{entry.notes}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const renderPowerInputs = (inputs: PowerInputInfo[]) => {
  if (!inputs || inputs.length === 0) {
    return "—";
  }

  return (
    <div className="space-y-3">
      {inputs.map((input) => {
        const voltageLabel = formatVoltageRange(input.voltage);
        const currentLabel = formatCurrent(input.current);
        const typeLabel = formatPeripheralType(input.type);

        return (
          <div
            key={input.name}
            className="rounded-lg border border-border/40 bg-muted/10 p-3"
          >
            <div className="text-sm font-medium text-foreground">{input.name}</div>
            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
              {typeLabel ? <div>Type: {typeLabel}</div> : null}
              {input.connector ? <div>Connector: {input.connector}</div> : null}
              {voltageLabel ? <div>Voltage: {voltageLabel}</div> : null}
              {currentLabel ? <div>Current: {currentLabel}</div> : null}
              {input.notes ? <div>{input.notes}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const renderPeripheralList = (peripherals: PeripheralInfo[]) => {
  if (!peripherals || peripherals.length === 0) {
    return "—";
  }

  return (
    <div className="space-y-3">
      {peripherals.map((peripheral) => {
        const typeLabel = formatPeripheralType(peripheral.type);
        const interfaces = formatInterfaceList(peripheral.interfaces);

        return (
          <div
            key={peripheral.name}
            className="rounded-lg border border-border/40 bg-muted/10 p-3"
          >
            <div className="text-sm font-medium text-foreground">
              {peripheral.name}
              {typeof peripheral.count === "number" && peripheral.count > 0
                ? ` (×${peripheral.count})`
                : null}
            </div>
            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
              {typeLabel ? <div>Type: {typeLabel}</div> : null}
              {interfaces ? <div>Interfaces: {interfaces}</div> : null}
              {peripheral.connector ? <div>Connector: {peripheral.connector}</div> : null}
              {peripheral.voltage ? <div>Voltage: {peripheral.voltage}</div> : null}
              {peripheral.notes ? <div>{peripheral.notes}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const renderPeripheralPorts = (ports: PeripheralPortInfo[]) => {
  if (!ports || ports.length === 0) {
    return "—";
  }

  return (
    <div className="space-y-3">
      {ports.map((port) => {
        const typeLabel = formatPeripheralType(port.type);
        return (
          <div key={port.port} className="rounded-lg border border-border/40 bg-muted/10 p-3">
            <div className="text-sm font-medium text-foreground">{port.port}</div>
            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
              {typeLabel ? <div>Type: {typeLabel}</div> : null}
              {port.defaultUse ? <div>Default use: {port.defaultUse}</div> : null}
              {port.voltage ? <div>Voltage: {port.voltage}</div> : null}
              {port.connector ? <div>Connector: {port.connector}</div> : null}
              {port.notes ? <div>{port.notes}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const renderNotes = (notes?: string | null) => {
  if (!notes) {
    return "—";
  }

  return <p className="text-sm leading-relaxed text-foreground">{notes}</p>;
};

export default function ControllerCompareTable({
  items,
  basePath,
}: ControllerCompareTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() =>
    readCompareList(type),
  );

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const storageKey = getCompareStorageKey(type);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setSelectedIds(readCompareList(type));
      }
    };

    const handleCompareChange = (event: Event) => {
      const detail = (event as CustomEvent<CompareEventDetail>).detail;
      if (detail?.type === type) {
        setSelectedIds(detail.ids);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COMPARE_EVENT_NAME, handleCompareChange as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        COMPARE_EVENT_NAME,
        handleCompareChange as EventListener,
      );
    };
  }, []);

  React.useEffect(() => {
    if (selectedIds.length === 0) {
      return;
    }

    const validIds = selectedIds.filter((id) =>
      items.some((item) => item.id === id),
    );

    if (validIds.length !== selectedIds.length) {
      setSelectedIds(validIds);
      writeCompareList(type, validIds);
    }
  }, [items, selectedIds]);

  const selectedItems = React.useMemo(
    () =>
      selectedIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is ControllerCompareItem => Boolean(item)),
    [items, selectedIds],
  );

  const removeItem = React.useCallback(
    (id: string) => {
      const next = selectedIds.filter((value) => value !== id);
      setSelectedIds(next);
      writeCompareList(type, next);
    },
    [selectedIds],
  );

  const clearAll = React.useCallback(() => {
    clearCompareList(type);
    setSelectedIds([]);
  }, []);

  const sections: SpecSection[] = [
    {
      id: "core",
      label: "Core specifications",
      rows: [
        {
          id: "manufacturer",
          label: "Manufacturer",
          render: (item) => item.manufacturer,
        },
        {
          id: "mcu",
          label: "MCU",
          render: (item) => formatMcu(item.mcu),
        },
        {
          id: "mounting",
          label: "Mounting",
          render: (item) => formatMounting(item.mounting),
        },
        {
          id: "dimensions",
          label: "Dimensions",
          render: (item) => formatDimensions(item.dimensions),
        },
        {
          id: "weight",
          label: "Weight",
          render: (item) => formatWeight(item.dimensions?.weight),
        },
        {
          id: "hardware-openness",
          label: "Hardware openness",
          render: (item) => formatOpenness(item.hardware?.openness),
        },
      ],
    },
    {
      id: "power",
      label: "Power",
      rows: [
        {
          id: "voltage-in",
          label: "Input voltage",
          render: (item) => item.power.voltageIn ?? "—",
        },
        {
          id: "redundant",
          label: "Redundant power",
          render: (item) => formatBoolean(item.power.redundant),
        },
        {
          id: "power-notes",
          label: "Power notes",
          render: (item) => item.power.notes ?? "—",
          hasContent: (item) => Boolean(item.power.notes),
        },
        {
          id: "power-inputs",
          label: "Power inputs",
          render: (item) => renderPowerInputs(item.power.inputs),
          hasContent: (item) => item.power.inputs.length > 0,
        },
      ],
    },
    {
      id: "io",
      label: "I/O & Connectivity",
      rows: [
        {
          id: "uarts",
          label: "UART ports",
          render: (item) => formatNumber(item.io.uarts),
        },
        {
          id: "can",
          label: "CAN buses",
          render: (item) => formatNumber(item.io.can),
        },
        {
          id: "pwm",
          label: "PWM outputs",
          render: (item) => formatNumber(item.io.pwm),
        },
        {
          id: "ethernet",
          label: "Ethernet",
          render: (item) => formatBoolean(item.io.ethernet),
        },
        {
          id: "sdcard",
          label: "SD card",
          render: (item) => formatBoolean(item.io.sdCard),
        },
        {
          id: "peripherals",
          label: "Peripheral overview",
          render: (item) => renderPeripheralList(item.io.peripherals),
          hasContent: (item) => item.io.peripherals.length > 0,
        },
      ],
    },
    {
      id: "sensors",
      label: "Sensors & Features",
      rows: [
        {
          id: "imu",
          label: "IMU sensors",
          render: (item) => renderSensorList(item.sensors.imu),
        },
        {
          id: "barometer",
          label: "Barometer sensors",
          render: (item) => renderSensorList(item.sensors.barometer),
        },
        {
          id: "magnetometer",
          label: "Magnetometer sensors",
          render: (item) => renderSensorList(item.sensors.magnetometer),
        },
        {
          id: "features",
          label: "Features",
          render: (item) => renderFeatureList(item.features),
        },
      ],
    },
    {
      id: "firmware",
      label: "Firmware support",
      rows: [
        {
          id: "firmware-support",
          label: "Support matrix",
          render: (item) => renderFirmwareSupport(item.firmwares),
        },
      ],
    },
    {
      id: "ports",
      label: "Peripheral ports",
      rows: [
        {
          id: "peripheral-ports",
          label: "I/O ports",
          render: (item) => renderPeripheralPorts(item.peripheralPorts),
        },
      ],
    },
    {
      id: "notes",
      label: "Additional information",
      rows: [
        {
          id: "notes",
          label: "Notes",
          render: (item) => renderNotes(item.notes),
          hasContent: (item) => Boolean(item.notes),
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Compare flight controllers</h1>
          <p className="text-sm text-muted-foreground">
            Toggle controllers on their detail pages to build a side-by-side comparison here.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start rounded-full px-4"
          onClick={clearAll}
          disabled={selectedItems.length === 0}
        >
          Clear all
        </Button>
      </div>

      {selectedItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-center">
          <p className="text-base font-medium text-foreground">
            No controllers selected yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Visit any controller page and toggle the compare switch to start building your list.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-sm shadow-xs"
              >
                <a
                  href={`${basePath}/controllers/${item.slug}`}
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {item.title}
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </Button>
              </span>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60 bg-background shadow-sm">
            <table className="min-w-[960px] w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Specification
                  </th>
                  {selectedItems.map((item) => (
                    <th key={item.id} className="px-4 py-3 text-left align-bottom">
                      <div className="flex flex-col items-start gap-2">
                        <div className="flex h-24 w-full max-w-[140px] items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/30 p-2">
                          {item.image?.url ? (
                            <img
                              src={item.image.url}
                              alt={item.image.alt ?? item.title}
                              loading="lazy"
                              decoding="async"
                              width={item.image.width ?? undefined}
                              height={item.image.height ?? undefined}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground/70">No image</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <a
                            href={`${basePath}/controllers/${item.slug}`}
                            className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                          >
                            {item.title}
                          </a>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {item.manufacturer}
                          </span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sections.map((section) => {
                  const visibleRows = section.rows.filter((row) =>
                    selectedItems.some((item) =>
                      row.hasContent ? row.hasContent(item) : true,
                    ),
                  );

                  if (visibleRows.length === 0) {
                    return null;
                  }

                  return (
                    <React.Fragment key={section.id}>
                      <tr className="bg-muted/30">
                        <th
                          colSpan={selectedItems.length + 1}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {section.label}
                        </th>
                      </tr>
                      {visibleRows.map((row) => (
                        <tr key={row.id} className="bg-background">
                          <th
                            scope="row"
                            className="bg-muted/20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            {row.label}
                          </th>
                          {selectedItems.map((item) => (
                            <td
                              key={`${row.id}-${item.id}`}
                              className="px-4 py-3 align-top text-sm text-foreground"
                            >
                              {row.render(item)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
