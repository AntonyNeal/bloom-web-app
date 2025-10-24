# 🧪 LIVE FORM TEST PLAN

**URL**: https://bloom.life-psychology.com.au/join-us
**Opened**: Simple Browser in VS Code
**Purpose**: Test if application submission works despite API 404 errors

---

## 📋 **TEST PROCEDURE**

### **Step 1: Fill Out Basic Information**

- **First Name**: Test
- **Last Name**: User
- **Email**: test@example.com (use a test email)
- **Phone**: +61 400 000 000
- **AHPRA Registration**: PSY1234567

### **Step 2: Complete Qualification Section**

- **Registration Type**: Clinical Psychologist (or any option)
- **Years Registered**: 5
- **Specializations**: Select any relevant options

### **Step 3: Upload Documents** (Optional for test)

- **AHPRA Certificate**: Upload any PDF file
- **Professional Photo**: Upload any image file
- **CV**: Upload any document

### **Step 4: Fill Cover Letter**

- Add any brief text like "Test application submission"

### **Step 5: Submit Form**

- Click the submit button
- **Watch for**:
  - ✅ Success message and redirect
  - ❌ Error message (500, network error, etc.)

---

## 🔍 **WHAT TO LOOK FOR**

### **Success Indicators**:

- Form submits without error
- Success page or confirmation message
- No console errors in browser dev tools

### **Failure Indicators**:

- 500 Internal Server Error
- Network error messages
- Form hangs on "Planting..." animation
- Console errors in browser dev tools

---

## 📊 **EXPECTED RESULTS**

### **If Database Fix Worked**:

- ✅ Form should submit successfully
- ✅ Data should be stored in database
- ✅ User should see confirmation

### **If Still Issues**:

- ❌ 500 error would indicate database columns weren't added properly
- ❌ Network error would indicate function app still down
- ❌ 404 error would indicate routing problems

---

## 🛠️ **DEBUG TIPS**

### **Open Browser Dev Tools**:

1. Right-click in browser → Inspect
2. Go to **Network** tab
3. Submit form and watch the API calls
4. Check **Console** tab for JavaScript errors

### **API Call to Watch**:

```
POST https://bloom-platform-functions-v2.azurewebsites.net/api/applications
```

**Expected Response**: `201 Created` with application data

---

## 📝 **REPORT RESULTS**

After testing, report:

1. **Did the form submit successfully?**
2. **What response code did the API call get?**
3. **Any error messages shown to user?**
4. **Any console errors in browser dev tools?**

---

**Ready to test!** 🚀

Fill out the form and submit it. This will tell us definitively if our database fix worked!
