export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';

export type UIWidgetType =
  | 'text'
  | 'textarea'
  | 'password'
  | 'email'
  | 'url'
  | 'date'
  | 'datetime'
  | 'time'
  | 'color'
  | 'file'
  | 'range'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'rich-text'
  | 'code-editor'
  | 'json-editor'
  | 'markdown';

export interface EditorOptions {
  minimap?: { enabled: boolean };
  fontSize?: number;
  lineNumbers?: 'on' | 'off';
  scrollBeyondLastLine?: boolean;
  automaticLayout?: boolean;
  [key: string]: any;
}

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

export interface UIOptions {
  widget?: UIWidgetType;
  placeholder?: string;
  rows?: number;
  cols?: number;
  accept?: string;
  multiple?: boolean;
  autoFocus?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
  inline?: boolean;
  options?: SelectOption[];
  language?: string; // for code-editor
  preview?: boolean; // for markdown
  toolbar?: string[]; // for rich-text
  editorHeight?: string; // for json-editor
  fontSize?: number; // for json-editor
  editorOptions?: EditorOptions; // for json-editor
}

export interface JSONSchemaDefinition {
  multipleOf?: string | number;
  placeholder?: string;
  type: JSONSchemaType;
  title?: string;
  description?: string;
  default?: any;
  required?: string[];
  properties?: Record<string, JSONSchemaDefinition>;
  items?: JSONSchemaDefinition;
  enum?: any[];
  enumNames?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  readOnly?: boolean;
  disabled?: boolean;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  additionalProperties?: boolean | JSONSchemaDefinition;
  dependentRequired?: Record<string, string[]>;
  const?: any;
  ui?: UIOptions;
}

export interface ValidationError {
  path: string[];
  message: string;
}

export interface FieldProps {
  schema: JSONSchemaDefinition;
  path: string[];
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  errors?: ValidationError[];
  required?: boolean;
  disabled?: boolean;
}
