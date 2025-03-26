# JSON Schema Form Component

A flexible and customizable form generator that renders forms from JSON Schema definitions with support for custom UI widgets and validation.

## Basic Usage

```typescript
import { JsonSchemaForm } from './JsonSchemaForm';
import { JSONSchemaDefinition } from './types/schema';

const schema: JSONSchemaDefinition = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      ui: {
        widget: 'text',
        placeholder: 'Enter your name'
      }
    }
  }
};

function MyForm() {
  const [formData, setFormData] = useState({});

  return (
    <JsonSchemaForm
      schema={schema}
      value={formData}
      onChange={setFormData}
      onError={(errors) => console.log('Validation errors:', errors)}
    />
  );
}
```

## Schema Types

### String Fields
```json
{
  "type": "string",
  "title": "Username",
  "description": "Enter your username",
  "minLength": 3,
  "maxLength": 20,
  "pattern": "^[a-zA-Z0-9_]+$",
  "ui": {
    "widget": "text",
    "placeholder": "johndoe",
    "autoFocus": true
  }
}
```

Available string widgets:
- `text`: Basic text input
- `textarea`: Multiline text input
- `password`: Password input
- `email`: Email input with validation
- `url`: URL input with validation
- `date`: Date picker
- `time`: Time picker
- `datetime`: DateTime picker
- `color`: Color picker
- `rich-text`: Rich text editor
- `markdown`: Markdown editor
- `code-editor`: Code editor

### Number Fields
```json
{
  "type": "number",
  "title": "Age",
  "minimum": 0,
  "maximum": 120,
  "ui": {
    "widget": "number",
    "placeholder": "Enter your age"
  }
}
```

### Boolean Fields
```json
{
  "type": "boolean",
  "title": "Subscribe to newsletter",
  "ui": {
    "widget": "switch"  // or "checkbox" or "radio"
  }
}
```

### Enum Fields
```json
{
  "type": "string",
  "title": "Country",
  "enum": ["us", "uk", "ca"],
  "enumNames": ["United States", "United Kingdom", "Canada"],
  "ui": {
    "widget": "select",  // or "radio"
    "placeholder": "Select your country"
  }
}
```

### Array Fields
```json
{
  "type": "array",
  "title": "Hobbies",
  "minItems": 1,
  "maxItems": 5,
  "items": {
    "type": "string",
    "ui": {
      "widget": "text",
      "placeholder": "Enter a hobby"
    }
  },
  "uniqueItems": true
}
```

### Object Fields
```json
{
  "type": "object",
  "title": "Address",
  "required": ["street", "city"],
  "properties": {
    "street": {
      "type": "string",
      "title": "Street"
    },
    "city": {
      "type": "string",
      "title": "City"
    }
  }
}
```

### Dependent Fields
```json
{
  "type": "object",
  "properties": {
    "payment": {
      "type": "string",
      "enum": ["credit_card", "bank", "other"],
      "ui": {
        "widget": "radio",
        "inline": true
      }
    },
    "cardNumber": {
      "type": "string",
      "title": "Card Number"
    },
    "otherDetails": {
      "type": "string",
      "title": "Other Payment Details"
    }
  },
  "dependentRequired": {
    "credit_card": ["cardNumber"],
    "other": ["otherDetails"]
  }
}
```

## UI Options

### Common UI Options
```typescript
interface UIOptions {
  widget?: UIWidgetType;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
}
```

### TextArea Options
```typescript
interface TextAreaUIOptions extends UIOptions {
  rows?: number;
  cols?: number;
}
```

### Select/Radio Options
```typescript
interface SelectUIOptions extends UIOptions {
  inline?: boolean;
  options?: Array<{
    label: string;
    value: any;
    disabled?: boolean;
  }>;
}
```

### Rich Text Editor Options
```typescript
interface RichTextUIOptions extends UIOptions {
  toolbar?: string[];
}
```

### Code Editor Options
```typescript
interface CodeEditorUIOptions extends UIOptions {
  language?: string;
}
```

### File Upload Options
```typescript
interface FileUIOptions extends UIOptions {
  accept?: string;
  multiple?: boolean;
}
```

## Validation

The form automatically validates:
- Required fields
- String length (minLength, maxLength)
- Number range (minimum, maximum)
- Pattern matching (pattern)
- Array length (minItems, maxItems)
- Unique items in arrays (uniqueItems)
- Dependent required fields
- Custom formats (email, uri, etc.)

## Styling

The component uses Tailwind CSS for styling and supports dark mode. You can customize the appearance by:

1. Using the className options in UI settings
2. Overriding the default Tailwind classes
3. Using your own CSS modules

## Accessibility

The form components are built with accessibility in mind:
- Proper ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader support
- Clear error messages
- Required field indicators

## Error Handling

Errors are displayed:
- Under each field
- With proper styling
- With clear messages
- With path information for nested fields

## Future Enhancements

Planned features:
- More widget types
- Custom validation functions
- Conditional field visibility
- Field dependencies
- Custom error rendering
- Form sections and layouts
- File upload progress
- Async validation
- Custom formats
