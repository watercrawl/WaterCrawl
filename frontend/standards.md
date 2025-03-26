# WaterCrawl Frontend Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Components](#4-components)
5. [Pages](#5-pages)
6. [Design Standards](#6-design-standards)
7. [Development Practices](#7-development-practices)
8. [Services](#8-services)
9. [State Management](#9-state-management)
10. [Team Structure](#10-team-structure)
11. [API Architecture](#11-api-architecture)
12. [Recent Updates](#12-recent-updates)
13. [Component Remounting Strategy](#13-component-remounting-strategy)
14. [Playground and API Integration](#14-playground-and-api-integration)

## 1. Project Overview
A React-based frontend application built with TypeScript and Vite, following modern React practices and component-based architecture.

## 2. Technology Stack
### Core Technologies
- **React 18.3.1**: Main frontend framework
- **TypeScript**: For type-safe development
- **Vite**: Build tool and development server

### Key Dependencies
- **Styling**: 
  - Tailwind CSS 3.4.16
  - @tailwindcss/forms
  - PostCSS & Autoprefixer

- **UI Components**:
  - @headlessui/react: Accessible UI components
  - @heroicons/react: Icon library
  - @monaco-editor/react: Code editor

- **State & Forms**:
  - react-hook-form: Form handling
  - yup: Form validation
  - @hookform/resolvers

- **Authentication & API**:
  - @auth0/auth0-react
  - axios
  - jwt-decode

- **Utilities**:
  - date-fns
  - react-hot-toast
  - recharts

## 3. Project Structure
```
src/
├── assets/          # Static assets
├── components/      # Reusable components
├── config/         # Configuration files
├── contexts/       # React contexts
├── layouts/        # Layout components
├── pages/          # Application pages
├── services/       # API services
├── styles/         # Global styles
├── types/          # TypeScript types
└── utils/          # Utility functions
```

## 4. Components
### Shared Components
- Loading animations
- UI elements
- Form components

### Feature Components
- Authentication components
- Dashboard components
- Activity log components

### Team-Scoped Components
Components that need to be remounted when the team changes should be wrapped with the `TeamScopedComponent`. This wrapper uses the team ID as a key to force a remount when the team changes.

```typescript
// Example usage
import { TeamScopedComponent } from '../components/shared/TeamScopedComponent';

const MyComponent = () => {
  return (
    <TeamScopedComponent>
      {/* This content will be remounted when team changes */}
      <div>Team-specific content</div>
    </TeamScopedComponent>
  );
};
```

Usage guidelines:
1. Use for components that need fresh data when team changes
2. Use for components that maintain team-specific state
3. Use when components need to reset their internal state on team change

Example scenarios:
- Data tables with team-specific filters
- Forms with team-specific validation
- Charts with team-specific metrics

## 5. Pages
### Authentication
- Login
- Registration
- Password recovery

### Dashboard
- Main dashboard
- Team management
- Activity monitoring

## 6. Design Standards
### Styling
- Tailwind CSS usage
- Responsive design
- Custom design system

### Component Architecture
- Functional components
- Custom hooks
- Context usage

### UI/UX Standards
- Consistent spacing
- Accessibility
- Loading states
- Error handling

## 7. Development Practices
- TypeScript usage
- ESLint configuration
- Component structure
- Code organization

## 8. Services
### API Services
- Authentication
- Team management
- Data operations

### Utility Services
- Error handling
- Data transformation
- State persistence

## 9. State Management
- Context API usage
- Local state practices
- Form state handling

## 10. Team Structure
### Team Model
- Core properties
- Member management
- Role definitions

### Team Features
- Team creation
- Member management
- Role assignment

## 11. API Architecture
### Base Configuration
- Environment setup
- Request/response handling
- Error management

### Security
- Authentication flow
- Token management
- Header management

### Headers Implementation
```typescript
// API Headers
{
  'Authorization': 'Bearer ${token}',
  'x-team-id': '${teamId}',
  'Content-Type': 'application/json'
}
```

### Best Practices
1. Type safety
2. Consistent endpoints
3. Version control
4. Error handling
5. Header management

## 12. Recent Updates
### API Integration
- Team ID header implementation
- Automatic header injection
- Improved request handling

### Implementation Notes
1. **Authentication**:
   - Token refresh updates
   - Error handling improvements

2. **Team Management**:
   - Context-based state
   - Simplified updates

3. **API Headers**:
   - Consistent management
   - Automatic injection

### Migration Guidelines
- Verify API endpoints
- Update parsing logic
- Use context methods

## 13. Component Remounting Strategy

### TeamScopedComponent
A utility component that forces remounting of its children when the team context changes. This ensures that team-specific components are properly reset and reinitialized when switching between teams.

```typescript
// Implementation
export const TeamScopedComponent: React.FC<TeamScopedComponentProps> = ({ children }) => {
  const { currentTeam } = useTeam();
  return <div key={currentTeam?.uuid}>{children}</div>;
};
```

### Application Structure
The application uses TeamScopedComponent at the dashboard layout level:

```typescript
// App.tsx
<TeamProvider>
  <TeamScopedComponent>
    <DashboardLayout />
  </TeamScopedComponent>
</TeamProvider>
```

### Benefits
1. **Automatic State Reset**
   - All component states are reset on team change
   - Prevents stale data between team switches
   - Ensures clean initialization for new team context

2. **Data Consistency**
   - Forces re-fetching of team-specific data
   - Prevents data leakage between teams
   - Maintains team data isolation

3. **User Experience**
   - Clear separation between team contexts
   - Predictable component behavior
   - Consistent state management

### When to Use
1. **Dashboard Layout**
   - Entire dashboard remounts on team change
   - All team-specific views reset
   - Navigation state refreshes

2. **Data-Heavy Components**
   - Components with team-specific data
   - Stateful components requiring reset
   - Components with team-dependent initialization

3. **Form Components**
   - Team-specific form state
   - Validation rules per team
   - Custom team configurations

### Implementation Notes
1. **Performance Considerations**
   - Only wraps necessary components
   - Efficient key-based remounting
   - Minimal DOM manipulation

2. **State Management**
   - Works with React Context
   - Integrates with team state
   - Preserves React component lifecycle

3. **Error Handling**
   - Graceful handling of team changes
   - Safe component unmounting
   - Clean state transitions

### Best Practices
1. Use at appropriate component level
2. Consider performance implications
3. Implement loading states if needed
4. Handle cleanup in useEffect
5. Manage async operations properly

### Example Usage
```typescript
// Component level usage
const TeamDataGrid = () => {
  return (
    <TeamScopedComponent>
      <DataGrid />
    </TeamScopedComponent>
  );
};

// Page level usage
const DashboardPage = () => {
  return (
    <TeamScopedComponent>
      <DashboardContent />
    </TeamScopedComponent>
  );
};

## 14. Playground and API Integration

### Playground Features
1. **URL Crawling**
   - Input URL for crawling
   - Real-time status updates
   - Result visualization

2. **Crawl Options**
   ```typescript
   interface PageOptions {
     excludeTags: string;      // Tags to exclude from crawling
     includeTags: string;      // Tags to specifically include
     waitTime: string;         // Wait time between requests
     extractMainContent: boolean; // Extract main content only
     includeHtml: boolean;     // Include HTML in results
     includeLinks: boolean;    // Include links in results
   }
   ```

3. **Real-time Updates**
   - Server-sent events for status
   - Live result updates
   - Progress tracking

### API Structure

1. **Core Crawl Endpoints**
   ```yaml
   /api/v1/core/crawl-requests/:
     - POST: Start new crawl
     - GET: List crawl requests
   
   /api/v1/core/crawl-requests/{id}/status/:
     - GET: Real-time status updates (SSE)
   
   /api/v1/core/crawl-requests/{id}/results/:
     - GET: Retrieve crawl results
   ```

2. **Authentication Endpoints**
   ```yaml
   /api/v1/user/auth/login/
   /api/v1/user/auth/register/
   /api/v1/user/auth/token/refresh/
   ```

3. **Team Management**
   ```yaml
   /api/v1/user/teams/:
     - GET: List teams
     - POST: Create team
   
   /api/v1/user/teams/current/:
     - GET: Current team
   
   /api/v1/user/teams/current/members/:
     - GET: Team members
   ```

### Integration Points

1. **Crawl Request Flow**
   ```typescript
   // Create crawl request
   const request = {
     url: string,
     options: {
       spider_options: {},
       page_options: {
         exclude_tags: string[],
         include_tags: string[],
         wait_time: number,
         only_main_content: boolean,
         include_html: boolean,
         include_links: boolean
       }
     }
   };

   // Handle events
   const handleCrawlEvent = (event: CrawlEvent) => {
     if (event.type === 'state') {
       // Update request state
     } else if (event.type === 'result') {
       // Handle new result
     }
   };
   ```

2. **Security**
   - JWT Authentication
   - Team-based access control
   - API key management

3. **Error Handling**
   ```typescript
   // API Error Response
   interface APIError {
     message: string;
     errors: {
       [key: string]: string[];
     };
     code: number;
   }
   ```

### Best Practices

1. **API Calls**
   - Use type-safe request/response
   - Handle rate limiting
   - Implement proper error handling

2. **Real-time Updates**
   - Manage SSE connections
   - Handle disconnections
   - Buffer results appropriately

3. **Team Context**
   - Include team ID in headers
   - Validate team access
   - Handle team switches

### Usage Examples

1. **Start Crawl**
   ```typescript
   const startCrawl = async (url: string, options: PageOptions) => {
     const response = await crawlService.createCrawlRequest({
       url,
       options: {
         spider_options: {},
         page_options: {
           ...formatPageOptions(options)
         }
       }
     });
     return response.data;
   };
   ```

2. **Monitor Progress**
   ```typescript
   const monitorCrawl = (uuid: string) => {
     crawlService.subscribeToStatus(
       uuid,
       handleCrawlEvent,
       handleCrawlComplete
     );
   };
   ```

3. **Handle Results**
   ```typescript
   const handleResults = (results: CrawlResult[]) => {
     // Process and display results
     setCrawlStatus(prev => ({
       ...prev,
       results: [...prev.results, ...results]
     }));
   };
   ```
