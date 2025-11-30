export type FieldType = "text" | "number" | "textarea" | "select" | "boolean" | "list";

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  defaultValue?: any;
  options?: string[]; // For 'select' type
  description?: string; // Helper text
}

export type TemplateType = "entity" | "collection";

export interface TableTemplate {
  id: string;
  name: string;
  type?: TemplateType; // entity (default) or collection
  description?: string;
  fields: TemplateField[];
}

export const DEFAULT_TEMPLATE: TableTemplate = {
  id: "default_generic",
  name: "Generic Item",
  type: "entity",
  description: "A basic key-value template",
  fields: [
    { key: "name", label: "Name", type: "text", defaultValue: "New Item" },
    { key: "description", label: "Description", type: "textarea", defaultValue: "" }
  ]
};

