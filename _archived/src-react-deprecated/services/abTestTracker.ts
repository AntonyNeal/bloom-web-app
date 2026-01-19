/**
 * A/B Testing Client Library
 * Tracks A/B test events to the backend for real data collection
 */

import { API_BASE_URL } from '../config/api';

interface ABTestEvent {
  testName: string;
  variant: string;
  sessionId: string;
  userId?: string;
  converted?: boolean;
}

class ABTestTracker {
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    const stored = localStorage.getItem('ab_test_session_id');
    if (stored) return stored;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ab_test_session_id', sessionId);
    return sessionId;
  }

  /**
   * Track a user being allocated to a variant
   */
  async trackAllocation(testName: string, variant: string, userId?: string) {
    return this.trackEvent({
      testName,
      variant,
      sessionId: this.sessionId,
      userId,
      converted: false,
    });
  }

  /**
   * Track a conversion event
   */
  async trackConversion(testName: string, variant: string, userId?: string) {
    return this.trackEvent({
      testName,
      variant,
      sessionId: this.sessionId,
      userId,
      converted: true,
    });
  }

  /**
   * Send event to backend
   */
  private async trackEvent(event: ABTestEvent): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ab-test/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        console.warn(`Failed to track A/B test event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error tracking A/B test event:', error);
    }
  }

  /**
   * Get real-time test results
   */
  async getTestResults(testName: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ab-test/track?testName=${encodeURIComponent(testName)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching test results for ${testName}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const abTestTracker = new ABTestTracker();

export default ABTestTracker;
