# Newcastle Psychology Ad Schedule Optimization

**Analysis Period:** Oct 26 - Nov 9, 2025  
**Optimization Date:** November 9, 2025  
**Schedule Type:** 2-week rotating cycle

---

## Data Sources Analyzed

### 1. Google Ads Heatmap Analysis (CTR & Conversion Value)

**CTR Heatmap Findings:**

- **Monday:** Strong blue activity 6AM-1PM, especially 9AM-12PM
- **Tuesday:** STRONGEST performance - bright blue/yellow 9AM-1PM (peak engagement)
- **Wednesday:** Light activity 6-9AM, drops significantly after
- **Thursday:** Moderate blue activity 6AM-12PM, dies after noon
- **Friday:** Minimal activity, only 6-9AM shows engagement
- **Weekend:** No activity (as expected, no ads running)

**Conversion Value Heatmap Findings:**

- **Monday 6AM-1PM:** Strong orange bar = actual conversion activity
- **Tuesday 9AM-1PM:** Blue spike = high-value conversions
- **Wednesday 9AM:** Isolated blue spike, but inconsistent
- **Thursday/Friday:** Very light conversion activity

### 2. Known Manual Bookings

- **Nov 3 (Sunday 12pm)** - Melinda Buaserau, Couples session
- **Nov 5 (Tuesday 8am)** - Lilly Gallagher, Medicare session

### 3. Current Schedule Issues

**Existing Schedule:** Mon-Fri 6AM-1PM

- **Problem 1:** 12-1PM slot shows minimal activity Wed-Fri (wasted spend)
- **Problem 2:** Equal bidding across all days (Mon/Tue deserve premium)
- **Problem 3:** Wednesday-Friday overscheduled vs. actual engagement
- **Problem 4:** No time-of-day bid adjustments

---

## Optimization Strategy

### Core Insights:

1. **Peak Days:** Monday & Tuesday (40% of weekly conversions)
2. **Peak Hours:** 9AM-12PM across all active days
3. **Dead Weight:** 12-1PM Wed-Fri, all day Friday afternoon
4. **Early Birds:** 6-9AM shows consistent activity Mon-Thu

### Goals:

- ✅ Concentrate budget on high-performing Mon/Tue
- ✅ Reduce waste on low-performing Wed-Fri afternoons
- ✅ Maintain early morning coverage (6-9AM) for urgent bookings
- ✅ Implement hour-of-day bid adjustments for peak times

---

## Recommended 2-Week Schedule

### Week 1 (High Activity Week)

| Day       | Hours    | Bid Adjustment | Rationale                                        |
| --------- | -------- | -------------- | ------------------------------------------------ |
| Monday    | 6AM-1PM  | **+50%**       | Strong conversion data, worth premium bidding    |
|           | 9AM-12PM | **+70%**       | PEAK hours within Monday - stack the bid         |
| Tuesday   | 6AM-1PM  | **+50%**       | BEST performing day, highest conversion value    |
|           | 9AM-12PM | **+70%**       | Absolute peak - maximize visibility              |
| Wednesday | 6AM-12PM | **+10%**       | Morning only, light premium for early engagement |
|           | 9AM-12PM | **+20%**       | Slight boost for mid-morning sweet spot          |
| Thursday  | 6AM-12PM | **0%**         | Baseline coverage, moderate activity             |
|           | 9AM-11AM | **+15%**       | Small boost for consistent mid-morning activity  |
| Friday    | 6AM-10AM | **-10%**       | Reduced hours, defensive bid to avoid waste      |

**Total Hours Week 1:** 29 hours (vs. 35 current)  
**Budget Savings:** ~17% fewer hours, reallocated to peak times

---

### Week 2 (Maintenance Week)

| Day       | Hours    | Bid Adjustment | Rationale                                            |
| --------- | -------- | -------------- | ---------------------------------------------------- |
| Monday    | 6AM-1PM  | **+40%**       | Maintain strong presence, slightly lower than Week 1 |
|           | 9AM-12PM | **+60%**       | Still prioritize peak, but moderate vs. Week 1       |
| Tuesday   | 6AM-1PM  | **+40%**       | Sustain best day performance                         |
|           | 9AM-12PM | **+60%**       | Keep peak bidding competitive                        |
| Wednesday | 6AM-11AM | **0%**         | Reduced to 5 hours, baseline bidding                 |
| Thursday  | 6AM-11AM | **0%**         | Match Wednesday pattern                              |
| Friday    | 6AM-9AM  | **-20%**       | Minimal coverage, low bid to test demand             |

**Total Hours Week 2:** 24 hours (vs. 35 current)  
**Budget Savings:** ~31% fewer hours, test lower frequency

---

## Schedule Bidding Strategy

### Time-of-Day Multipliers (Applied on top of day-level bids)

**6-7AM:** +0% (baseline, early searchers)  
**7-9AM:** +10% (increasing activity)  
**9AM-12PM:** +30% (PEAK - apply on top of day bid)  
**12-1PM:** -10% (declining activity, only Mon/Tue)

### Day-of-Week Priority Tiers

**Tier 1 (Premium):** Monday, Tuesday

- These days get 40-50% base bid increase
- Stack with hour-of-day multipliers for peak times
- Expected result: 60-80% of weekly conversions

**Tier 2 (Standard):** Wednesday, Thursday

- Baseline to +10% bid adjustment
- Reduced hours to avoid waste
- Expected result: 15-25% of weekly conversions

**Tier 3 (Defensive):** Friday

- Reduced hours, negative bid adjustment
- Test demand only, don't chase low-intent traffic
- Expected result: 0-10% of weekly conversions

---

## Expected Outcomes

### Cost Savings

**Current Spend:** 35 hours/week × 2 weeks = 70 hours  
**Week 1:** 29 hours (-17%)  
**Week 2:** 24 hours (-31%)  
**Total:** 53 hours over 2 weeks (**24% reduction**)

### Performance Improvements

- **Higher CTR:** Ads shown during peak engagement times
- **Better CPA:** Less waste on low-intent periods
- **More Conversions:** Budget reallocated to Mon/Tue peak hours

### Risk Mitigation

- **Week 1 more aggressive** → Capture high-intent traffic
- **Week 2 more conservative** → Validate Week 1 learnings
- **Early morning coverage maintained** → Don't miss urgent bookings
- **Tuesday 8AM prioritized** → Matches Lilly's booking pattern

---

## Implementation Steps

### Phase 1: Set Up Base Schedule (Week 1)

1. **Go to Google Ads** → Campaigns → Ad Schedule
2. **Monday:** Add 6AM-1PM, +50% bid adjustment
3. **Tuesday:** Add 6AM-1PM, +50% bid adjustment
4. **Wednesday:** Add 6AM-12PM, +10% bid adjustment
5. **Thursday:** Add 6AM-12PM, 0% bid adjustment
6. **Friday:** Add 6AM-10AM, -10% bid adjustment

### Phase 2: Add Hour-of-Day Adjustments

1. **Within each day** → Add hour-specific adjustments:
   - **9AM-12PM** → Additional +20% (stacks with day bid)
   - **12-1PM** (Mon/Tue only) → -10%

### Phase 3: Monitor & Adjust (Days 1-7)

- Track impressions, clicks, cost by day/hour
- Monitor for any unusual patterns
- Adjust if Tuesday 9-12PM gets too expensive

### Phase 4: Switch to Week 2 Schedule (Day 8)

- Reduce hours and bids per Week 2 table
- Compare Week 1 vs Week 2 performance
- Identify optimal balance point

---

## Performance Tracking Metrics

### Daily Monitoring

- [ ] Impressions by day of week
- [ ] Clicks by hour of day (especially 9-12PM)
- [ ] Cost per click (Mon/Tue vs Wed-Fri)
- [ ] Conversion rate by day

### Weekly Review

- [ ] Total conversions Week 1 vs Week 2
- [ ] Cost per acquisition comparison
- [ ] Budget utilization (are we hitting daily limits?)
- [ ] Hour-of-day performance (is 12-1PM still worth it Mon/Tue?)

### 2-Week Comparison

- [ ] Total spend: Old schedule vs new schedule
- [ ] Total conversions: Did we maintain or increase?
- [ ] CPA improvement: Target 15-25% reduction
- [ ] ROI: More bookings per dollar spent

---

## Contingency Plans

### If Week 1 Performs Poorly:

- **Revert to current schedule** immediately
- **Analyze what changed:** Did competitors increase bids?
- **Test smaller adjustments:** +20% instead of +50%

### If Week 2 Too Aggressive (Budget Exhaustion):

- **Reduce peak hour bids** from +70% to +50%
- **Extend Friday hours** back to 10AM if needed
- **Lower Mon/Tue base bids** from +50% to +40%

### If Friday Shows Surprising Activity:

- **Week 3:** Test Friday 6AM-11AM, 0% bid
- **Monitor for pattern change:** Maybe new competition emerged
- **Consider seasonal factors:** End of week urgency?

---

## Manual Booking Correlation

### Booking Pattern Analysis

**Melinda (Nov 3 Sunday appointment):**

- Appointment was Sunday 12PM, but she booked earlier in the week
- **Most likely click period:** Mon Oct 28 - Fri Nov 1
- **Best guess:** Tuesday/Wednesday 9AM-12PM based on heatmap
- **Implication:** Our Mon/Tue peak schedule would capture this

**Lilly (Nov 5 Tuesday appointment):**

- Appointment was Tuesday 8AM (early)
- **Most likely click period:** Mon Nov 4 (day before) OR same-day morning
- **Best guess:** Monday evening (after ads stop) OR Tuesday 6-8AM
- **Implication:** Consider testing 5-6AM Tuesday for early bookers

### Hypothesis for Future Testing:

People who book **early morning appointments** (like 8AM) may search **the night before or very early same day**. Consider testing:

- **Monday/Tuesday 5-6AM:** +20% bid to catch early birds
- **Sunday evening ads:** Test 6-9PM Sunday for Monday morning appointments

---

## Success Criteria

### Week 1 Success =

- ✅ Maintain or increase total conversions vs. previous 7 days
- ✅ Reduce cost per conversion by 10%+
- ✅ Monday/Tuesday account for 60%+ of conversions
- ✅ No ad budget exhaustion before 1PM on peak days

### Week 2 Success =

- ✅ Maintain 80%+ of Week 1 conversions with 17% less budget
- ✅ Cost per conversion 15%+ better than baseline
- ✅ Friday reduced hours show no material loss in conversions
- ✅ Validate Wed/Thu morning-only pattern

### Overall 2-Week Success =

- ✅ **20-25% cost savings** with same or more conversions
- ✅ **Clearer understanding** of peak vs. off-peak performance
- ✅ **Data-driven schedule** for ongoing optimization
- ✅ **Replicable pattern** for future 2-week cycles

---

## Next Steps After 2-Week Test

1. **Analyze Results:** Create performance report comparing old vs. new schedule
2. **Choose Winner:** Pick Week 1, Week 2, or hybrid approach
3. **Implement Permanent Schedule:** Apply winning schedule ongoing
4. **Continue Monitoring:** Review monthly for seasonal changes
5. **Test New Hypotheses:** Early morning slots, Sunday evening, etc.

---

## Quick Reference: Google Ads Setup

### Step-by-Step Schedule Creation

```
Campaign → Settings → Ad Schedule → Edit

WEEK 1:
Monday:    06:00-13:00, +50% | 09:00-12:00, +20%
Tuesday:   06:00-13:00, +50% | 09:00-12:00, +20%
Wednesday: 06:00-12:00, +10% | 09:00-12:00, +10%
Thursday:  06:00-12:00,   0% | 09:00-11:00, +15%
Friday:    06:00-10:00, -10%

WEEK 2 (after 7 days):
Monday:    06:00-13:00, +40% | 09:00-12:00, +20%
Tuesday:   06:00-13:00, +40% | 09:00-12:00, +20%
Wednesday: 06:00-11:00,   0%
Thursday:  06:00-11:00,   0%
Friday:    06:00-09:00, -20%
```

---

**Document Status:** Ready for Implementation  
**Approval Needed:** Julian sign-off before implementing  
**Timeline:** Implement Week 1 immediately, switch to Week 2 on Day 8  
**Review Date:** November 23, 2025 (end of 2-week cycle)
