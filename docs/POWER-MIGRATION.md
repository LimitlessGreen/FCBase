# Power Input Migration

## Problem

Viele Controller haben unstrukturierte `voltage_in` Strings wie:
```yaml
power:
  voltage_in: "5.0-5.5V via USB-C or PowerBrick connector"
```

Diese sind technisch schwer auswertbar. Besser ist strukturierte `inputs`:
```yaml
power:
  inputs:
  - name: USB
    type: usb
    connector: USB-C
    voltage:
      min: 5.0
      max: 5.5
      unit: V
  - name: POWER1
    type: power_module
    connector: PowerBrick
    voltage:
      min: 4.9
      max: 5.5
      unit: V
```

## Scripts

### 1. Analyse: `migrate-power-inputs.ts`
Analysiert alle Controller und schlägt Migrationen vor:
```bash
npx tsx scripts/migrate-power-inputs.ts
```

Erstellt `power-migration-results.json` mit Details.

### 2. Auto-Migration: `apply-power-migration.ts`
Migriert einfache Fälle automatisch:

**Dry-Run** (empfohlen zuerst):
```bash
npx tsx scripts/apply-power-migration.ts --verbose
```

**Tatsächlich anwenden**:
```bash
npx tsx scripts/apply-power-migration.ts --apply
```

## Status

- **Total mit `voltage_in`:** 16
- **Auto-migrierbar:** 5 (einfache Patterns)
- **Manuelle Review:** 11 (komplex, mehrere Inputs)

## Manuelle Migration Needed

Die folgenden 11 Controller brauchen manuelle Migration, weil sie **mehrere Inputs** haben:

1. **holybro-pixhawk-6x/6c** - 2 Inputs (POWER + USB)
2. **holybro-pixhawk-5x** - 3 Inputs (POWER + USB + SERVO)
3. **holybro-pixhawk-4** - 2 Inputs (POWER1/POWER2 + USB) + Redundancy
4. **holybro-pixhawk-4-mini** - 2 Inputs (POWER + USB)
5. **holybro-durandal** - 3 Inputs (POWER + USB + SERVO)
6. **holybro-kakute-h7-v2** - 2 Inputs (BATTERY LiPo + USB) ✅ Auto-migriert
7. **mro-pixracer-pro** - 2 Inputs (USB-C + PowerBrick)
8. **cubepilot-cube-orange-plus** - 2 Inputs (POWER + USB)
9. **cubepilot-cube-black** - 2 Inputs (POWER + USB) + Redundancy
10. **cuav-nora** - 3 Inputs (POWER + USB + SERVO passthrough)
11. **aocoda-h743dual** - LiPo mit BEC outputs

## Migration Guide

### Beispiel: Pixhawk 6X

**Vorher:**
```yaml
power:
  voltage_in: "4.9-5.5V primary inputs, USB 4.75-5.25V"
```

**Nachher:**
```yaml
power:
  inputs:
  - name: POWER1
    type: power_module
    voltage:
      min: 4.9
      max: 5.5
      unit: V
  - name: USB
    type: usb
    voltage:
      min: 4.75
      max: 5.25
      unit: V
```

### Beispiel: Cube Black (mit Redundancy)

**Vorher:**
```yaml
power:
  voltage_in: "4.1-5.7V redundant power rails, USB 4.75-5.25V"
```

**Nachher:**
```yaml
power:
  redundant: true
  inputs:
  - name: POWER1
    type: power_module
    voltage:
      min: 4.1
      max: 5.7
      unit: V
  - name: POWER2
    type: power_module
    voltage:
      min: 4.1
      max: 5.7
      unit: V
  - name: USB
    type: usb
    voltage:
      min: 4.75
      max: 5.25
      unit: V
```

## Input Types

- `power_module` - Power Module (PM) connector
- `usb` - USB power
- `battery` - Direct battery connection (LiPo)
- `servo_rail` - Servo rail passthrough
- `regulator` - Onboard regulator
- `other` - Sonstiges

## Next Steps

1. ✅ Scripts erstellt
2. ⏳ Review der 5 auto-migrierbaren Controller
3. ⏳ Manuelle Migration der 11 komplexen Controller
4. ⏳ `voltage_in` Feld optional machen im Schema
5. ⏳ Frontend anpassen für strukturierte Anzeige
