/**
 * UI Components - Barrel Export
 * 
 * This file provides a single point of import for all UI primitives.
 * Based on shadcn/ui + Radix UI components.
 * 
 * @example
 * // Instead of:
 * import { Button } from '@/components/ui/button';
 * import { Card } from '@/components/ui/card';
 * 
 * // Use:
 * import { Button, Card, Badge, Input } from '@/components/ui';
 */

// Form Elements
export { Button } from './button';
export type { ButtonProps } from './button';
export { buttonVariants } from './button-variants';

export { Input } from './input';
export { Label } from './label';
export { Textarea } from './textarea';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

// Display
export { Badge } from './badge';
export { badgeVariants } from './badge-variants';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

// Feedback
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';
export { Toaster } from './toaster';
