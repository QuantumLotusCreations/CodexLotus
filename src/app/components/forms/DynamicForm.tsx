import React from "react";
import { vars } from "../../theme/tokens.css";
import { TemplateField } from "../../../lib/templates/types";

interface DynamicFormProps {
  fields: TemplateField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ fields, values, onChange }) => {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {fields.map((field) => (
        <div key={field.key}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              marginBottom: 4,
              color: vars.color.text.secondary,
              fontWeight: 500,
            }}
          >
            {field.label}
          </label>
          
          {renderInput(field, values[field.key] ?? field.defaultValue, onChange)}
          
          {field.description && (
            <div style={{ fontSize: 10, color: vars.color.text.muted, marginTop: 4 }}>
              {field.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const renderInput = (
  field: TemplateField,
  value: any,
  onChange: (key: string, value: any) => void
) => {
  const commonStyles = {
    width: "100%",
    padding: 8,
    borderRadius: 4,
    border: `1px solid ${vars.color.border.subtle}`,
    backgroundColor: vars.color.background.base,
    color: vars.color.text.primary,
    fontFamily: vars.typography.fontFamily.body,
    fontSize: 14,
  };

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          style={{ ...commonStyles, minHeight: 80, resize: "vertical" }}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(field.key, Number(e.target.value))}
          style={commonStyles}
        />
      );

    case "boolean":
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(field.key, e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          <span style={{ fontSize: 12, color: vars.color.text.secondary }}>
            {value ? "Yes" : "No"}
          </span>
        </div>
      );

    case "select":
      return (
        <select
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          style={commonStyles}
        >
          <option value="">-- Select --</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "list":
      // Simple comma-separated list for now, can be enhanced later
      return (
        <input
            type="text"
            value={Array.isArray(value) ? value.join(", ") : (value || "")}
            onChange={(e) => onChange(field.key, e.target.value.split(",").map((s: string) => s.trim()))}
            placeholder="Item 1, Item 2, Item 3"
            style={commonStyles}
        />
      );

    case "text":
    default:
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          style={commonStyles}
        />
      );
  }
};

