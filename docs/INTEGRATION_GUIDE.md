# Job Creation Form - Integration Guide

## Project Structure

Your component is located in:
```
SEEMS_UI/src/models/Sales/
├── JobCreationForm.tsx           (Main component)
├── styles/
│   └── JobCreationForm.css       (Component styles)
└── INTEGRATION_GUIDE.md          (This file)
```

## Current Status

✅ Component file: **SEEMS_UI/src/models/Sales/JobCreationForm.tsx**
✅ CSS file: **SEEMS_UI/src/models/Sales/styles/JobCreationForm.css**
✅ Import path: Updated to `./styles/JobCreationForm.css`

## How to Use

### 1. Import the Component
```tsx
import JobCreationForm from './models/Sales/JobCreationForm';
```

### 2. Add to Your Page/Route
```tsx
// In your routing file or page
function JobCreationPage() {
  return (
    <div>
      <JobCreationForm />
    </div>
  );
}
```

### 3. Configure Environment Variables
Create/update `.env` in your React project root:
```env
REACT_APP_API_URL=http://localhost:5000
```

## API Endpoints Required

The component expects these endpoints to be available on your backend:

### 1. Get Realised Enquiries
```
GET /api/enquiries/realised
```

### 2. Get PO Numbers
```
GET /api/po/{enquiryId}
```

### 3. Get PO Details
```
GET /api/po/{poNumber}/details
```

### 4. Generate Job Number
```
POST /api/jobs/generate-number
Body: { enquiry: string, billingType: string }
```

### 5. Create Job
```
POST /api/jobs/create
Body: {
  billingType: string,
  enquiry: string,
  poNumber: string,
  boardRef?: string,
  billingDate?: string,
  jobNumber: string,
  poAmount: number,
  poHours: number
}
```

## Backend Implementation

### API Endpoints in Your .NET Core Backend

Refer to the reference controller implementation provided in:
`src/backend-reference/JobCreationController.cs`

### Quick Implementation Example

In your .NET Core API:

```csharp
[ApiController]
[Route("api/[controller]")]
public class EnquiriesController : ControllerBase
{
    private readonly YourDbContext _context;

    [HttpGet("realised")]
    public async Task<IActionResult> GetRealisedEnquiries()
    {
        var enquiries = await _context.SeEnquiries
            .Where(e => e.Status == "Realised")
            .Select(e => new { 
                id = e.EnquiryNo, 
                label = e.EnquiryNo 
            })
            .ToListAsync();
        
        return Ok(enquiries);
    }
}
```

## Component Features

### 1. Billing Type Selection
- **Fixed-Cost**: Shows board reference field
- **Time & Material**: Shows billing date field

### 2. Form Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Enquiry | Dropdown | Yes | Auto-loaded |
| PO Number | Dropdown | Yes | Loads after enquiry selection |
| Job Number | Text | No | Auto-generated |
| Board Ref | Text | No | Fixed-Cost only |
| Billing Date | Date | Yes | Time & Material only |

### 3. Auto-Display Information
- Total PO Amount
- Total PO Hours
- Balance Hours

### 4. User Feedback
- Form validation messages
- Loading states during API calls
- Success/error notifications
- Visual feedback for disabled states

## Styling

The component uses a professional gradient design. To customize:

### Change Colors
Edit `SEEMS_UI/src/models/Sales/styles/JobCreationForm.css`:

```css
.job-creation-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Responsive Breakpoints
- Desktop: All features visible
- Tablet: Single column layout (768px and below)
- Mobile: Full-width, touch-friendly (480px and below)

## Testing

### 1. Visual Test
```bash
npm start
# Navigate to the component page
# Verify form renders correctly
```

### 2. API Test with cURL
```bash
# Test get enquiries
curl http://localhost:5000/api/enquiries/realised

# Test get PO numbers
curl http://localhost:5000/api/po/ENQ001

# Test get PO details
curl http://localhost:5000/api/po/PO123/details

# Test generate job number
curl -X POST http://localhost:5000/api/jobs/generate-number \
  -H "Content-Type: application/json" \
  -d '{"enquiry":"ENQ001","billingType":"Fixed"}'

# Test create job
curl -X POST http://localhost:5000/api/jobs/create \
  -H "Content-Type: application/json" \
  -d '{
    "billingType":"Fixed",
    "enquiry":"ENQ001",
    "poNumber":"PO123",
    "boardRef":"BOARD123",
    "billingDate":null,
    "jobNumber":"ABC50001",
    "poAmount":50000,
    "poHours":200
  }'
```

### 3. Manual End-to-End Test
1. Open component
2. Select Enquiry → PO numbers dropdown populates
3. Select PO Number → Details display, job number generates
4. For Time & Material: Pick billing date
5. Click "Create Job"
6. Verify success message
7. Check database for new job records

## Troubleshooting

### Issue: "Failed to fetch enquiries"
**Cause**: API endpoint not responding or incorrect URL
**Fix**:
- Check `.env` file has correct `REACT_APP_API_URL`
- Verify backend API is running
- Check network tab in DevTools for actual API call

### Issue: Dropdown doesn't populate
**Cause**: API returned empty or malformed data
**Fix**:
- Verify API endpoint returns correct format: `[{id: string, label: string}]`
- Check backend logs
- Test API endpoint directly with cURL

### Issue: Form won't submit
**Cause**: Validation failed or API error
**Fix**:
- Check all required fields are filled
- Open browser console for error details
- Verify all required API parameters are present

### Issue: CORS Error
**Cause**: Backend CORS not configured properly
**Fix**:
In your .NET Core Startup.cs:
```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// In Configure()
app.UseCors("AllowAll");
```

## Component Props & Customization

Currently the component accepts no props. To extend it:

```tsx
interface JobCreationFormProps {
  onSuccess?: (jobNumber: string) => void;
  onError?: (error: Error) => void;
  initialBillingType?: 'Fixed' | 'TimeAndMaterial';
  apiBaseUrl?: string;
}

const JobCreationForm: React.FC<JobCreationFormProps> = ({ 
  onSuccess, 
  onError,
  initialBillingType = 'Fixed',
  apiBaseUrl = process.env.REACT_APP_API_URL
}) => {
  // Implementation
}
```

## Performance Optimization

### 1. Cache Enquiries
Add to component if enquiry list doesn't change often:
```tsx
const [enquiriesCached, setEnquiriesCached] = useState(false);

useEffect(() => {
  if (!enquiriesCached) {
    fetchEnquiries();
    setEnquiriesCached(true);
  }
}, []);
```

### 2. Debounce API Calls
If adding search functionality:
```tsx
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
```

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |
| IE 11 | - | ❌ Not supported |

## Security Considerations

### 1. Authentication
Add auth headers to API calls:
```tsx
// In each fetch call
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
}
```

### 2. Input Validation
Component validates:
- ✓ Enquiry is selected
- ✓ PO Number is selected
- ✓ Billing date for T&M jobs
- ✓ All required fields filled

### 3. HTTPS
Use HTTPS in production:
```env
REACT_APP_API_URL=https://api.yourdomain.com
```

## File Sizes

| File | Size | Gzipped |
|------|------|---------|
| JobCreationForm.tsx | ~12KB | ~3KB |
| JobCreationForm.css | ~14KB | ~2KB |
| Total | ~26KB | ~5KB |

## Browser DevTools Tips

### Debug Form State
```javascript
// In browser console
const state = document.querySelector('[data-state]')?.getAttribute('data-state');
console.log(JSON.parse(state));
```

### Monitor API Calls
1. Open DevTools → Network tab
2. Type "api" in filter
3. Watch API calls as you interact with form

### Debug Styling
1. Inspect element with DevTools
2. Check computed styles
3. Verify CSS classes are applied

## Related Documentation

For more information, see:
- `JobCreationREADME.md` - Component feature details
- `BACKEND_INTEGRATION_GUIDE.md` - Backend API implementation
- `QUICK_START.md` - Quick setup guide
- `MIGRATION_SUMMARY.md` - Migration overview

## Next Steps

1. ✅ Component is in place
2. ⏭️ Implement backend API endpoints
3. ⏭️ Configure CORS on backend
4. ⏭️ Test API endpoints
5. ⏭️ Deploy to development environment
6. ⏭️ User acceptance testing
7. ⏭️ Deploy to production

## Support

For issues:
1. Check browser console for errors
2. Review network tab for API calls
3. Check backend logs
4. Verify database schema matches implementation

---

**Last Updated**: 2026-07-03
**Component Version**: 1.0.0
**Status**: Ready for Integration
