import * as React from "react";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
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
}

interface ControllerSearchProps {
  controllers: Controller[];
  basePath?: string;
}

export function ControllerSearch({ controllers, basePath = "" }: ControllerSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMCU, setSelectedMCU] = React.useState<string | null>(null);
  const [selectedMounting, setSelectedMounting] = React.useState<string | null>(null);
  const [selectedFirmware, setSelectedFirmware] = React.useState<string | null>(null);
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

  // Perform search and filtering
  React.useEffect(() => {
    let filtered = controllers;

    // Text search
    if (searchQuery.trim()) {
      const fuseResults = fuse.search(searchQuery);
      filtered = fuseResults.map(r => r.item);
    }

    // Apply filters
    if (selectedMCU) {
      filtered = filtered.filter(c => c.mcu === selectedMCU);
    }
    if (selectedMounting) {
      filtered = filtered.filter(c => c.mounting === selectedMounting);
    }
    if (selectedFirmware) {
      filtered = filtered.filter(c => c.firmware.includes(selectedFirmware));
    }

    setResults(filtered);
  }, [searchQuery, selectedMCU, selectedMounting, selectedFirmware, controllers, fuse]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMCU(null);
    setSelectedMounting(null);
    setSelectedFirmware(null);
  };

  const hasActiveFilters = searchQuery || selectedMCU || selectedMounting || selectedFirmware;

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

      {/* Filter Chips */}
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

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm rounded-full border border-border bg-background hover:bg-muted transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
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
        {(hasActiveFilters ? results : controllers).map((controller) => (
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
                  <p className="text-xs text-muted-foreground">
                    {controller.uarts} UART • {controller.can} CAN • {controller.pwm} PWM
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {controller.firmware.map((fw) => (
                      <Badge key={fw} className="text-xs bg-primary/10 text-primary border-primary/20">
                        {fw.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* No Results */}
      {hasActiveFilters && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No controllers found matching your criteria.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-primary hover:underline"
          >
            Clear filters and try again
          </button>
        </div>
      )}
    </div>
  );
}
