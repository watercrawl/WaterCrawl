# API Integration Guidelines

## API Service Architecture

All API calls are centralized in `/src/services/api/` with dedicated service modules for each domain.

## API Services

Located in `/src/services/api/`:

- `auth.ts` - Authentication endpoints
- `user.ts` - User management
- `team.ts` - Team operations
- `crawl.ts` - Web crawling
- `search.ts` - Search functionality
- `sitemap.ts` - Sitemap generation
- `knowledgeBase.ts` - Knowledge base operations
- `apiKey.ts` - API key management
- `provider.ts` - LLM provider configuration
- `proxy.ts` - Proxy server management
- `subscription.ts` - Billing and subscriptions
- `usage.ts` - Usage tracking

## Using API Services

### Import Pattern

```typescript
import { crawlApi } from '../../services/api/crawl';
import { knowledgeBaseApi } from '../../services/api/knowledgeBase';
import { teamApi } from '../../services/api/team';
```

### Standard API Call Pattern

```typescript
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const MyComponent: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataType | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiService.getData();
      setData(response.data);
      // Optional: success toast for mutations
      // toast.success(t('toast.success'));
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || t('toast.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <Loading />}
      {data && <DisplayData data={data} />}
    </div>
  );
};
```

## Error Handling

### Standard Error Pattern

```typescript
try {
  await apiService.action();
  toast.success(t('toast.actionSuccess'));
} catch (error: any) {
  console.error('Error performing action:', error);
  
  // Extract error message from response
  const message = error.response?.data?.message 
    || error.response?.data?.detail
    || t('errors.generic');
  
  toast.error(message);
}
```

### HTTP Status Codes

Handle common status codes appropriately:

- **200-299**: Success - show success toast (for mutations only)
- **400**: Bad Request - show validation errors
- **401**: Unauthorized - redirect to login
- **403**: Forbidden - show permission error
- **404**: Not Found - show not found message
- **500**: Server Error - show generic error message

## Loading States

### Component Loading

```typescript
const [loading, setLoading] = useState(false);

// Show loading indicator
{loading && <Loading />}
{loading && <p>{t('common.loading')}</p>}

// Disable buttons during loading
<Button disabled={loading}>
  {loading ? t('common.loading') : t('common.submit')}
</Button>
```

### Toast Loading

```typescript
// For long operations, show loading toast
toast.loading(t('toast.processing'));

try {
  await longOperation();
  toast.dismiss(); // Remove loading toast
  toast.success(t('toast.success'));
} catch (error) {
  toast.dismiss();
  toast.error(t('toast.error'));
}
```

## Pagination

### API Response Format

```typescript
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

### Handling Pagination

```typescript
const [response, setResponse] = useState<PaginatedResponse<Item>>({
  count: 0,
  next: null,
  previous: null,
  results: [],
});
const [currentPage, setCurrentPage] = useState(1);

const fetchPage = async (page: number) => {
  const data = await apiService.getItems({ page });
  setResponse(data);
  setCurrentPage(page);
};

// In component
<Pagination
  currentPage={currentPage}
  totalPages={Math.ceil(response.count / pageSize)}
  onPageChange={fetchPage}
/>
```

## Best Practices

1. **Centralize API Calls** - Use service modules, not inline axios calls
2. **Always Handle Errors** - Catch and display errors with toast
3. **Show Loading States** - Provide feedback during async operations
4. **Use TypeScript** - Define response types
5. **Toast for Mutations** - Show success/error toasts for create/update/delete
6. **No Toast for Reads** - Don't toast on successful GET requests
7. **Console Log Errors** - Always log errors for debugging
8. **Extract Error Messages** - Parse backend error messages properly
9. **Handle Edge Cases** - Empty states, network errors, timeouts
10. **Clean Up** - Use finally blocks to reset loading states
