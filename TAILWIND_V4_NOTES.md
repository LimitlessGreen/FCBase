# Tailwind CSS v4 Migration Notes

## ✅ Completed Changes

### 1. **Installation & Configuration**
- ✅ Upgraded from Tailwind v3.4.18 to v4.1.14
- ✅ Using `@tailwindcss/vite` plugin instead of `@astrojs/tailwind`
- ✅ Using `@import "tailwindcss"` instead of `@tailwind` directives
- ✅ Removed `darkMode` config (auto-detected in v4)
- ✅ Removed `plugins: []` array (not needed in v4)

### 2. **Utility Class Updates**
- ✅ `shadow-sm` → `shadow-xs`
- ✅ `shadow` → `shadow-sm`
- ✅ `rounded-md` → `rounded-sm`
- ✅ `outline-none` → `outline-hidden`
- ✅ Added explicit `border-border` to all border utilities

### 3. **CSS Structure**
- ✅ Using `@import "tailwindcss"` in globals.css
- ✅ CSS variables properly configured for light/dark themes
- ✅ Using `@layer base` for custom base styles

## 📋 Best Practices Applied

### Theme Variables
All theme values are available as CSS variables:
```css
/* Use CSS variables directly */
color: var(--color-primary);
background: var(--color-background);
border-radius: var(--radius);
```

### Border Colors
Border color is set globally via CSS variable:
```css
/* In globals.css */
* {
  border-color: hsl(var(--border));
}
```

No need to specify color on each border utility:
```html
<!-- ✅ Good - uses global border color -->
<div class="border">...</div>

<!-- ❌ Don't use (not a valid utility) -->
<div class="border border-border">...</div>
```

### Ring Utilities
Default ring is now 1px (was 3px in v3):
```html
<!-- v3 -->
<button class="ring ring-blue-500">...</button>

<!-- v4 -->
<button class="ring ring-blue-500">...</button> <!-- 1px ring -->
<button class="ring-3 ring-blue-500">...</button> <!-- 3px ring like v3 -->
```

### Outline Utilities
```html
<!-- v3 -->
<input class="focus:outline-none" />

<!-- v4 -->
<input class="focus:outline-hidden" /> <!-- Accessible, works in forced colors mode -->
```

### Shadow Scale
```html
<!-- v3 → v4 -->
shadow-sm → shadow-xs
shadow → shadow-sm
shadow-md → shadow-md (unchanged)
shadow-lg → shadow-lg (unchanged)
shadow-xl → shadow-xl (unchanged)
shadow-2xl → shadow-2xl (unchanged)
```

### Border Radius Scale
```html
<!-- v3 → v4 -->
rounded-sm → rounded-xs
rounded → rounded-sm
rounded-md → rounded-md (unchanged)
rounded-lg → rounded-lg (unchanged)
rounded-xl → rounded-xl (unchanged)
```

## ⚠️ Things to Avoid

### Don't Use CSS Preprocessors
Tailwind CSS v4 **should not** be used with Sass, Less, or Stylus.
Think of Tailwind itself as your preprocessor.

### Don't Use JavaScript Config for Theme
Use CSS variables and `@theme` directive instead:
```css
/* ✅ Preferred in v4 */
@theme {
  --color-brand: oklch(0.5 0.2 250);
  --font-display: "Inter", sans-serif;
}
```

### Don't Use theme() Function
Use CSS variables directly:
```css
/* ❌ v3 style */
background: theme(colors.red.500);

/* ✅ v4 style */
background: var(--color-red-500);
```

## 🎯 React Component Best Practices

### Using with React Components
All components use `client:load` directive in Astro for interactivity:
```astro
<Button client:load>Click me</Button>
<Card client:load>...</Card>
```

### Class Merging Utility
Always use the `cn()` utility for class merging:
```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-classes", className)} />
```

## 🔄 Migration Checklist for New Components

When creating new components:

- [ ] Use Tailwind v4 utility names (`shadow-xs`, `rounded-sm`, etc.)
- [ ] Specify explicit border colors (`border-border`)
- [ ] Use `outline-hidden` instead of `outline-none`
- [ ] Use CSS variables for theme values
- [ ] Import utilities from `@/lib/utils`
- [ ] Add `client:load` for interactive React components
- [ ] Test in both light and dark mode

## 📚 Resources

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind with Astro Guide](https://docs.astro.build/en/guides/styling/#tailwind)
- [Tailwind v4 Documentation](https://tailwindcss.com/docs)

## 🚀 Performance Benefits

### Vite Plugin Advantages
- Faster build times with native Vite integration
- Better HMR (Hot Module Replacement)
- Automatic CSS optimization
- Native handling of imports and vendor prefixing

### CSS Variable Benefits
- Smaller bundle size (no JS config)
- Runtime theme switching capability
- Better browser compatibility
- Easier debugging in DevTools

## 📝 Notes for Future Development

1. **Always check Tailwind v4 docs** for utility changes
2. **Use CSS variables** for dynamic values instead of JavaScript
3. **Explicit is better** - always specify colors for borders, rings, etc.
4. **Test accessibility** - especially with `outline-hidden` usage
5. **Keep components modular** - each component should work independently

---

**Last Updated:** October 13, 2025  
**Tailwind Version:** 4.1.14  
**Astro Version:** 5.14.4
