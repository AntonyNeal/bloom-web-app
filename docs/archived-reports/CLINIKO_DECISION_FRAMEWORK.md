# Cliniko Custom Booking System - Decision Framework

**At Hour 50: The Critical Gate**

---

## What This Document Is For

You're at the end of Phase 1 POC. You've invested 50 hours and ~$0-50 in infrastructure costs.

**Now you decide**: Continue to Phase 2 (50 more hours + $200-300/month infrastructure), or pivot to a faster/cheaper alternative.

This document helps you make that decision based on hard data, not gut feel.

---

## Phase 1 Outcomes: Three Scenarios

### Scenario A: All 5 Criteria ✅ PASS

**What This Means**:

- Cliniko API works reliably
- Stripe payment processing is solid
- GCLID tracking infrastructure in place
- No blocking technical limitations found
- E2E flow: landing → payment → Cliniko appointment works

**Your Decision**: Proceed to Phase 2 or keep hunting for problems?

### Scenario B: 4 of 5 Criteria ✅ PASS, 1 ❌ FAILS

**What This Means**:

- Most of the system works
- ONE specific blocker found (e.g., Cliniko rate limits, Stripe compliance issue, database performance)

**Your Decision**: Fix the blocker (may add 5-15 hours) or pivot?

### Scenario C: 2-3 or Fewer Criteria ✅ PASS

**What This Means**:

- Multiple significant issues discovered
- System reliability uncertain
- Budget could be consumed debugging instead of building

**Your Decision**: Likely time to pivot to Alternative A

---

## Decision Matrix

Use this to evaluate your Phase 1 results:

```
┌─────────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Scenario            │ Continue Phase 2 │ Fix & Continue   │ Pivot to Alt A    │
├─────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ 5/5 Pass ✅         │ YES (95%)        │ N/A              │ Only if policy    │
│                     │ 2-3 min issues   │                  │ concerns          │
├─────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ 4/5 Pass ✅         │ Maybe (60%)      │ Try this first   │ If blocker is     │
│ 1 Fails ❌          │ If blocker minor │ (5-15 hrs)       │ payment/legal     │
├─────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ 3/5 Pass ✅         │ NO (10%)         │ Risky, maybe     │ STRONGLY YES      │
│ 2 Fail ❌          │ Too many issues  │ only if minor    │ 70% confidence    │
├─────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ <3/5 Pass ❌       │ NO (0%)          │ Don't bother     │ YES (95%)         │
│ >2 Fail ❌         │ Quit now         │ sunk cost trap   │ Only path forward │
└─────────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

## Decision Criteria: Should I Pivot to Alternative A?

### Ask Yourself These Questions

**1. Reliability**: "Can I trust this system in production?"

- [ ] Cliniko API was 99%+ available during testing
- [ ] Stripe handled edge cases gracefully (declined cards, errors)
- [ ] Database queries never timed out
- [ ] No data corruption observed

**If ≥3 boxes checked**: Reliability is good
**If <3 boxes**: Risky for production, consider pivot

**2. Timeline**: "Can I finish Phase 2 in 50 more hours?"

- [ ] Form UX polish: ~5 hours (styling, animations)
- [ ] Error handling enhancement: ~5 hours
- [ ] GA4 event tracking: ~10 hours
- [ ] Offline Conversion API: ~15 hours
- [ ] Production deployment & testing: ~15 hours

**Total**: ~50 hours is realistic IF no major issues found

**If you found major issues in Phase 1**: Add 10-20 hours for fixes, puts you at 60-70 hours total

**3. Budget**: "Can I sustain this long-term?"

- [ ] Monthly infrastructure cost acceptable: $70-110 (Cliniko + Azure)
- [ ] Maintenance burden acceptable: 5-15 hrs/month
- [ ] Willing to handle compliance/legal review: $1,500-4,000 (deferred, but necessary)

**4. Risk Tolerance**: "Am I comfortable with unproven tech?"

- [ ] Willing to invest $200-300 more without guarantee?
- [ ] Okay with potential compliance gaps until legal review?
- [ ] Comfortable supporting custom code vs vendor product?

---

## Phase 1 Exit Blockers

**STOP Phase 2 if ANY of these happened**:

1. **Cliniko API Authentication Failure**
   - Can't create valid auth tokens
   - Rate limits hit consistently
   - API returns 500+ errors repeatedly

2. **Stripe Payment Processing Broken**
   - Test payments fail reliably
   - Webhook integration impossible
   - PCI compliance risk identified

3. **Database Corruption**
   - GCLID or booking data lost/truncated
   - SQL errors on concurrent requests
   - Performance degradation with scale

4. **Major Security Issue**
   - Customer data transmitted unencrypted
   - API keys exposed
   - Stripe/Cliniko credentials hardcoded

5. **Regulatory/Compliance Blocker**
   - Discovered Privacy Act requirement that's blocking
   - AHPRA registration requirement prevents launch
   - Legal review reveals insurmountable issue

---

## The Alternative A Option

**If you decide to pivot: Hire specialist for Halaxy optimization**

### What You Get

- 70-85% Google Ads conversion tracking accuracy (vs current 40-60%)
- Works within existing Halaxy integration
- No new infrastructure needed
- Done in 2-4 weeks, not 8

### How It Works

1. Hire freelance Google Ads conversion tracking specialist
2. They optimize existing Halaxy booking flow for attribution
3. Implements offline conversion API with existing data
4. Sets up GA4 event tracking properly
5. Cost: $800-1,500 (vs $22,500+ for custom build)

### ROI Comparison

| Metric      | Phase 1+2 Path      | Alternative A           |
| ----------- | ------------------- | ----------------------- |
| Time        | 100 hours (8 weeks) | 20-40 hours (2-4 weeks) |
| Accuracy    | 85-95% (goal)       | 70-85% (realistic)      |
| Cost        | $200-300/mo ongoing | $800-1,500 one-time     |
| Risk        | Technical + Legal   | Minimal                 |
| Maintenance | 5-15 hrs/month      | <2 hrs/month            |

---

## Decision Template

**Fill this out at Hour 50 to make your call**:

---

### PHASE 1 RESULTS (Hour 50)

**Date**: ******\_\_\_\_******
**Tester**: ******\_\_\_\_******

**Success Criteria**:

- Cliniko Integration: [ ] ✅ PASS [ ] ❌ FAIL
- Payment Processing: [ ] ✅ PASS [ ] ❌ FAIL
- GCLID Attribution: [ ] ✅ PASS [ ] ❌ FAIL
- No Blocking Issues: [ ] ✅ PASS [ ] ❌ FAIL
- End-to-End Flow: [ ] ✅ PASS [ ] ❌ FAIL

**Score**: \_\_\_/5 PASSED

---

### DECISION FACTORS

**Reliability** (4-point scale):

- Cliniko API: \_\_\_/4
- Stripe payments: \_\_\_/4
- Database: \_\_\_/4
- **Average**: \_\_\_/4

**Timeline Reality Check**:

- Issues found that need fixing: [ ] None [ ] 1-2 minor [ ] 2-3 major [ ] >3 major
- Realistic Phase 2 duration: [ ] 50 hrs [ ] 50-60 hrs [ ] 60-70 hrs [ ] >70 hrs

**Budget Comfort**:

- Infrastructure cost acceptable: [ ] Yes [ ] Maybe [ ] No
- Willing to invest more on fixes: [ ] Yes [ ] Maybe [ ] No
- Compliance/legal review funds available: [ ] Yes [ ] Deferred [ ] No

**Risk Appetite**:

- Comfort level: [ ] High [ ] Medium [ ] Low

---

### FINAL DECISION

**I am choosing to** (select one):

- [ ] **CONTINUE TO PHASE 2**
  - Proceed with custom booking system build
  - Invest another 50 hours + $200-300/mo infrastructure
  - Plan legal review: Year 1

- [ ] **CONTINUE WITH FIXES**
  - Fix identified blockers: ************\_\_\_************
  - Estimated additional hours: **\_**
  - Then re-evaluate at Hour \_\_\_

- [ ] **PIVOT TO ALTERNATIVE A**
  - Stop custom development
  - Hire specialist for Halaxy optimization
  - Target: $800-1,500 budget, 70-85% accuracy, 4 weeks
  - Plan legal review: When budget allows

---

### RATIONALE

**Why this decision?**

Reliability: ******************************\_\_\_\_******************************

Timeline: ********************************\_\_********************************

Budget: ********************************\_\_\_\_********************************

Risk: **********************************\_\_**********************************

---

## If You Choose: CONTINUE TO PHASE 2

### What's Next (50 more hours)

**Week 5-6: Polish & Tracking Layer 1** (25 hrs)

- Brand styling to match Life Psychology website
- Error handling (user-friendly messages, no jargon)
- Enhanced Conversions for Leads (client-side GTM)
- Application Insights monitoring setup
- Mobile optimization & accessibility

**Week 7-8: Tracking Layers 2-3 & Production** (25 hrs)

- Offline Conversion API integration (server-side)
- GA4 event architecture (funnel tracking)
- Production deployment to Azure Static Web Apps
- Security hardening (HTTPS, API authentication)
- Documentation & runbook for maintenance
- Smoke testing in production

**Infrastructure Costs**: ~$70-110/month ongoing
**Legal Review**: Deferred but budgeted (Year 1)

---

## If You Choose: PIVOT TO ALTERNATIVE A

### Immediate Next Steps

1. **Find Specialist** (1 week)
   - Search: "Google Ads conversion tracking specialist Australia"
   - Platforms: Upwork, Toptal, Google Ads certified partner
   - Budget: $800-1,500

2. **Brief Specialist** (1 day)
   - Provide Halaxy API details
   - Share current booking flow
   - Goal: 70-85% attribution accuracy

3. **Specialist Builds** (2-3 weeks)
   - Optimizes existing Halaxy tracking
   - Implements offline conversion API
   - Sets up GA4 events
   - Tests with test conversions

4. **Deploy & Monitor** (1 week)
   - Goes live on production
   - Monitor attribution accuracy
   - Refine as needed

5. **Total Time**: 4 weeks from start to finish
6. **Total Cost**: $800-1,500 + existing infrastructure

---

## What Phase 1 Taught You

✅ **Things That Worked Well**:

- Document what went right
- Use these patterns in future projects

❌ **Things That Were Hard**:

- Document what was difficult
- Plan to avoid in Phase 2 or next project

⚠️ **Technical Debt Incurred**:

- What corners were cut?
- What needs addressing before production?

---

## Your 12-Month Roadmap (If Continuing)

```
Month 1: Phase 1 POC (DONE) + Phase 2 MVP (50 hrs, this month)
Month 2: Production deployment + legal review planning
Month 3: Real-time calendar sync research (your future goal!)
Month 4-6: Real-time sync implementation + multi-practitioner support
Month 7-12: Bloom platform foundation for 25-30 practices
```

---

**Remember**: This is a pragmatic decision, not a judgment.

✅ **Continuing** = You believe the risk/reward justifies investment  
✅ **Pivoting** = You recognize constraints and choose the smartest path

Either way, you've de-risked the decision with 50 hours of real validation.

**Let's build something great!** 🚀
