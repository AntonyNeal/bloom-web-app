/**
 * JOIN US PAGE RESTRUCTURE - Implementation Specification
 * 
 * This file documents the planned structure for the new Join Us page flow.
 * See implementation checklist at the end of this file.
 */

/**
 * NEW PAGE FLOW:
 * 
 * 1. Marketing Page (NEW)
 *    - Hero: "Room to Grow"
 *    - Value Props: 80%, Less Paperwork, Your Pace
 *    - Why Join: Grouped benefits
 *    - Founder Story: Dr. Zoe Semmler
 *    - CTA: "Apply to Join" button → triggers qualification check
 * 
 * 2. Qualification Check (EXISTING - unchanged)
 *    - Beautiful flower animation flow
 *    - 3 qualification pathways
 *    - Passes → Application Form
 * 
 * 3. Application Form (EXISTING - keep as is)
 *    - "Plant Your Story"  
 *    - Form with flower metaphors
 *    - Current implementation is perfect
 * 
 * IMPLEMENTATION APPROACH:
 * - Keep existing QualificationCheck component (perfect)
 * - Keep existing Application Form (perfect)  
 * - ADD new marketing sections BEFORE qualification check
 * - Use state to manage flow: viewing → qualifying → applying
 */

export const JOIN_US_PAGE_STATES = {
  VIEWING: 'viewing',      // Marketing content
  QUALIFYING: 'qualifying', // Qualification check
  APPLYING: 'applying',     // Application form
} as const;
