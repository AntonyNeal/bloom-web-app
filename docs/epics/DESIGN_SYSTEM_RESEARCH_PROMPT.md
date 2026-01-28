# Design System Research Prompt

> **Purpose**: Research prompt for Claude to develop two distinct design systems for Life Psychology Australia
> **Date**: January 28, 2026
> **Status**: Ready for research execution

---

## Research Constraints (READ FIRST)

### Current State
| Platform | Status | Research Mode |
|----------|--------|---------------|
| **BLOOM** | Active development, Miyazaki aesthetic implemented | Validate & refine existing direction |
| **NEXT-WEBSITE** | Greenfield, conceptual only | Explore & propose, open to alternatives |

### Priority Weighting
**60% Next-Website / 40% Bloom**

- **Next-Website**: Client conversion at scale is the revenue bottleneck. Deep-dive on conversion patterns.
- **Bloom**: Foundation exists, focus on community/retention patterns to deepen engagement.

### Creative Direction Constraints
| Platform | Direction | Flexibility |
|----------|-----------|-------------|
| **BLOOM** | Miyazaki/Ghibli botanical aesthetic | **FIRM** — Refine and deepen, do not challenge |
| **NEXT-WEBSITE** | "Glass, blue tile, stainless steel" | **OPEN** — Challenge if research suggests better conversion patterns for Australian mental health clients |

---

## Context for Research Agent

You are a senior UX/UI researcher and design system architect specializing in healthcare technology, conversion optimization, and behavioral psychology. You have been engaged by Life Psychology Australia to develop two distinct but cohesive design systems for their digital platforms.

### Company Background

**Life Psychology Australia** operates a network of psychologists and mental health practitioners across Australia. They are positioning themselves as a cutting-edge, institutional-grade telehealth psychology provider—not a startup, but a scaled healthcare institution that happens to leverage modern technology.

**Business Model**: Multi-clinician practice management platform
- Practitioners are independent but operate under the Life Psychology brand
- Clients book with specific practitioners but trust the institutional brand
- Scale: Targeting 50-200 practitioners nationally within 2 years

---

## The Two Design Systems

### 1. **BLOOM** — Practitioner/Clinician Platform

**Audience**: Psychologists, clinical psychologists, mental health practitioners

**Core Emotional Goals**:
- Create a sense of **belonging to an elite community**
- Foster **in-group preference** (practitioners should feel special being part of Bloom)
- Communicate **layers of intricacy and care** in every interaction
- Build a **culture of mutual support and professional growth**
- Make administrative work feel like **tending a garden**, not paperwork

**Current Design Direction** (Miyazaki/Studio Ghibli inspired):
- Botanical color palette (eucalyptus sage #6B8E7F, soft fern #8FA892, warm cream #FAF7F2)
- Organic, natural animations
- "Qualification flowers" that grow based on practitioner tier
- Tagline: "Care for People, Not Paperwork"

**Research Questions**:
1. How do exclusive professional communities (McKinsey alumni, medical societies, YPO) create in-group identity through design?
2. What visual patterns communicate "craftsmanship" and "layers of care" in digital interfaces?
3. How can micro-interactions reinforce feelings of professional accomplishment?
4. What color psychology works best for reducing cognitive load in clinical admin contexts?
5. How do Japanese design principles (Ma, Wabi-sabi, Omotenashi) translate to healthcare SaaS?
6. What onboarding patterns create strongest community attachment in professional networks?

---

### 2. **NEXT-WEBSITE** — Client-Facing Marketing & Booking Platform

**Audience**: Potential therapy clients, people experiencing mental health challenges, corporate HR (for EAP referrals)

**Core Emotional Goals**:
- Project **institutional trustworthiness** (this is a real healthcare organization)
- Communicate **cutting-edge capability** without feeling cold
- Feel **mature and established**, not startup-y
- Maximize **conversion to booking** while maintaining ethical healthcare positioning
- Support the **multi-clinician model** (clients trust the institution, then choose a practitioner)

**Desired Aesthetic Direction**:
- **Materials palette**: Glass, blue tile, stainless steel
- **Spatial feeling**: Modern hospital atrium, not sterile ward
- **Character elements**: Warmth within the institutional frame
- Think: Mayo Clinic meets Apple Store meets Scandinavian healthcare
- NOT: Generic therapy stock photos, wellness-influencer aesthetic, meditation app vibes

**Research Questions**:
1. What design patterns do high-converting healthcare booking platforms use (One Medical, Forward, Parsley Health)?
2. How do institutional healthcare brands (Mayo Clinic, Cleveland Clinic, Kaiser) create trust through digital design?
3. What is the conversion impact of "choosing your own practitioner" vs "matched by algorithm" UX patterns?
4. How should practitioner profiles be designed to maximize booking while maintaining clinical professionalism?
5. What hero section patterns convert best for mental health services specifically?
6. How do Australian healthcare regulations (AHPRA, Psychology Board) constrain marketing design?
7. What accessibility patterns are mandatory for healthcare sites under Australian disability law?
8. How should pricing/Medicare rebate information be presented to maximize transparency without friction?

---

## Multi-Clinician UX Considerations

The platform must elegantly handle a network of independent practitioners:

**For Clients (Next-Website)**:
- How do clients choose between 50+ practitioners without decision paralysis?
- Should we lead with institution trust, then practitioner selection? Or vice versa?
- How do we handle practitioner availability across time zones (national practice)?
- What filtering/matching UX reduces abandonment in practitioner selection?
- How do we balance "choose your therapist" autonomy with "we'll match you" convenience?

**For Practitioners (Bloom)**:
- How do practitioners maintain individual identity within institutional brand?
- What dashboard patterns work for practitioners managing their own client panel?
- How should peer comparison/benchmarking be shown (if at all)?
- What community features foster collaboration vs competition?

---

## Specific Deliverables Requested

### For BLOOM (Practitioner Platform):
1. **Color system refinement** — Validate/extend current botanical palette for accessibility and emotional resonance
2. **Component personality guidelines** — How should buttons, cards, modals feel?
3. **Animation philosophy** — Principles for organic, nature-inspired micro-interactions
4. **Community design patterns** — How to create in-group identity through UI
5. **Tier/achievement visualization** — How to show practitioner growth without gamification cringe

### For NEXT-WEBSITE (Client Platform):
1. **Material-inspired color system** — Glass, blue tile, stainless steel translated to digital
2. **Trust signals inventory** — What visual elements build institutional healthcare trust?
3. **Conversion-optimized page templates** — Hero, practitioner directory, booking flow
4. **Practitioner card design** — How to present 50+ clinicians without overwhelm
5. **Mobile-first booking flow** — Frictionless path to booked appointment
6. **Accessibility compliance checklist** — WCAG 2.1 AA minimum for healthcare

---

## Research Methodology

Please conduct research across these domains:

1. **Competitive Analysis**
   - Australian telehealth providers (Lysn, Headspace, AccessEAP)
   - US institutional telehealth (One Medical, Forward, Talkspace, BetterHelp)
   - Premium healthcare institutions (Mayo Clinic, Cleveland Clinic, Epworth)

2. **Conversion Research**
   - Healthcare booking funnel benchmarks
   - Mental health-specific conversion patterns
   - Multi-provider selection UX case studies

3. **Design System Precedents**
   - Atlassian Design System (professional tools)
   - IBM Carbon (enterprise trust)
   - Material Design 3 (modern, accessible)
   - Linear (developer community feel)

4. **Psychology & Behavioral Economics**
   - Trust formation in healthcare digital contexts
   - Decision architecture for provider selection
   - In-group identity formation through design
   - Commitment devices in professional communities

5. **Australian Healthcare Context**
   - AHPRA advertising guidelines
   - Medicare claiming UX patterns
   - Telehealth-specific requirements
   - Privacy (APP guidelines) impact on design

---

## Output Format

Structure your research findings as:

```markdown
## 1. Executive Summary
[Key findings and recommendations]

## 2. BLOOM Design System
### 2.1 Color System
### 2.2 Typography
### 2.3 Component Library Principles
### 2.4 Animation & Motion
### 2.5 Community/Identity Patterns

## 3. NEXT-WEBSITE Design System
### 3.1 Color System
### 3.2 Typography
### 3.3 Trust Signal Components
### 3.4 Conversion Patterns
### 3.5 Practitioner Directory UX

## 4. Shared Principles
[What connects both systems as one brand]

## 5. Implementation Priorities
[What to build first for maximum impact]

## 6. References & Inspiration
[Links, screenshots, case studies]
```

---

## Constraints & Considerations

- **Budget**: Scale-appropriate (not enterprise unlimited, not bootstrap)
- **Timeline**: MVP in 3 months, full system in 6 months
- **Tech Stack**: React, TailwindCSS, Framer Motion, Shadcn/ui
- **Accessibility**: WCAG 2.1 AA minimum (healthcare requirement)
- **Performance**: Core Web Vitals compliance for SEO
- **Regulatory**: AHPRA compliant, Privacy Act compliant

---

## Final Note

The ultimate measure of success:
- **BLOOM**: Practitioners feel proud to be part of something special
- **NEXT-WEBSITE**: Clients trust us enough to book their first session

Both systems must feel like they come from the same organization while serving radically different emotional needs. The practitioner is joining an exclusive craft guild; the client is entering a modern healthcare institution.

---

*Prompt version: 1.0 | Created: January 28, 2026*
