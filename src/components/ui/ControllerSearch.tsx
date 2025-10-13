import * as React from "react";
import Fuse from "fuse.js";
import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./Card";
import { Badge } from "./Badge";

interface Controller {
  id: string;
  title: string;
  brand: string;
  mcu: string;
  mounting: string;
  firmware: string[];
  uarts: number;
  can: number;
  pwm: number;
  sdCard?: boolean;
  ethernet?: boolean;
  barometer?: boolean;
  redundant?: boolean;
}

interface ControllerSearchProps {
  controllers: Controller[];
  basePath?: string;
}

type SortOption = 'name-asc' | 'name-desc' | 'mcu' | 'uarts-desc' | 'ports-desc';

export function ControllerSearch({ controllers, basePath = "" }: ControllerSearchProps) {
  // Basic filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMCU, setSelectedMCU] = React.useState<string | null>(null);
  const [selectedMounting, setSelectedMounting] = React.useState<string | null>(null);
  const [selectedFirmware, setSelectedFirmware] = React.useState<string | null>(null);
  
  // Advanced filters
  const [minUarts, setMinUarts] = React.useState<number>(0);
  const [requireCAN, setRequireCAN] = React.useState(false);
  const [requireSDCard, setRequireSDCard] = React.useState(false);
  const [requireEthernet, setRequireEthernet] = React.useState(false);
  const [requireBarometer, setRequireBarometer] = React.useState(false);
  const [requireRedundant, setRequireRedundant] = React.useState(false);
  
  // UI state
  const [sortBy, setSortBy] = React.useState<SortOption>('name-asc');
  const [showFilters, setShowFilters] = React.useState(false);
  const [results, setResults] = React.useState<Controller[]>([]);

  // Extract unique values for filters
  const mcuOptions = React.useMemo(() => 
    Array.from(new Set(controllers.map(c => c.mcu))).sort(),
    [controllers]
  );
  
  const mountingOptions = React.useMemo(() => 
    Array.from(new Set(controllers.map(c => c.mounting))).sort(),
    [controllers]
  );
  
  const firmwareOptions = React.useMemo(() => 
    Array.from(new Set(controllers.flatMap(c => c.firmware))).sort(),
    [controllers]
  );

  // Configure Fuse.js
  const fuse = React.useMemo(() => 
    new Fuse(controllers, {
      keys: [
        { name: "title", weight: 2 },
        { name: "brand", weight: 1.5 },
        { name: "mcu", weight: 1 },
      ],
      threshold: 0.3,
      includeScore: true,
    }),
    [controllers]
  );

  // Perform search, filtering, and sorting
  React.useEffect(() => {
    let filtered = controllers;

    // Text search
    if (searchQuery.trim()) {
      const fuseResults = fuse.search(searchQuery);
      filtered = fuseResults.map(r => r.item);
    }

    // Basic filters
    if (selectedMCU) {
      filtered = filtered.filter(c => c.mcu === selectedMCU);
    }
    if (selectedMounting) {
      filtered = filtered.filter(c => c.mounting === selectedMounting);
    }
    if (selectedFirmware) {
      filtered = filtered.filter(c => c.firmware.includes(selectedFirmware));
    }

    // Advanced filters
    if (minUarts > 0) {
      filtered = filtered.filter(c => c.uarts >= minUarts);
    }
    if (requireCAN) {
      filtered = filtered.filter(c => c.can > 0);
    }
    if (requireSDCard) {
      filtered = filtered.filter(c => c.sdCard === true);
    }
    if (requireEthernet) {
      filtered = filtered.filter(c => c.ethernet === true);
    }
    if (requireBarometer) {
      filtered = filtered.filter(c => c.barometer === true);
    }
    if (requireRedundant) {
      filtered = filtered.filter(c => c.redundant === true);
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'mcu':
          return a.mcu.localeCompare(b.mcu) || a.title.localeCompare(b.title);
        case 'uarts-desc':
          return b.uarts - a.uarts || a.title.localeCompare(b.title);
        case 'ports-desc':
          const aPorts = a.uarts + a.can + a.pwm;
          const bPorts = b.uarts + b.can + b.pwm;
          return bPorts - aPorts || a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setResults(sorted);
  }, [
    searchQuery, 
    selectedMCU, 
    selectedMounting, 
    selectedFirmware,
    minUarts,
    requireCAN,
    requireSDCard,
    requireEthernet,
    requireBarometer,
    requireRedundant,
    sortBy,
    controllers, 
    fuse
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMCU(null);
    setSelectedMounting(null);
    setSelectedFirmware(null);
    setMinUarts(0);
    setRequireCAN(false);
    setRequireSDCard(false);
    setRequireEthernet(false);
    setRequireBarometer(false);
    setRequireRedundant(false);
  };

  const hasActiveFilters = 
    searchQuery || 
    selectedMCU || 
    selectedMounting || 
    selectedFirmware ||
    minUarts > 0 ||
    requireCAN ||
    requireSDCard ||
    requireEthernet ||
    requireBarometer ||
    requireRedundant;

  return (
    <div className="w-full space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search controllers by name, brand, or MCU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="space-y-4">
        {/* Basic Filters Row */}
        <div className="flex flex-wrap gap-2">
          {/* MCU Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center">MCU:</span>
            {mcuOptions.slice(0, 5).map((mcu) => (
              <button
                key={mcu}
                onClick={() => setSelectedMCU(selectedMCU === mcu ? null : mcu)}
                className={cn(
                  "px-3 py-1 text-sm rounded-full border transition-colors",
                  selectedMCU === mcu
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border"
                )}
              >
                {mcu.replace('stmicro-', '').toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mounting Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center">Mounting:</span>
            {mountingOptions.map((mounting) => (
              <button
                key={mounting}
                onClick={() => setSelectedMounting(selectedMounting === mounting ? null : mounting)}
                className={cn(
                  "px-3 py-1 text-sm rounded-full border transition-colors",
                  selectedMounting === mounting
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border"
                )}
              >
                {mounting}
              </button>
            ))}
          </div>

          {/* Firmware Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-muted-foreground self-center">Firmware:</span>
            {firmwareOptions.map((firmware) => (
              <button
                key={firmware}
                onClick={() => setSelectedFirmware(selectedFirmware === firmware ? null : firmware)}
                className={cn(
                  "px-3 py-1 text-sm rounded-full border transition-colors",
                  selectedFirmware === firmware
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border"
                )}
              >
                {firmware.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Toggle + Sorting + Clear */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-4 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2",
              showFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-border"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Advanced Filters
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="mcu">MCU Type</option>
              <option value="uarts-desc">Most UARTs</option>
              <option value="ports-desc">Most Ports Total</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="p-6 rounded-lg border border-border bg-muted/30 space-y-6">
            {/* Port Requirements */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Port Requirements</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* UART Min */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Min UARTs: <span className="text-muted-foreground">{minUarts}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={minUarts}
                    onChange={(e) => setMinUarts(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* CAN Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireCAN}
                    onChange={(e) => setRequireCAN(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Require CAN</span>
                </label>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Required Features</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireSDCard}
                    onChange={(e) => setRequireSDCard(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">SD Card</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireEthernet}
                    onChange={(e) => setRequireEthernet(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Ethernet</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireBarometer}
                    onChange={(e) => setRequireBarometer(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Barometer</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireRedundant}
                    onChange={(e) => setRequireRedundant(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Redundant Power</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {hasActiveFilters ? (
          <span>Found {results.length} controller{results.length !== 1 ? 's' : ''}</span>
        ) : (
          <span>Showing all {controllers.length} controllers</span>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((controller) => (
          <a
            key={controller.id}
            href={`${basePath}/controllers/${controller.id}`}
            className="group block"
          >
            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="relative aspect-video w-full bg-gradient-to-br from-muted via-background to-muted overflow-hidden rounded-t-xl">
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg line-clamp-2">{controller.title}</h3>
                    <p className="text-sm text-muted-foreground">{controller.brand}</p>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {controller.mcu.replace('stmicro-', '').toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {controller.mounting}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {controller.firmware.map(fw => (
                      <Badge key={fw} variant="secondary" className="text-xs">
                        {fw.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>UARTs: {controller.uarts} • CAN: {controller.can} • PWM: {controller.pwm}</div>
                    {(controller.sdCard || controller.ethernet || controller.barometer) && (
                      <div className="flex flex-wrap gap-1">
                        {controller.sdCard && <span>✓ SD</span>}
                        {controller.ethernet && <span>✓ Ethernet</span>}
                        {controller.barometer && <span>✓ Baro</span>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
