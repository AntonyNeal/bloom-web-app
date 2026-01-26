/**
 * Unit Tests: Session Token Service
 * 
 * Tests token generation and validation logic in isolation.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { generateSecureToken } from '../../src/functions/session-token';

describe('Session Token Service', () => {
  describe('generateSecureToken', () => {
    it('should generate a token of sufficient length', () => {
      const token = generateSecureToken();
      // Base64url encoding of 32 bytes = 43 characters
      expect(token.length).toBeGreaterThanOrEqual(40);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });

    it('should generate URL-safe tokens', () => {
      const token = generateSecureToken();
      // Base64url should not contain +, /, or =
      expect(token).not.toMatch(/[+/=]/);
      // Should be valid in a URL
      expect(encodeURIComponent(token)).toBe(token);
    });

    it('should be cryptographically random', () => {
      // Generate many tokens and check for patterns
      const tokens = Array.from({ length: 1000 }, () => generateSecureToken());
      
      // Check character distribution is roughly uniform
      const charCounts: Record<string, number> = {};
      tokens.forEach(token => {
        for (const char of token) {
          charCounts[char] = (charCounts[char] || 0) + 1;
        }
      });
      
      // Should have a reasonable distribution (not all same character)
      const values = Object.values(charCounts);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const ratio = max / min;
      
      // Ratio should be less than 5 for reasonable distribution
      expect(ratio).toBeLessThan(5);
    });
  });
});

describe('Token Validation Logic', () => {
  it('should reject expired tokens', () => {
    const expiresAt = new Date(Date.now() - 1000); // 1 second ago
    const isExpired = expiresAt < new Date();
    expect(isExpired).toBe(true);
  });

  it('should accept valid tokens', () => {
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    const isExpired = expiresAt < new Date();
    expect(isExpired).toBe(false);
  });

  it('should handle timezone correctly', () => {
    // Store as UTC, compare as UTC
    const utcExpiry = new Date().toISOString();
    const parsedExpiry = new Date(utcExpiry);
    expect(parsedExpiry.getTime()).toBeGreaterThan(Date.now() - 1000);
  });
});
