# @shared/ui

Reusable UI component library built with shadcn/ui and Tailwind CSS for the Life Psychology monorepo.

## Installation

This package is automatically linked in the workspace. To use in an app:

```bash
pnpm --filter your-app add @shared/ui
```

## Usage

```tsx
import { Button, Toast } from '@shared/ui';

function MyComponent() {
  return (
    <div>
      <Button variant="primary" size="lg">
        Click Me
      </Button>
    </div>
  );
}
```

## Available Components

### Button
Versatile button component with multiple variants.

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Toast
Notification system for user feedback.

```tsx
import { useToast } from '@shared/ui';

function MyComponent() {
  const { toast } = useToast();
  
  const showNotification = () => {
    toast({
      title: "Success",
      description: "Your action was completed.",
      variant: "default"
    });
  };
  
  return <button onClick={showNotification}>Show Toast</button>;
}
```

### Label
Accessible form labels.

```tsx
<Label htmlFor="email">Email Address</Label>
<input id="email" type="email" />
```

## Styling

All components use Tailwind CSS and the `cn` utility from `@shared/utils` for class merging.

```tsx
import { cn } from '@shared/utils';

<Button className={cn("custom-class", someCondition && "conditional-class")}>
  Button
</Button>
```

## Adding New Components

1. Create component in `src/components/`:
```tsx
// src/components/MyComponent.tsx
import { cn } from '@shared/utils';

export interface MyComponentProps {
  children: React.ReactNode;
  className?: string;
}

export function MyComponent({ children, className }: MyComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  );
}
```

2. Export from `src/index.ts`:
```typescript
export { MyComponent } from './components/MyComponent';
export type { MyComponentProps } from './components/MyComponent';
```

3. Use in apps:
```tsx
import { MyComponent } from '@shared/ui';
```

## Dependencies

- `react` - React library
- `@radix-ui/*` - Headless UI primitives
- `lucide-react` - Icon library
- `class-variance-authority` - Variant styling
- `clsx` - Class name utility
- `tailwind-merge` - Tailwind class merging

## Development

```bash
# Type check
pnpm --filter @shared/ui type-check

# Use in development
# Components are imported directly from source (no build needed)
```

## Guidelines

- **Accessibility**: All components must be keyboard accessible
- **TypeScript**: Full type safety required
- **Responsive**: Mobile-first design approach
- **Customizable**: Support className prop for overrides
- **Documented**: Add JSDoc comments for props

---

**Version**: 1.0.0  
**Status**: Active Development
