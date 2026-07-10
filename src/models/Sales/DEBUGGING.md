# JobCreationForm - Debugging Guide

## 🔍 Component Not Loading? Follow This

### Step 1: Check Browser Console
Open DevTools (F12) → Console tab

**Look for errors like:**
- ❌ `Cannot find module "./styles/JobCreationForm.css"`
- ❌ `fetch failed to URL`
- ❌ `Unexpected token in JSON`

### Step 2: Verify CSS File Exists
```
Check: SEEMS_UI/src/models/Sales/styles/JobCreationForm.css
```

### Step 3: Check Network Requests
DevTools → Network tab

**Watch for these API calls when page loads:**
- `GET /api/Sales/RealisedEnquiries` - Should return array of enquiries

**If you see:**
- 🔴 404 → API endpoint doesn't exist yet
- 🔴 500 → Backend error
- 🔴 CORS error → Configure CORS in backend
- ✅ 200 → Success!

### Step 4: Verify Environment Variable
```bash
# Check .env file exists
cat .env

# Should contain:
REACT_APP_API_URL=http://localhost:5000
```

If missing, add it and restart React app:
```bash
npm start
```

---

## 📋 Common Issues & Fixes

### Issue 1: "Failed to fetch enquiries"
```
Error message: "Failed to fetch enquiries"
```

**Cause**: API endpoint not responding

**Fix**:
```bash
# Test API directly
curl http://localhost:5000/api/enquiries/realised

# Expected response:
[{"id":"ENQ001","label":"ENQ001"}]
```

If curl fails:
- Backend API not running?
- Wrong API URL in .env?
- Endpoint not implemented?

---

### Issue 2: CORS Error
```
Error: "Access to XMLHttpRequest blocked by CORS policy"
```

**Cause**: Backend CORS not configured

**Fix in .NET Core Startup.cs:**
```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowReact", builder =>
    {
        builder
            .WithOrigins("http://localhost:3000", "http://localhost:3001")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// In Configure():
app.UseCors("AllowReact");
```

Then restart backend API.

---

### Issue 3: Blank/White Page
```
Page shows nothing, no errors in console
```

**Cause**: Component not imported or CSS issue

**Fix**:
1. Check import statement:
```tsx
import JobCreationForm from './models/Sales/JobCreationForm';
```

2. Check CSS path:
```tsx
// Line 2 of JobCreationForm.tsx should be:
import "./styles/JobCreationForm.css";
```

3. Clear browser cache and reload:
   - `Ctrl+Shift+R` (Windows)
   - `Cmd+Shift+R` (Mac)

---

### Issue 4: Dropdowns Show "Select" But Don't Load Options
```
- Enquiry dropdown empty
- PO dropdown shows "Select" only
```

**Cause**: API returning wrong format

**Expected format:**
```json
[
  {"id": "ENQ001", "label": "ENQ001"},
  {"id": "ENQ002", "label": "ENQ002"}
]
```

**Fix**: Check API response format:
```bash
curl http://localhost:5000/api/enquiries/realised | jq .
```

---

### Issue 5: Component Renders But Can't Select Enquiry
```
- Form is visible
- But dropdowns won't populate
```

**Cause**: API calls failing silently

**Fix**:
1. Open DevTools Network tab
2. Select enquiry (watch for API calls)
3. Check response status and body
4. Check backend logs

---

## 🧪 Manual Testing Checklist

### Test 1: Component Loads
- [ ] Page renders without JS errors
- [ ] Form is visible
- [ ] Styling looks correct
- [ ] No 404 errors in console

### Test 2: API Connectivity
- [ ] Browser console shows no errors
- [ ] Network tab shows API calls
- [ ] API responses have 200 status
- [ ] Response format matches expected

### Test 3: Form Interaction
- [ ] Enquiry dropdown loads
- [ ] Can select enquiry
- [ ] PO dropdown populates
- [ ] Can select PO
- [ ] Details display
- [ ] Job number generates
- [ ] Submit button works

### Test 4: Success Flow
- [ ] Form submits
- [ ] Success message appears
- [ ] Database record created
- [ ] Form resets

---

## 🛠️ Step-by-Step Debugging

### Phase 1: Check Setup (2 minutes)
```bash
# 1. Verify .env file
cat .env
# Should show: REACT_APP_API_URL=http://localhost:5000

# 2. Check CSS file exists
ls SEEMS_UI/src/models/Sales/styles/JobCreationForm.css

# 3. Verify component file
ls SEEMS_UI/src/models/Sales/JobCreationForm.tsx

# 4. Restart React app
npm start
```

### Phase 2: Check Backend API (5 minutes)
```bash
# 1. Verify backend is running
netstat -an | grep 5000
# Should show port 5000 listening

# 2. Test API endpoint
curl http://localhost:5000/api/enquiries/realised
# Should return JSON array

# 3. Check backend logs
# Look for errors in Visual Studio Output
```

### Phase 3: Check Browser (5 minutes)
```bash
# 1. Open DevTools (F12)
# 2. Go to Console tab - check for red errors
# 3. Go to Network tab
# 4. Reload page (F5)
# 5. Watch for API calls
# 6. Click "enquiry" dropdown
# 7. Look for /api/enquiries/realised call
# 8. Check response (should be JSON array)
```

### Phase 4: Check Component Import (2 minutes)
1. Find where you're using JobCreationForm
2. Verify import statement is correct
3. Verify component path is correct
4. Clear browser cache: `Ctrl+Shift+Delete`
5. Reload page

---

## 🔧 Diagnostic Commands

### Check API is responding
```bash
curl -v http://localhost:5000/api/enquiries/realised
```

### Check CORS headers
```bash
curl -i -X OPTIONS http://localhost:5000/api/enquiries/realised
```

### Test with sample data
```bash
curl http://localhost:5000/api/enquiries/realised \
  -H "Accept: application/json"
```

### Check network connectivity
```bash
# From your React app
fetch('http://localhost:5000/api/enquiries/realised')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```

---

## 📊 Troubleshooting Decision Tree

```
Component not loading?
├── Check browser console
│   ├── JS error? → Fix error
│   ├── No error? → Continue
│   └── CORS error? → Configure backend CORS
├── Check Network tab
│   ├── No API calls? → Component not calling API
│   ├── 404 responses? → Backend endpoint doesn't exist
│   ├── 500 responses? → Backend error (check logs)
│   └── 200 responses? → API working, check response format
└── Check .env
    ├── REACT_APP_API_URL missing? → Add it
    ├── Wrong URL? → Update it
    └── Restart app after change
```

---

## 📝 Error Log Template

When reporting an issue, provide:

```
1. Error message: [paste exact error]
2. Browser: [Chrome/Firefox/Safari/Edge]
3. Console errors: [screenshot or paste]
4. Network tab: [paste API request/response]
5. Steps to reproduce: [1. 2. 3.]
6. What you've tried: [list attempts]
```

---

## ✅ Working Setup Verification

You'll know it's working when:

1. ✅ Page loads with form visible
2. ✅ No red errors in console
3. ✅ Network tab shows `/api/enquiries/realised` call with 200 status
4. ✅ Response is JSON array with enquiries
5. ✅ Enquiry dropdown populates
6. ✅ Can select enquiry
7. ✅ PO dropdown populates
8. ✅ Can submit form

---

## 🆘 Still Not Working?

### Check These Files Exist
- [ ] `SEEMS_UI/src/models/Sales/JobCreationForm.tsx` (350 lines)
- [ ] `SEEMS_UI/src/models/Sales/styles/JobCreationForm.css` (400 lines)
- [ ] `.env` with `REACT_APP_API_URL`

### Check Backend
- [ ] API running on port 5000?
- [ ] CORS configured?
- [ ] `/api/enquiries/realised` endpoint exists?
- [ ] Returns JSON array?

### Check React
- [ ] React app running on port 3000?
- [ ] JobCreationForm imported?
- [ ] No TypeScript errors?
- [ ] CSS imports working?

### Check Network
- [ ] Can reach http://localhost:5000?
- [ ] CORS headers present?
- [ ] No firewall blocking?

---

**Still stuck? Open DevTools and paste the Network tab response here! 🔧**
