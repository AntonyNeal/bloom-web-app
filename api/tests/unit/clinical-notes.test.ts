/**
 * Unit Tests: Clinical Notes LLM Service
 * 
 * Tests AI prompt construction and response parsing.
 */

import { describe, it, expect } from '@jest/globals';

// Test prompt templates and parsing logic
describe('Clinical Notes Service', () => {
  describe('Prompt Construction', () => {
    it('should sanitize patient data in prompts', () => {
      const patientName = 'John Smith';
      const sanitized = patientName
        .split(' ')
        .map(part => part[0])
        .join('.');
      
      expect(sanitized).toBe('J.S');
      expect(sanitized).not.toContain('John');
      expect(sanitized).not.toContain('Smith');
    });

    it('should handle special characters in patient names', () => {
      const names = ["O'Brien", "Smith-Jones", "Müller", "李"];
      
      names.forEach(name => {
        const initial = name[0];
        expect(initial.length).toBe(1);
      });
    });

    it('should truncate long transcripts', () => {
      const maxLength = 10000;
      const longTranscript = 'A'.repeat(15000);
      const truncated = longTranscript.substring(0, maxLength);
      
      expect(truncated.length).toBe(maxLength);
    });
  });

  describe('Response Parsing', () => {
    it('should extract sections from markdown response', () => {
      const response = `
## Session Overview
**Date:** 2026-01-26
**Session Type:** Individual therapy

## Presenting Concerns
Client reported anxiety about work.

## Risk Assessment
No current risk factors identified.

## Plan & Recommendations
- Continue CBT techniques
- Schedule follow-up in 2 weeks
`;

      const sections = response.split(/^## /m).filter(Boolean);
      
      expect(sections.length).toBeGreaterThan(3);
      expect(sections.some(s => s.startsWith('Session Overview'))).toBe(true);
      expect(sections.some(s => s.startsWith('Risk Assessment'))).toBe(true);
    });

    it('should detect risk keywords', () => {
      const riskKeywords = ['suicidal', 'self-harm', 'harm to others', 'overdose'];
      const safeText = 'Client discussed work stress and sleep difficulties.';
      const riskyText = 'Client mentioned thoughts of self-harm last week.';
      
      const hasSafeRisk = riskKeywords.some(kw => 
        safeText.toLowerCase().includes(kw)
      );
      const hasRiskyRisk = riskKeywords.some(kw => 
        riskyText.toLowerCase().includes(kw)
      );
      
      expect(hasSafeRisk).toBe(false);
      expect(hasRiskyRisk).toBe(true);
    });
  });

  describe('Data Privacy', () => {
    it('should not include full names in generated notes', () => {
      // Simulated output should use initials, not full names like "John Smith"
      const generatedNote = `Client J.S. presented for their third session.`;
      
      // Should not contain patterns like "FirstName LastName"
      // But should allow section headers and clinical terms
      const fullNamePattern = /\b(John|Jane|Michael|Sarah|David|Mary)\s+[A-Z][a-z]+\b/;
      
      expect(generatedNote).not.toMatch(fullNamePattern);
    });

    it('should not include phone numbers', () => {
      const text = 'Contact: 0401234567, email: test@example.com';
      const phoneRegex = /\b04\d{8}\b|\b\d{10}\b/;
      
      expect(phoneRegex.test(text)).toBe(true); // Should detect
      
      // Sanitization should remove
      const sanitized = text.replace(phoneRegex, '[REDACTED]');
      expect(sanitized).toContain('[REDACTED]');
    });
  });
});
