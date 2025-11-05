# WaterCrawl Frontend - AI Coding Rules

This directory contains comprehensive guidelines for AI assistants working on the WaterCrawl frontend codebase.

## Rule Files

### Core Guidelines
1. **00-project-overview.md** - Project architecture, tech stack, and structure
2. **01-code-style.md** - TypeScript conventions, formatting, and naming
3. **02-design-system.md** - Tailwind CSS, colors, components, and styling
4. **03-internationalization.md** - i18next usage and translation guidelines
5. **04-components.md** - Component patterns and shared components
6. **05-api-integration.md** - API services, error handling, and data fetching
7. **06-best-practices.md** - Performance, security, accessibility, and patterns

## Quick Reference

### Key Principles
1. ✅ **Use semantic color tokens** - Never use numbered variants (`primary-500`)
2. ✅ **Always translate text** - Use `t()` for all user-facing strings
3. ✅ **Reuse shared components** - Check `/src/components/shared/` first
4. ✅ **Type everything** - Avoid `any`, define all types explicitly
5. ✅ **Handle errors gracefully** - Use try-catch with toast notifications
6. ✅ **Show loading states** - Provide feedback during async operations
7. ✅ **Mobile-first responsive** - Design for mobile, enhance for desktop
8. ✅ **Follow existing patterns** - Maintain consistency with codebase

### Tech Stack at a Glance
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom semantic design system
- **Forms**: React Hook Form + Yup validation
- **i18n**: i18next (10 languages supported)
- **HTTP**: Axios with centralized API services
- **State**: React Context API
- **Routing**: React Router v7

### Common Patterns

**Component Structure:**
```typescript
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MyType } from '../../types';

interface MyComponentProps {
  data: MyType;
}

const MyComponent: React.FC<MyComponentProps> = ({ data }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-card p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-foreground">
        {t('section.title')}
      </h2>
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

**API Call Pattern:**
```typescript
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await apiService.getData();
    setData(response.data);
  } catch (error: any) {
    console.error('Error:', error);
    toast.error(error.response?.data?.message || t('errors.generic'));
  } finally {
    setLoading(false);
  }
};
```

**Styling Pattern:**
```tsx
// ✅ Semantic colors
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">

// ✅ Consistent spacing
<div className="space-y-4 px-6 py-5">

// ✅ Responsive design
<div className="w-full md:w-1/2 lg:w-1/3">
```

## How to Use These Rules

1. **Before Starting** - Read the relevant rule file for your task
2. **During Development** - Reference rules for patterns and conventions
3. **Before Submitting** - Check your code against the guidelines
4. **When Uncertain** - Consult the rules or ask for clarification

## Updates

These rules are living documents. When patterns evolve or new conventions are established, update the relevant rule files to maintain consistency.

## Contact

For questions or suggestions about these guidelines, please reach out to the development team.

---

**Remember**: These rules exist to maintain consistency, quality, and to help AI assistants produce code that aligns with the WaterCrawl project standards. Follow them closely!
