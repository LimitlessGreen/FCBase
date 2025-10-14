# 🎴 Card Component Unification Plan

## Problem Statement

FCBase currently has **3-4 different card implementations** for displaying controllers:

1. **Main Page** (`index.astro`):
   - ✅ Square badges (`rounded-sm`)
   - ✅ Image with credit overlay
   - ✅ Title/Subtitle (CardTitle + CardDescription)
   - ✅ Ports text description
   - ✅ Badge list at bottom

2. **Controllers List** (`controllers/index.astro`):
   - ✅ Same image style
   - ✅ Title/Manufacturer
   - ❌ Different spec display (MCU/Mounting/I/O as rows)
   - ✅ Firmware badges

3. **Sensor Pages** (`sensors/[slug].astro`):
   - ❌ Completely different styling (`border-2`, different padding)
   - ❌ No image
   - ❌ Different badge display
   - ❌ Monospace port display

**Total duplication**: ~300-400 lines of card markup across 3+ pages.

---

## Solution: Component-Based Card System

### Architecture

```
BaseCard (foundation)
  ↓
  ├─ ControllerCard (flight controllers)
  ├─ TransmitterCard (radios)
  ├─ SensorCard (sensors)
  └─ MCUCard (microcontrollers)
```

**Key Principle**: Composition over duplication

---

## Components Created

### 1. `BaseCard.astro` (Foundation)

**Purpose**: Reusable foundation for all entity cards

**Features**:
- ✅ Optional image banner with credit overlay
- ✅ Title/subtitle header
- ✅ Slot-based content (specs, badges)
- ✅ Hover effects (shadow, translate, border)
- ✅ Configurable image aspect ratio
- ✅ Automatic link wrapper

**Props**:
```typescript
interface Props {
  href: string;
  title: string;
  subtitle?: string;
  image?: {
    src: string;
    alt?: string;
    credit?: string;
    sourceUrl?: string;
  };
  showImage?: boolean;
  imageAspect?: 'video' | 'square' | 'wide';
  class?: string;
  cardClass?: string;
  hoverBorder?: boolean;
}
```

**Usage**:
```astro
<BaseCard
  href="/controllers/pixhawk-6x"
  title="Pixhawk 6X"
  subtitle="Holybro"
  image={{ src: '...', credit: 'Holybro' }}
>
  <Fragment slot="specs">
    <!-- Custom specs -->
  </Fragment>
  <Fragment slot="badges">
    <!-- Custom badges -->
  </Fragment>
</BaseCard>
```

**Benefits**:
- 🎯 Single source of truth for card structure
- 🔧 Flexible slots for custom content
- 🎨 Consistent hover effects across all cards
- 📦 ~100 lines reusable across all entity types

---

### 2. `ControllerCard.astro` (Specialized)

**Purpose**: Controller-specific card with hardware specs

**Combines best features from all implementations**:
- ✅ Square badges from main page (via `StatusBadge`)
- ✅ Banner text from controllers page
- ✅ Checkmark display (✓ Yes / ✗ No for SD Card)
- ✅ Title/subtitle from main page (via `BaseCard`)
- ✅ Port summary from controllers page (10U • 2C • 16PWM)

**Props**:
```typescript
interface Props {
  // Required
  id: string;
  title: string;
  manufacturer: string;
  mcu: string;
  
  // Hardware specs
  mounting?: string;
  uarts?: number;
  can?: number;
  pwm?: number;
  sdCard?: boolean;
  
  // Firmware support
  firmwares?: string[];
  
  // Image
  image?: {
    src: string;
    credit?: string;
    sourceUrl?: string;
  };
  
  // Navigation
  basePath?: string;
  
  // Styling variants
  variant?: 'default' | 'compact' | 'detailed';
  showImage?: boolean;
  showSpecs?: boolean;
  class?: string;
}
```

**Variants**:

1. **Default** (for lists):
   ```astro
   <ControllerCard
     id="pixhawk-6x"
     title="Pixhawk 6X"
     manufacturer="Holybro"
     mcu="stmicro-stm32h753"
     mounting="30.5x30.5"
     uarts={10}
     can={2}
     pwm={16}
     sdCard={true}
     firmwares={['ardupilot', 'px4']}
     image={{ src: '...', credit: 'Holybro' }}
   />
   ```
   
   **Displays**:
   - Image banner
   - MCU: STM32H753
   - Mounting: 30×30mm
   - I/O: 10U • 2C • 16PWM
   - SD Card: ✓ Yes
   - Firmware badges (ArduPilot, PX4)

2. **Compact** (for sensor pages):
   ```astro
   <ControllerCard
     id="pixhawk-6x"
     title="Pixhawk 6X"
     manufacturer="Holybro"
     mcu="stmicro-stm32h753"
     mounting="30.5x30.5"
     uarts={10}
     can={2}
     pwm={16}
     firmwares={['ardupilot', 'px4']}
     variant="compact"
     showImage={false}
   />
   ```
   
   **Displays**:
   - No image
   - STM32H753 • 30×30mm
   - 10U • 2C • 16PWM
   - Firmware badges

3. **Detailed** (future):
   - All specs + additional features
   - Larger badges
   - More spacing

**Usage Examples**:

```astro
<!-- Main page -->
<ControllerCard
  id={controller.id}
  title={controller.title}
  manufacturer={controller.manufacturer}
  mcu={controller.mcu}
  mounting={controller.mounting}
  uarts={controller.io.uarts}
  can={controller.io.can}
  pwm={controller.io.pwm}
  sdCard={controller.io.sd_card}
  firmwares={controller.firmware_support.map(fw => fw.id)}
  image={controller.preview}
/>

<!-- Controllers list -->
<ControllerCard
  id={controller.id}
  title={controller.data.title}
  manufacturer={manufacturerName}
  mcu={controller.data.mcu}
  mounting={controller.data.mounting}
  uarts={controller.data.io.uarts}
  can={controller.data.io.can}
  pwm={controller.data.io.pwm}
  firmwares={controller.data.firmware_support.map(fw => fw.id)}
  image={controller.preview}
/>

<!-- Sensor pages (compact) -->
<ControllerCard
  id={controller.id}
  title={controller.data.title}
  manufacturer={brandName}
  mcu={controller.data.mcu}
  mounting={controller.data.mounting}
  uarts={controller.data.io.uarts}
  can={controller.data.io.can}
  pwm={controller.data.io.pwm}
  firmwares={controller.data.firmware_support.map(fw => fw.id)}
  variant="compact"
  showImage={false}
/>
```

---

## Implementation Plan

### Phase 1: Create Components ✅
- [x] Create `BaseCard.astro` (foundation)
- [x] Create `ControllerCard.astro` (specialized)
- [x] Add TypeScript props
- [x] Document usage

### Phase 2: Refactor Pages ⏳
- [ ] Refactor main page (`index.astro`)
- [ ] Refactor controllers list (`controllers/index.astro`)
- [ ] Refactor sensor pages (`sensors/[slug].astro`)
- [ ] Test build
- [ ] Visual regression testing

### Phase 3: Extend System ⏳
- [ ] Create `TransmitterCard.astro`
- [ ] Create `SensorCard.astro` (if needed)
- [ ] Create `MCUCard.astro` (if needed)

---

## Expected Impact

### Line Savings

| Page | Current Lines | Card Lines | Expected After | Savings |
|------|--------------|------------|----------------|---------|
| `index.astro` | ~60 lines card | ~10 lines | ~45 lines | -15 (-25%) |
| `controllers/index.astro` | ~80 lines card | ~12 lines | ~55 lines | -25 (-31%) |
| `sensors/[slug].astro` | ~25 lines card | ~8 lines | ~18 lines | -7 (-28%) |
| **Total** | **~165 lines** | **~30 lines** | **~118 lines** | **-47 (-28%)** |

**Per controller instance**: ~20 lines → ~3-5 lines (75% reduction)

### Code Quality

**Before**:
```astro
<!-- 80 lines of manual card markup -->
<a href={`/controllers/${controller.id}`} class="group">
  <Card client:load class="h-full transition-all hover:shadow-lg hover:-translate-y-1">
    <div class="relative aspect-video w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-muted via-background to-muted">
      {controller.preview?.src ? (
        <>
          <img src={controller.preview.src} alt={controller.data.title} loading="lazy"
            class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {/* ... 30 more lines ... */}
        </>
      ) : (
        <span class="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-medium text-muted-foreground">
          {controller.data.title}
        </span>
      )}
    </div>
    <CardHeader>
      <CardTitle class="group-hover:text-primary transition-colors">
        {controller.data.title}
      </CardTitle>
      <CardDescription>{manufacturerName}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">MCU</span>
          <span class="font-medium">
            {controller.data.mcu.toUpperCase().replace('STMICRO-', '')}
          </span>
        </div>
        {/* ... 40 more lines ... */}
      </div>
    </CardContent>
  </Card>
</a>
```

**After**:
```astro
<!-- 10 lines with ControllerCard -->
<ControllerCard
  id={controller.id}
  title={controller.data.title}
  manufacturer={manufacturerName}
  mcu={controller.data.mcu}
  mounting={controller.data.mounting}
  uarts={controller.data.io.uarts}
  can={controller.data.io.can}
  pwm={controller.data.io.pwm}
  firmwares={controller.data.firmware_support.map(fw => fw.id)}
  image={controller.preview}
/>
```

**Reduction**: 80 lines → 10 lines (87.5% reduction per card!)

---

## Benefits

### 1. Single Source of Truth 🎯
- Change card styling → edit 1 file (`BaseCard.astro`)
- Affects all pages automatically
- No more sync issues between pages

### 2. Consistency 🎨
- All controller cards look identical
- Same hover effects
- Same badge styling
- Same image treatment

### 3. Type Safety 🛡️
```typescript
// Props are TypeScript validated
<ControllerCard
  id="pixhawk-6x"
  title="Pixhawk 6X"
  manufacturer="Holybro"
  mcu="stm32h753"  // TypeScript knows this is string
  uarts={10}       // TypeScript knows this is number
  sdCard={true}    // TypeScript knows this is boolean
/>
```

### 4. Reusability 🔄
- `BaseCard` can be used for transmitters, sensors, MCUs
- Same structure, different content
- Composition pattern scales

### 5. Maintainability 🔧
**Adding new field**:
- Before: Edit 3+ files, 100+ lines
- After: Edit `ControllerCard.astro`, 10 lines

**Changing hover effect**:
- Before: Edit 3+ files, find all hover classes
- After: Edit `BaseCard.astro`, 1 line

### 6. Developer Experience 🚀
**Time to add card**:
- Before: 5-10 minutes (copy-paste, edit classes, fix structure)
- After: 30 seconds (props, auto-complete)

**Error rate**:
- Before: High (typos in classes, missing props, inconsistent structure)
- After: Low (TypeScript validation, can't break structure)

---

## Migration Strategy

### Step 1: Create Components ✅
- Create `BaseCard.astro`
- Create `ControllerCard.astro`
- Test build

### Step 2: Migrate Main Page
1. Import `ControllerCard`
2. Replace card loop with component
3. Test visual parity
4. Commit

### Step 3: Migrate Controllers List
1. Import `ControllerCard`
2. Replace card loop with component
3. Adjust props (different data structure)
4. Test visual parity
5. Commit

### Step 4: Migrate Sensor Pages
1. Import `ControllerCard`
2. Replace card loop with component
3. Use `variant="compact"` and `showImage={false}`
4. Test visual parity
5. Commit

### Step 5: Extend System
1. Create `TransmitterCard.astro` based on `BaseCard`
2. Migrate transmitter pages
3. Create other entity cards as needed

---

## Visual Comparison Checklist

After migration, verify:

- [ ] Image banners look identical
- [ ] Credit overlays positioned correctly
- [ ] Titles have proper hover color transition
- [ ] MCU display matches (uppercase, no vendor prefix)
- [ ] Mounting display matches (× symbol, mm suffix)
- [ ] I/O summary matches format (10U • 2C • 16PWM)
- [ ] SD Card checkmark displays correctly (✓/✗)
- [ ] Firmware badges are square (`rounded-sm`)
- [ ] Hover effects identical (shadow, translate)
- [ ] Spacing matches original
- [ ] Responsive behavior preserved

---

## Testing Plan

### Build Test
```bash
pnpm run build
# Expected: 117 pages, no errors
```

### Visual Test
1. Main page: Compare controller cards
2. Controllers list: Compare all cards
3. Sensor pages: Compare compact cards
4. Mobile: Test responsive layout
5. Hover: Test all hover effects

### Props Test
```astro
<!-- Test all prop combinations -->
<ControllerCard {...minimalProps} />
<ControllerCard {...fullProps} />
<ControllerCard {...compactProps} />
<ControllerCard {...noImageProps} />
```

---

## Future Extensions

### TransmitterCard
```astro
<TransmitterCard
  id="radiomaster-tx16s"
  title="TX16S"
  manufacturer="RadioMaster"
  formFactor="handheld"
  display="color"
  edgeTxVersion="2.10"
  supportStatus="supported"
  image={{ src: '...', credit: 'RadioMaster' }}
/>
```

### SensorCard
```astro
<SensorCard
  id="invensense-icm42688p"
  title="ICM-42688-P"
  manufacturer="TDK InvenSense"
  type="imu"
  axes={6}
  interface="spi"
  controllers={[...]}
/>
```

### MCUCard
```astro
<MCUCard
  id="stmicro-stm32h753"
  title="STM32H753"
  manufacturer="STMicroelectronics"
  architecture="arm-cortex-m7"
  clockMhz={480}
  flashKb={2048}
  ramKb={1024}
  controllers={[...]}
/>
```

---

## Success Criteria

- [x] Components created and documented
- [ ] All pages use `ControllerCard`
- [ ] Build successful (117 pages)
- [ ] Visual parity 100%
- [ ] No TypeScript errors
- [ ] Line count reduced by ~50 lines per page
- [ ] Developer feedback positive

---

## Conclusion

This card unification brings:

1. **Consistency**: All controllers look identical across pages
2. **Maintainability**: Change 1 file → update all pages
3. **Type Safety**: Props validated by TypeScript
4. **Reusability**: BaseCard pattern extends to other entities
5. **Developer Experience**: 87% less code per card

**Next Steps**:
1. ✅ Create components (DONE)
2. ⏳ Migrate pages
3. ⏳ Test build
4. ⏳ Extend to transmitters

---

**Report Generated**: October 14, 2025  
**Status**: Components created, ready for migration  
**Expected Impact**: -47 lines across 3 pages, 100% consistency  
