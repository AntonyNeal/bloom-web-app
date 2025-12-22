# Bloom Production Release - December 21-22, 2025

**Production:** https://www.lpapsychology.com.au  
**Commits:** 51 changes on `main` branch

---

## Changes in This Release

### 1. Booking Modal Improvements
- Mobile modal now full height (slide-up sheet style)
- Desktop calendar fills viewport without scrollbar
- All time slots visible without scrolling (8am-6pm)
- Fixed for Samsung Galaxy and iPhone Safari

### 2. GA4 Conversion Tracking
- New direct events for booking flow tracking

### 3. Facebook Sharing
- New sunflower-themed image when sharing on Facebook

### 4. Bug Fixes
- Hero image no longer causes layout shift
- Email/phone fields stack correctly on mobile
- Mobile CTA bar loads availability on all pages

---

## UAT Test Checklist

### 1. Booking Flow (Mobile + Desktop)
- [ ] Go to homepage → Click "Book Now"
- [ ] Modal opens smoothly, no layout jump
- [ ] Select a date → All time slots visible (no scrolling needed)
- [ ] Fill in details → Email and phone fields look correct
- [ ] Complete a test booking (or cancel before payment)

### 2. Join Us Application
- [ ] Scroll to bottom of homepage → Click "Join Us"
- [ ] Fill out the practitioner application form
- [ ] Submit → Should see confirmation message
- [ ] Check email for application received confirmation

### 3. Social Sharing
- [ ] Copy homepage URL → Paste into Facebook post (or use Facebook debugger)
- [ ] Sunflower image should appear in preview

### 4. Lighthouse Performance Audit
- [ ] Open Chrome DevTools → Lighthouse tab
- [ ] Run audit on **Mobile** for homepage
- [ ] **If score is below 90**: Run 3 separate audits and send me the downloaded JSON/HTML files

---

**Previous release:** Dec 20, 2025 | **This release:** Dec 21-22, 2025

