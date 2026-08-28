# Project UI Standards: Universal Dropdowns

## Mandatory Selection Standard
All dropdown menus, option pickers, and selection lists added to this application MUST use the unified `CustomSelect` component (`/src/components/CustomSelect.tsx`).

### Core Requirements:
1. **Glassmorphism Styling**: Must utilize the `backdrop-blur-3xl`, `bg-slate-900/90`, and `border-white/10` combination.
2. **Portal Architecture**: All dropdown overlays MUST be rendered via `ReactDOM.createPortal` to the `document.body` to ensure zero parent clipping and proper layering.
3. **Layering**: Overlays must strictly use `z-index: 999999`.
4. **Animation**: Entrance and exit must use the standard `motion` spring animation (Scale-in/out + Fade) defined in `CustomSelect`.
5. **Indicators**: Must include the Radio-style indicator design (Checked/Unchecked circles) for selection feedback.
6. **No Native Selects**: Use of the native `<select>` element is strictly forbidden for user-facing interface components.

## Implementation Pattern
```tsx
import { CustomSelect } from './CustomSelect';

// Usage example
<CustomSelect
  label="Setting Name"
  value={currentValue}
  onChange={(val) => handleUpdate(val)}
  options={[
    { label: 'Option A', value: 'a', icon: <IconA /> },
    { label: 'Option B', value: 'b', icon: <IconB /> },
  ]}
/>
```

# Project Android Standards: Permissions & Hardware

## Android Permissions Protocol
All Android-specific permissions must be explicitly declared in `AndroidManifest.xml` and requested at runtime using the `AndroidService` utility.

### Mandatory Declarations:
1. **Network**: `INTERNET`, `ACCESS_NETWORK_STATE`.
2. **Media/Storage**: `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` (maxSdk 32), `READ_MEDIA_AUDIO`.
3. **Notifications**: `POST_NOTIFICATIONS` (Android 13+).

## Device Specification Detection
The application must perform a hardware audit on startup via `AndroidService.getDeviceSpecs()`. This logs:
- **Manufacturer & Model**
- **Android SDK Version** (for API-specific features)
- **Screen Dimensions & Memory Usage** (for adaptive UI scaling)
