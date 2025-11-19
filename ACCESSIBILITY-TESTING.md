# Quick Accessibility Testing Guide

## 🎯 Quick Checks (5 minutes)

### Keyboard Navigation Test

1. Open `/appointments` page
2. Press `Tab` to navigate through elements
3. Verify:
   - ✅ Focus visible on all buttons (blue ring)
   - ✅ Can select service with `Enter` or `Space`
   - ✅ Dropdown closes with `Escape`
   - ✅ Book Now button accessible via keyboard

### Mobile Responsiveness Test

1. Open DevTools → Toggle device toolbar
2. Test these screen sizes:
   - iPhone SE (375px) - smallest common phone
   - iPad (768px) - tablet
   - Desktop (1024px+)
3. Verify:
   - ✅ All buttons at least 48×48px (use DevTools inspector)
   - ✅ Text readable without horizontal scroll
   - ✅ Dropdown doesn't overflow screen
   - ✅ Steps stack vertically on mobile

### Screen Reader Test (NVDA on Windows)

1. Download NVDA from https://www.nvaccess.org/ (free)
2. Press `Insert + Down Arrow` to start reading
3. Navigate with `Tab` key
4. Verify:
   - ✅ Service selection announces current state
   - ✅ Selected service is announced
   - ✅ Step numbers and descriptions read correctly
   - ✅ Time slots announce day and time

## 📋 Detailed Testing (30 minutes)

### Test 1: Service Selection Workflow

**Steps:**

1. Navigate to appointments page
2. Tab to "Select a Service" button
3. Press Enter to open dropdown
4. Use arrow keys (if applicable) or Tab to navigate services
5. Press Enter to select a service
6. Verify checkmark appears and "Book Now" is emphasized

**Expected Results:**

- Focus moves to first service option when dropdown opens
- Selected service displays with green checkmark
- Live region announces selection to screen readers
- Dropdown closes automatically after selection

### Test 2: Calendar Touch Targets

**Tools:** Chrome DevTools + Touch Emulation

**Steps:**

1. Open calendar component (if visible on site)
2. Enable touch emulation (DevTools > Settings > Devices)
3. Measure touch targets with Inspect tool
4. Test time slot selection with touch

**Expected Results:**

- All interactive elements ≥48×48px
- Time slots ≥44px height
- Navigation buttons ≥44×44px
- No accidental double-taps needed

### Test 3: Zoom & Text Scaling

**Steps:**

1. Press `Ctrl +` (Windows) or `Cmd +` (Mac) to zoom to 200%
2. Test all functionality at 200% zoom
3. Change browser font size to "Very Large"
4. Re-test booking workflow

**Expected Results:**

- No horizontal scrolling required
- All text remains readable
- Buttons don't overlap
- Layout adjusts gracefully

### Test 4: Color Contrast

**Tool:** WAVE Browser Extension or axe DevTools

**Steps:**

1. Install WAVE extension
2. Visit appointments page
3. Click WAVE icon
4. Check for contrast errors

**Expected Results:**

- No contrast errors for text
- Borders visible against backgrounds
- Focus indicators clearly visible
- Color not sole means of conveying information

### Test 5: Keyboard Shortcuts

**All keyboard shortcuts to test:**

| Action            | Key                  | Expected Result                |
| ----------------- | -------------------- | ------------------------------ |
| Navigate forward  | Tab                  | Move to next focusable element |
| Navigate backward | Shift+Tab            | Move to previous element       |
| Activate button   | Enter or Space       | Click button                   |
| Close dropdown    | Escape               | Close service selection menu   |
| Select service    | Enter (when focused) | Choose service option          |

## 🔧 Automated Testing

### Run Lighthouse Audit

```bash
# From project root
npm run lighthouse -- --only-categories=accessibility
```

**Target Scores:**

- Accessibility: ≥95
- Best Practices: ≥90
- Performance: ≥85
- SEO: ≥90

### Run axe-core Tests

```bash
# If axe is installed
npm run test:a11y
```

## 🐛 Common Issues to Check

### Issue: Focus Not Visible

**Check:** Focus ring appears on all interactive elements
**Fix:** Verify `focus:ring-4` classes applied

### Issue: Dropdown Off-Screen on Mobile

**Check:** Service dropdown stays within viewport
**Fix:** Dropdown uses `w-[95vw]` on mobile

### Issue: Text Too Small

**Check:** Minimum 12px font size (16px for body text ideal)
**Fix:** Use responsive text classes `text-sm sm:text-base`

### Issue: Touch Target Too Small

**Check:** Interactive elements ≥48×48px
**Fix:** Add `min-h-[48px] min-w-[48px]` or `p-3`

## 📱 Real Device Testing

### iOS (iPhone/iPad)

1. Open Safari
2. Go to Settings > Accessibility > VoiceOver
3. Enable VoiceOver
4. Test booking workflow
5. Verify swipe gestures work

### Android

1. Open Chrome
2. Go to Settings > Accessibility > TalkBack
3. Enable TalkBack
4. Test booking workflow
5. Verify touch exploration works

## ✅ Checklist

Before considering complete, verify:

- [ ] All buttons have visible focus states
- [ ] Tab order is logical (follows visual layout)
- [ ] No keyboard traps (can tab out of everything)
- [ ] Screen reader announces all interactive elements
- [ ] Touch targets meet 48×48px minimum
- [ ] Works at 200% zoom without horizontal scroll
- [ ] Color contrast passes WCAG AA (4.5:1)
- [ ] Dropdown closes with Escape key
- [ ] Focus moves appropriately when dropdown opens/closes
- [ ] Live regions announce dynamic content changes
- [ ] ARIA labels describe current state accurately
- [ ] Works on mobile (iPhone SE size minimum)
- [ ] No errors in browser console

## 🎓 Learning Resources

- **WebAIM Screen Reader Testing**: https://webaim.org/articles/screenreader_testing/
- **Keyboard Testing Guide**: https://webaim.org/articles/keyboard/
- **WCAG Quick Reference**: https://www.w3.org/WAI/WCAG22/quickref/
- **A11Y Project Checklist**: https://www.a11yproject.com/checklist/

## 📞 Support

If you find accessibility issues:

1. Take screenshot with DevTools element inspector showing dimensions
2. Note browser and OS version
3. Describe expected vs actual behavior
4. Note any console errors

## 🚀 Next Steps

After basic testing passes:

1. User testing with actual assistive technology users
2. Professional accessibility audit
3. Continuous monitoring with automated tools
4. Regular regression testing

---

**Created**: November 6, 2025  
**For**: Life Psychology Australia Booking System
