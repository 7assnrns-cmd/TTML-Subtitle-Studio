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
