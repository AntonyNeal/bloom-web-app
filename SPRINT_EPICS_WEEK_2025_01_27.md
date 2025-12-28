# Sprint Epics - Week of January 27, 2025

## Sprint Goal
Elevate LPA website performance and reliability to production-grade standards while establishing critical business communication infrastructure.

---

## Epic 1: LPA Website Performance & Reliability Overhaul
**Priority:** 🔴 Critical  
**Effort:** Large (may require architectural changes)  
**Owner:** Development Team

### Objective
Achieve the highest level of performant response and bug-free customer interface. If that means large architectural changes, so be it.

### User Stories

#### 1.1 Performance Audit & Baseline
- [ ] Run comprehensive Lighthouse audit on all critical user paths
- [ ] Document current Core Web Vitals (LCP, CLS, INP, FCP, TTFB)
- [ ] Identify top 5 performance bottlenecks with root cause analysis
- [ ] Create performance budget targets (LCP < 2.5s, CLS < 0.1, INP < 200ms)

#### 1.2 Critical Path Optimization
- [ ] Analyze and optimize booking flow performance (form → payment → confirmation)
- [ ] Review and optimize Azure Function cold start times
- [ ] Implement proper code splitting for route-based chunks
- [ ] Audit and reduce JavaScript bundle sizes

#### 1.3 Architecture Review
- [ ] Evaluate current SPA architecture vs SSG/SSR alternatives
- [ ] Assess CDN configuration and edge caching strategy
- [ ] Review API response times and database query efficiency
- [ ] Document architecture decision records (ADRs) for any major changes

#### 1.4 Bug Sweep
- [ ] Test all user flows on iOS Safari, Chrome, Firefox, Edge
- [ ] Verify mobile responsiveness across device sizes
- [ ] Test booking flow end-to-end with real payment
- [ ] Validate error handling and user feedback for edge cases

### Acceptance Criteria
- Lighthouse Performance score ≥ 90 on mobile
- Zero critical bugs in production
- All Core Web Vitals in "Good" range
- Booking conversion funnel has 0% technical drop-off

---

## Epic 2: A/B Testing Validation
**Priority:** 🟡 High  
**Effort:** Small  
**Owner:** Marketing/Development Team

### Objective
Confirm A/B testing infrastructure works correctly with real ad traffic.

### User Stories

#### 2.1 Test Validation
- [ ] Allow Google Ads to run for minimum 48-72 hours
- [ ] Verify variant assignment is working (check Application Insights)
- [ ] Confirm conversion tracking fires correctly for both variants
- [ ] Validate data is flowing to analytics dashboard

#### 2.2 Analysis
- [ ] Review sample size and statistical significance
- [ ] Document any issues with test configuration
- [ ] Prepare preliminary results report

### Acceptance Criteria
- Both A and B variants receiving traffic
- Conversion events tracked accurately
- Statistical significance calculator working

---

## Epic 3: Clinician Booking Notifications (Comms Service)
**Priority:** 🟡 High  
**Effort:** Medium  
**Owner:** Development Team

### Objective
Build communication service to text clinicians when they receive new bookings.

### User Stories

#### 3.1 SMS Infrastructure Setup
- [ ] Research and select SMS provider (Twilio, MessageBird, or Azure Communication Services)
- [ ] Set up provider account and obtain API credentials
- [ ] Configure Azure Key Vault for secure credential storage
- [ ] Create SMS sending Azure Function

#### 3.2 Clinician Notification Logic
- [ ] Design notification message template
- [ ] Implement trigger on successful booking creation
- [ ] Add clinician phone number to practitioner data model
- [ ] Handle SMS delivery failures with retry logic

#### 3.3 Admin Configuration
- [ ] Build admin UI for managing clinician contact preferences
- [ ] Allow clinicians to opt-in/opt-out of SMS notifications
- [ ] Support notification scheduling (respect quiet hours)

### Acceptance Criteria
- Clinicians receive SMS within 30 seconds of booking
- SMS includes patient name, appointment date/time, service type
- Delivery confirmation logged in Application Insights
- Opt-out mechanism available

---

## Epic 4: Bloom Join Us Interface Redesign
**Priority:** 🟡 High  
**Effort:** Medium  
**Owner:** Design/Development Team

### Objective
Elevate and rewrite the Bloom Join Us interface to better attract and convert quality practitioners.

### User Stories

#### 4.1 Design Phase
- [ ] Audit current Join Us page analytics (bounce rate, time on page, conversion)
- [ ] Research competitor practitioner recruitment pages
- [ ] Create wireframes for improved information architecture
- [ ] Design high-fidelity mockups (mobile-first)

#### 4.2 Content Strategy
- [ ] Refine value proposition messaging (client ownership, flexibility, support)
- [ ] Gather testimonials from existing Bloom practitioners
- [ ] Create compelling FAQ section addressing common concerns
- [ ] Develop clear call-to-action hierarchy

#### 4.3 Implementation
- [ ] Build new component structure with proper accessibility
- [ ] Implement responsive design with smooth animations
- [ ] Add analytics tracking for all CTAs
- [ ] A/B test new design against current version

### Acceptance Criteria
- Mobile-first responsive design
- WCAG 2.1 AA compliant
- Page load time < 2 seconds
- Clear path from interest → application

---

## Epic 5: Privacy Policy Compliance Audit
**Priority:** 🟠 Medium  
**Effort:** Medium  
**Owner:** Legal/Development Team

### Objective
Validate privacy policy and ensure the application actually lives up to all stated commitments.

### User Stories

#### 5.1 Policy Review
- [ ] Review current privacy policy document
- [ ] Map each policy statement to actual system behavior
- [ ] Identify gaps between policy claims and implementation

#### 5.2 Data Handling Audit
- [ ] Audit all data collection points (forms, cookies, analytics)
- [ ] Document data retention policies and verify implementation
- [ ] Review third-party data sharing (Stripe, Analytics, etc.)
- [ ] Verify data deletion mechanisms work correctly

#### 5.3 Compliance Implementation
- [ ] Fix any gaps between policy and implementation
- [ ] Update privacy policy if needed to reflect reality
- [ ] Implement cookie consent banner if missing
- [ ] Add data export/deletion request mechanism

### Acceptance Criteria
- 100% alignment between policy and implementation
- Data deletion request process documented and tested
- Cookie consent mechanism implemented
- Third-party data sharing fully disclosed

---

## Epic 6: Patient Verification Pre-Booking
**Priority:** 🟠 Medium  
**Effort:** Medium  
**Owner:** Development Team

### Objective
Implement patient verification before allowing booking to reduce no-shows and fraud.

### User Stories

#### 6.1 Verification Strategy
- [ ] Define verification requirements (email, phone, identity)
- [ ] Research verification service providers
- [ ] Design verification flow UX (minimal friction)

#### 6.2 Email Verification
- [ ] Implement email verification on booking form
- [ ] Send verification link/code via Azure Communication Services
- [ ] Handle verification expiration and resend

#### 6.3 Phone Verification (Optional)
- [ ] Implement SMS verification code
- [ ] Rate limit verification attempts
- [ ] Store verification status for returning patients

### Acceptance Criteria
- Patients must verify email before completing booking
- Verification process adds < 30 seconds to booking flow
- Fraudulent/spam bookings reduced by >50%

---

## Epic 7: Mental Healthcare Plan Automation
**Priority:** 🟠 Medium  
**Effort:** Large  
**Owner:** Development Team

### Objective
Make mental healthcare plan processing as automatic as possible to reduce admin overhead.

### User Stories

#### 7.1 Document Processing Research
- [ ] Research Medicare/healthcare plan document formats
- [ ] Evaluate OCR/document parsing options (Azure Form Recognizer)
- [ ] Define data extraction requirements (patient info, sessions, validity)

#### 7.2 Upload & Processing Flow
- [ ] Design patient upload interface for healthcare plan documents
- [ ] Implement secure document storage (Azure Blob with encryption)
- [ ] Build document parsing pipeline

#### 7.3 Automation Rules
- [ ] Auto-populate patient session entitlements from parsed data
- [ ] Validate plan dates and remaining sessions
- [ ] Alert clinicians when plan is expiring/exhausted
- [ ] Integration with billing system

### Acceptance Criteria
- 80%+ of healthcare plans auto-processed without manual intervention
- Processing time < 5 minutes from upload
- Validation errors clearly communicated to user
- Audit trail for all processed documents

---

## Sprint Metrics & Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lighthouse Performance (Mobile) | ≥ 90 | Automated CI check |
| Critical Production Bugs | 0 | GitHub Issues |
| A/B Test Data Flowing | Yes | Application Insights |
| Clinician SMS Delivery Rate | > 95% | SMS Provider Dashboard |
| New Epics Completed | ≥ 3 | Sprint Review |

---

## Dependencies & Risks

### Dependencies
- SMS provider account approval (Epic 3)
- Design resources for Join Us redesign (Epic 4)
- Legal review for privacy audit (Epic 5)
- Azure Form Recognizer setup (Epic 7)

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Architectural changes delay other work | High | Timebox discovery to 2 days |
| SMS provider integration issues | Medium | Have backup provider identified |
| Privacy audit reveals major gaps | High | Prioritize critical fixes only |

---

## Notes

- **Focus on Epic 1 first** - A performant, bug-free site is the foundation for everything else
- Epic 2 is passive monitoring - let the ads run and observe
- Epics 3 & 4 can be worked in parallel once Epic 1 is stable
- Epics 5, 6, 7 are stretch goals if time permits

---

*Last Updated: January 26, 2025*  
*Sprint Duration: January 27 - February 2, 2025*
