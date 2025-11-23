/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
/**
 * A/B Testing Implementation Examples
 *
 * Copy these patterns into your components to start tracking A/B tests
 * NOTE: This is example/documentation code and is not used in production.
 */

// ============================================
// Example 1: Simple Button Variant Test
// ============================================

import { useEffect, useState } from 'react';
import { abTestTracker } from '@/services/abTestTracker';

export function ButtonVariantTest() {
  const [variant, setVariant] = useState<'control' | 'variant_a' | null>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Get user ID (from auth context or props)
    const userEmail = 'user@example.com'; // Replace with actual user

    // Randomly assign variant (50/50 split)
    const assignedVariant = Math.random() < 0.5 ? 'control' : 'variant_a';
    setVariant(assignedVariant);
    setUserId(userEmail);

    // Track the allocation
    abTestTracker.trackAllocation('homepage-header-test', assignedVariant, userEmail);
  }, []);

  const handleClick = async () => {
    if (variant && userId) {
      // Track conversion
      await abTestTracker.trackConversion('homepage-header-test', variant, userId);

      // Perform the action
      console.log('Button clicked!');
    }
  };

  if (!variant) return <div>Loading...</div>;

  return (
    <>
      {variant === 'control' && (
        <button onClick={handleClick} className="bg-blue-600 text-white px-6 py-2 rounded">
          Click Me (Control)
        </button>
      )}

      {variant === 'variant_a' && (
        <button
          onClick={handleClick}
          className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-bold"
        >
          🎯 Click Me Now! (Variant A)
        </button>
      )}
    </>
  );
}

// ============================================
// Example 2: CTA Text Variant Test
// ============================================

export function CTATextTest() {
  const [variant, setVariant] = useState<'control' | 'variant_a' | 'variant_b' | null>(null);

  useEffect(() => {
    const userEmail = 'user@example.com';
    const variants = ['control', 'variant_a', 'variant_b'];
    const assignedVariant = variants[Math.floor(Math.random() * 3)] as any;

    setVariant(assignedVariant);
    abTestTracker.trackAllocation('hero-cta-test', assignedVariant, userEmail);
  }, []);

  const getCTAText = () => {
    switch (variant) {
      case 'control':
        return 'Learn More';
      case 'variant_a':
        return 'Start Free Trial';
      case 'variant_b':
        return 'Get Started Today - 14 Days Free';
      default:
        return 'Loading...';
    }
  };

  const getCTAHandler = async () => {
    if (variant) {
      await abTestTracker.trackConversion('hero-cta-test', variant, 'user@example.com');
    }
  };

  return (
    <button
      onClick={getCTAHandler}
      className="bg-sage-600 hover:bg-sage-700 text-white px-8 py-3 rounded-lg font-semibold transition"
    >
      {getCTAText()}
    </button>
  );
}

// ============================================
// Example 3: Form Fields Variant Test
// ============================================

export function FormFieldsTest() {
  const [variant, setVariant] = useState<'control' | 'minimal' | null>(null);

  useEffect(() => {
    const assignedVariant = Math.random() < 0.5 ? 'control' : 'minimal';
    setVariant(assignedVariant);
    abTestTracker.trackAllocation('form-fields-test', assignedVariant, 'user@example.com');
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (variant) {
      await abTestTracker.trackConversion('form-fields-test', variant, 'user@example.com');
      console.log('Form submitted');
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <input type="email" placeholder="Email" required className="w-full p-2 border" />

      {variant === 'control' && (
        <>
          <input type="text" placeholder="Full Name" required className="w-full p-2 border" />
          <input type="phone" placeholder="Phone Number" className="w-full p-2 border" />
          <input type="text" placeholder="Company" className="w-full p-2 border" />
        </>
      )}

      {variant === 'minimal' && <>{/* Minimal form - only email */}</>}

      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        Submit {variant === 'minimal' ? '(Quick)' : '(Full)'}
      </button>
    </form>
  );
}

// ============================================
// Example 4: Getting Test Results in Dashboard
// ============================================

export function TestResultsDisplay() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const testResults = await abTestTracker.getTestResults('homepage-header-test');
        setResults(testResults);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    // Refresh every 30 seconds
    const interval = setInterval(fetchResults, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading results...</div>;
  if (!results) return <div>No data yet</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Test Results</h3>

      {results.variants?.map((variant: any) => (
        <div key={variant.variant} className="border p-4 rounded">
          <h4 className="font-semibold">{variant.variant}</h4>
          <p>Allocations: {variant.allocations}</p>
          <p>Conversions: {variant.conversions}</p>
          <p>Conversion Rate: {(variant.conversionRate * 100).toFixed(2)}%</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Example 5: Multi-Variant with Custom Logic
// ============================================

interface Variant {
  id: string;
  color: string;
  text: string;
  size: 'small' | 'medium' | 'large';
}

export function ComplexVariantTest() {
  const [variant, setVariant] = useState<Variant | null>(null);

  const variants: Variant[] = [
    { id: 'control', color: 'bg-blue-600', text: 'Click Here', size: 'medium' },
    { id: 'larger', color: 'bg-blue-600', text: 'Click Here', size: 'large' },
    { id: 'green', color: 'bg-green-600', text: 'Click Here', size: 'medium' },
    { id: 'urgency', color: 'bg-red-600', text: 'Act Now!', size: 'large' },
  ];

  useEffect(() => {
    const selected = variants[Math.floor(Math.random() * variants.length)];
    setVariant(selected);
    abTestTracker.trackAllocation('button-test', selected.id, 'user@example.com');
  }, []);

  const handleClick = async () => {
    if (variant) {
      await abTestTracker.trackConversion('button-test', variant.id, 'user@example.com');
    }
  };

  if (!variant) return null;

  const sizeClass = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-6 py-2 text-base',
    large: 'px-8 py-3 text-lg font-bold',
  }[variant.size];

  return (
    <button
      onClick={handleClick}
      className={`${variant.color} text-white rounded transition hover:opacity-90 ${sizeClass}`}
    >
      {variant.text}
    </button>
  );
}

// ============================================
// Example 6: Conditional Page Layout Test
// ============================================

export function LayoutVariantTest() {
  const [layout, setLayout] = useState<'traditional' | 'modern' | null>(null);

  useEffect(() => {
    const variants = ['traditional', 'modern'];
    const selected = variants[Math.floor(Math.random() * 2)] as any;
    setLayout(selected);
    abTestTracker.trackAllocation('page-layout-test', selected, 'user@example.com');
  }, []);

  const trackPageViewed = () => {
    if (layout) {
      abTestTracker.trackConversion('page-layout-test', layout, 'user@example.com');
    }
  };

  if (layout === 'traditional') {
    return (
      <div className="flex" onLoad={trackPageViewed}>
        <aside className="w-64 bg-gray-100 p-6">
          <h3>Navigation</h3>
          {/* Navigation items */}
        </aside>
        <main className="flex-1 p-6">
          <h1>Main Content (Traditional Layout)</h1>
          {/* Content */}
        </main>
      </div>
    );
  }

  return (
    <div className="space-y-6" onLoad={trackPageViewed}>
      <header className="bg-sage-600 text-white p-6">
        <h1>Header (Modern Layout)</h1>
      </header>
      <main className="p-6">
        <h2>Main Content</h2>
        {/* Content */}
      </main>
    </div>
  );
}

// ============================================
// Example 7: Tracking Custom Events
// ============================================

export async function trackCustomEvent(
  testName: string,
  variant: string,
  eventType: 'view' | 'click' | 'submit' | 'share',
  userId?: string
) {
  // You can extend the tracker to support custom events
  if (eventType === 'view') {
    await abTestTracker.trackAllocation(testName, variant, userId);
  } else if (eventType === 'submit' || eventType === 'click' || eventType === 'share') {
    await abTestTracker.trackConversion(testName, variant, userId);
  }
}

// Usage: await trackCustomEvent('my-test', 'variant_a', 'share', 'user@example.com');
