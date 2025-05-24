# Android Border Radius Fix

## Problem
React Native has platform-specific differences in how border radius is rendered, particularly on Android. Common issues include:

1. **Inconsistent rendering**: Border radius may not render consistently across different Android devices
2. **Clipping issues**: Child elements may not be properly clipped by parent border radius
3. **Gradient rendering**: LinearGradient components may not respect border radius properly on Android
4. **Shadow interference**: Android elevation can interfere with border radius rendering

## Solution
We've implemented a comprehensive platform-aware styling system in `src/utils/platformStyles.ts` that addresses these issues:

### Key Functions

#### `getEnhancedBorderRadius(radius, options)`
- Applies platform-specific border radius fixes
- On Android: Sets all corner radii explicitly and adds `overflow: 'hidden'` when needed
- On iOS: Uses standard `borderRadius` property

#### `getContainerStyle(borderRadius, shadow)`
- Complete styling solution for cards and containers
- Combines border radius and shadow handling
- Ensures proper rendering across platforms

#### `getGradientContainerStyle(borderRadius)`
- Specialized for LinearGradient components
- Fixes gradient clipping issues on Android
- Sets transparent background for proper rendering

### Updated Components

The following components have been updated to use platform-aware styling:

1. **Button** (`src/components/common/Button.tsx`)
   - Uses `getEnhancedBorderRadius()` for button container
   - Uses `getGradientContainerStyle()` for gradient backgrounds

2. **Card** (`src/components/common/Card.tsx`)
   - Uses `getContainerStyle()` for all variants
   - Properly handles shadows and border radius together

3. **BottomNavigation** (`src/components/common/BottomNavigation.tsx`)
   - Uses `getEnhancedBorderRadius()` for tab icon containers

4. **ScreenWrapper** (`src/components/common/ScreenWrapper.tsx`)
   - Resets border radius at screen level on Android
   - Forces style refresh when theme changes

### Usage Examples

```typescript
// Basic border radius
const style = {
  ...getEnhancedBorderRadius(12),
  backgroundColor: 'white',
};

// Container with shadow
const cardStyle = getContainerStyle(16, theme.shadows.md);

// Gradient container
const gradientStyle = getGradientContainerStyle(8);
```

### Best Practices

1. **Always use platform utilities** for components with border radius
2. **Test on Android devices** to ensure proper rendering
3. **Use `overflow: 'hidden'`** when child elements need clipping
4. **Combine border radius and shadows** using `getContainerStyle()`

### Migration Guide

To migrate existing components:

1. Import platform utilities:
   ```typescript
   import { getEnhancedBorderRadius, getContainerStyle } from '../../utils/platformStyles';
   ```

2. Replace direct `borderRadius` usage:
   ```typescript
   // Before
   const style = { borderRadius: 12 };
   
   // After
   const style = getEnhancedBorderRadius(12);
   ```

3. For containers with shadows:
   ```typescript
   // Before
   const style = {
     borderRadius: 12,
     ...theme.shadows.md,
   };
   
   // After
   const style = getContainerStyle(12, theme.shadows.md);
   ```

This system ensures consistent rounded corner rendering across all platforms while maintaining the app's design integrity. 