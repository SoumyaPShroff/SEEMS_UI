# Job Creation Component

Professional React component for creating jobs with support for both **Fixed-Cost** and **Time & Material** billing types. Migrated from VB.NET ASP.NET pages.

## Features

✅ **Dual Billing Type Support**
- Fixed-Cost Job Creation
- Time & Material Job Creation

✅ **Professional UI**
- Modern, responsive design
- Gradient backgrounds and smooth animations
- Mobile-friendly
- Accessible form controls

✅ **Smart Form Management**
- Auto-generating job numbers
- Cascading dropdowns (Enquiry → PO Numbers → Details)
- PO summary display
- Form validation

✅ **Error Handling**
- User-friendly error messages
- Loading states
- Success notifications

## Installation

### 1. Copy Component Files
```bash
# Files are already in place:
src/components/JobCreation/JobCreationForm.tsx
src/components/JobCreation/JobCreationForm.css
src/services/jobCreationService.ts
```

### 2. Install Dependencies (if needed)
```bash
npm install
# No additional dependencies required - uses React built-in hooks
```

## Usage

### Basic Implementation

```tsx
import JobCreationForm from './components/JobCreation/JobCreationForm';

function App() {
  return (
    <div>
      <JobCreationForm />
    </div>
  );
}

export default App;
```

### With Custom Configuration

```tsx
import JobCreationForm from './components/JobCreation/JobCreationForm';

function JobCreationPage() {
  return (
    <main>
      <JobCreationForm />
    </main>
  );
}

export default JobCreationPage;
```

## API Integration

### Environment Variables

Create a `.env` file:

```env
REACT_APP_API_URL=https://api.seems.local
REACT_APP_AUTH_TOKEN_KEY=authToken
```

### API Endpoints Required

The following endpoints must be implemented in your .NET Core backend:

#### 1. Get Realised Enquiries
```http
GET /api/enquiries/realised
Authorization: Bearer {token}

Response:
[
  {
    "id": "ENQ001",
    "label": "ABC---ENQ001"
  }
]
```

#### 2. Get PO Numbers by Enquiry
```http
GET /api/po/{enquiryId}
Authorization: Bearer {token}

Response:
[
  {
    "id": "PO123",
    "number": "PO-2024-001"
  }
]
```

#### 3. Get PO Details
```http
GET /api/po/{poNumber}/details
Authorization: Bearer {token}

Response:
{
  "totalAmount": 50000,
  "totalHours": 200,
  "balanceHours": 150
}
```

#### 4. Generate Job Number
```http
POST /api/jobs/generate-number
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "enquiry": "ENQ001",
  "billingType": "Fixed"
}

Response:
{
  "jobNumber": "ABC50001_ProjectName"
}
```

#### 5. Create Job
```http
POST /api/jobs/create
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "billingType": "Fixed",
  "enquiry": "ENQ001",
  "poNumber": "PO123",
  "boardRef": "BOARD123",
  "billingDate": null,
  "jobNumber": "ABC50001_ProjectName",
  "poAmount": 50000,
  "poHours": 200
}

Response:
{
  "success": true,
  "jobNumber": "ABC50001_ProjectName",
  "projectId": 12345,
  "message": "Job created successfully"
}
```

## Reference Implementation

A reference .NET Core API controller is provided in:
```
src/backend-reference/JobCreationController.cs
```

This shows:
- Proper authentication/authorization
- Request validation
- Error handling
- Service layer integration

## Service Layer

Use the provided service file for API calls:

```tsx
import {
  fetchEnquiries,
  fetchPONumbers,
  fetchPODetails,
  generateJobNumber,
  createJob,
} from '../services/jobCreationService';

// Example usage
const enquiries = await fetchEnquiries();
const poNumbers = await fetchPONumbers(enquiryId);
const poDetails = await fetchPODetails(poNumber);
const jobNumber = await generateJobNumber({ enquiry, billingType });
const result = await createJob(jobCreationRequest);
```

## Component Props

The `JobCreationForm` component currently doesn't accept props but can be extended:

```tsx
interface JobCreationFormProps {
  onSuccess?: (jobNumber: string) => void;
  onError?: (error: Error) => void;
  initialBillingType?: 'Fixed' | 'TimeAndMaterial';
  redirectOnSuccess?: string;
}
```

## Customization

### Styling

Modify `JobCreationForm.css` to match your brand:

```css
/* Change gradient colors */
.job-creation-container {
  background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}

/* Change primary button color */
.btn-primary {
  background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}
```

### API Base URL

Update in `jobCreationService.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api.com';
```

### Form Fields

To add custom fields, modify `JobCreationForm.tsx`:

```tsx
// Add to FormState interface
interface FormState {
  // ... existing fields
  customField: string;
}

// Add form group in JSX
<div className="form-group">
  <label htmlFor="customField">Custom Field</label>
  <input
    type="text"
    id="customField"
    name="customField"
    value={formState.customField}
    onChange={handleInputChange}
    className="form-control"
  />
</div>
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- ✓ ARIA labels and roles
- ✓ Keyboard navigation support
- ✓ Color contrast compliance (WCAG AA)
- ✓ Screen reader friendly

## Testing

### Unit Tests Example

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JobCreationForm from './JobCreationForm';

describe('JobCreationForm', () => {
  test('renders billing type selector', () => {
    render(<JobCreationForm />);
    expect(screen.getByText('Fixed-Cost')).toBeInTheDocument();
    expect(screen.getByText('Time & Material')).toBeInTheDocument();
  });

  test('switches billing type on button click', () => {
    render(<JobCreationForm />);
    const tmButton = screen.getByText('Time & Material').closest('button');
    fireEvent.click(tmButton);
    expect(screen.getByLabelText('Billing Date')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<JobCreationForm />);
    const submitButton = screen.getByText('Create Job');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/Please select an enquiry/i)).toBeInTheDocument();
    });
  });
});
```

## Migration Notes from Old System

### What Changed
- **Before**: Separate VB.NET pages (fixedcostjobcreation.aspx, timeandmaterial.aspx)
- **After**: Single unified React component with type switching

### Data Flow
1. User selects billing type
2. Component loads enquiries
3. User selects enquiry → PO numbers load
4. User selects PO → Details load & job number generates
5. Submit creates job via API

### Key Features Preserved
- ✓ Multi-job creation for different scopes (Layout, Analysis, VA, etc.)
- ✓ PO details display (amount, hours, balance)
- ✓ Email notifications (handled by backend)
- ✓ Complex job number generation logic
- ✓ Project and checklist creation

## Troubleshooting

### "Failed to fetch enquiries"
- Check API base URL in `.env`
- Verify authentication token is valid
- Check CORS settings on API

### Job number not generating
- Verify `/api/jobs/generate-number` endpoint is implemented
- Check request payload format
- Look at API logs

### Form validation not working
- Ensure form fields have `required` attribute
- Check `validateForm()` function logic
- Verify error state is being set

## Support

For issues or questions:
1. Check the reference controller: `src/backend-reference/JobCreationController.cs`
2. Review service layer: `src/services/jobCreationService.ts`
3. Check browser console for errors
4. Verify API endpoints are returning correct data format

## License

Part of SEEMS Application Migration Project

---

**Last Updated**: 2026-07-03
**Component Version**: 1.0.0
