export interface ScriptMetadata {
  name: string;
  description: string;
  parameters?: ScriptParameter[];
}

export interface ScriptParameter {
  name: string;
  label: string;
  type: "text" | "number" | "boolean" | "array";
  placeholder?: string;
} 