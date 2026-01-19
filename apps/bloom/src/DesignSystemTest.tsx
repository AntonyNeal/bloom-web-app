import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Design System Test Component
 * 
 * This component validates the Bloom design system implementation.
 * Check for:
 * - Sage green primary buttons with 8px rounded corners
 * - Warm terracotta secondary buttons
 * - Cards with 16px rounded corners and soft shadows
 * - Input fields with warm borders and sage green focus rings
 * - Smooth hover transitions (200ms)
 * - Poppins font for headings, Inter for body text
 */
export function DesignSystemTest() {
  return (
    <div className="min-h-screen p-8 bg-neutral-50">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-display text-h1 text-neutral-950">
            Bloom Design System
          </h1>
          <p className="text-body text-neutral-600">
            Validating the "fairy godmother" aesthetic - warm, nurturing, and professional
          </p>
        </div>

        {/* Color Palette */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Color Palette</CardTitle>
            <CardDescription>Sage green, terracotta, and warm neutrals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-body-sm font-medium mb-2 text-neutral-800">Primary (Sage Green)</p>
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded-lg bg-primary-900 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-primary-700 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-primary-500 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-primary-300 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-primary-100 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-primary-50 shadow-sm border border-neutral-200"></div>
              </div>
            </div>
            <div>
              <p className="text-body-sm font-medium mb-2 text-neutral-800">Secondary (Terracotta)</p>
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded-lg bg-secondary-700 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-secondary-500 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-secondary-300 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-secondary-100 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-secondary-50 shadow-sm border border-neutral-200"></div>
              </div>
            </div>
            <div>
              <p className="text-body-sm font-medium mb-2 text-neutral-800">Accent (Soft Gold)</p>
              <div className="flex gap-2">
                <div className="w-16 h-16 rounded-lg bg-accent-700 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-accent-500 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-accent-300 shadow-sm"></div>
                <div className="w-16 h-16 rounded-lg bg-accent-100 shadow-sm"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Button Components</CardTitle>
            <CardDescription>Check for rounded corners, warm colors, and smooth hover states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="outline">Outlined</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Delete</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="default" size="lg">Large Button</Button>
              <Button variant="default" size="default">Default Size</Button>
              <Button variant="default" size="sm">Small Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Card Examples */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-bloom">
            <CardHeader>
              <CardTitle className="font-display">Interactive Card</CardTitle>
              <CardDescription>Hover to see elevation change</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-neutral-600">
                Cards should have 16px rounded corners, soft warm shadows, and smooth hover transitions.
                The shadow should elevate from default to medium on hover.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="default" className="w-full">Take Action</Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md bg-primary-50 border-primary-300">
            <CardHeader>
              <CardTitle className="font-display text-primary-900">Highlighted Card</CardTitle>
              <CardDescription className="text-primary-700">With subtle sage background</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-primary-800">
                This demonstrates how cards can use color variants from the palette while maintaining
                the nurturing aesthetic.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form Components */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Form Elements</CardTitle>
            <CardDescription>Input fields with warm borders and sage focus rings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Jane Smith" />
                <p className="text-body-xs text-neutral-600">Helper text in warm gray</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="jane@example.com" />
                <p className="text-body-xs text-neutral-600">We'll never share your email</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input id="message" placeholder="Tell us about yourself..." />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="default">Submit Form</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>

        {/* Typography Scale */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Typography Scale</CardTitle>
            <CardDescription>Poppins for headings, Inter for body text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h1 className="font-display text-h1 text-neutral-950">Heading 1 - 32px Poppins</h1>
              <h2 className="font-display text-h2 text-neutral-950">Heading 2 - 28px Poppins</h2>
              <h3 className="font-display text-h3 text-neutral-950">Heading 3 - 24px Poppins</h3>
              <h4 className="font-display text-h4 text-neutral-950">Heading 4 - 20px Poppins</h4>
              <p className="text-body-lg text-neutral-800">Body Large - 18px Inter with comfortable line height</p>
              <p className="text-body text-neutral-800">Body Default - 16px Inter, the most common text size</p>
              <p className="text-body-sm text-neutral-600">Body Small - 14px Inter for secondary information</p>
              <p className="text-body-xs text-neutral-600">Body Tiny - 12px Inter for captions and helper text</p>
            </div>
          </CardContent>
        </Card>

        {/* Semantic Colors */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Semantic Colors</CardTitle>
            <CardDescription>Supportive, not alarming</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-success-100 border border-success-500">
              <p className="font-medium text-success-700">Success Message</p>
              <p className="text-body-sm text-success-700">Nurturing green - supportive confirmation</p>
            </div>
            <div className="p-4 rounded-lg bg-warning-100 border border-warning-500">
              <p className="font-medium text-warning-700">Warning Message</p>
              <p className="text-body-sm text-warning-700">Gentle amber - warm caution</p>
            </div>
            <div className="p-4 rounded-lg bg-error-100 border border-error-500">
              <p className="font-medium text-error-700">Error Message</p>
              <p className="text-body-sm text-error-700">Supportive rose - clear but not alarming</p>
            </div>
            <div className="p-4 rounded-lg bg-info-100 border border-info-500">
              <p className="font-medium text-info-700">Info Message</p>
              <p className="text-body-sm text-info-700">Calming sky blue - trustworthy information</p>
            </div>
          </CardContent>
        </Card>

        {/* Validation Checklist */}
        <Card className="shadow-md border-accent-500 border-2">
          <CardHeader>
            <CardTitle className="font-display text-accent-700">Design System Validation ✨</CardTitle>
            <CardDescription>Check that all these criteria are met</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-body-sm">
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Primary buttons are sage green (#4a7c5d)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Secondary buttons are warm terracotta (#c7826d)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Buttons have 8px rounded corners</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Cards have 16px rounded corners</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Cards show soft warm shadows (not harsh black)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Hover states transition smoothly (200ms)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Input focus rings are sage green (not default blue)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Headings use Poppins font</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Body text uses Inter font</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500">✓</span>
                <span>Overall feel is warm, nurturing, and professional</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
