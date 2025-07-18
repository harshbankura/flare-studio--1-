import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export type FieldType = "string" | "number" | "nested";

export interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
  enabled: boolean;
  nested?: SchemaField[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

interface FieldRowProps {
  field: SchemaField;
  onUpdate: (field: SchemaField) => void;
  onRemove: () => void;
  level?: number;
}

const FieldRow: React.FC<FieldRowProps> = ({
  field,
  onUpdate,
  onRemove,
  level = 0,
}) => {
  const updateField = useCallback(
    (updates: Partial<SchemaField>) => {
      onUpdate({ ...field, ...updates });
    },
    [field, onUpdate],
  );

  const updateNestedField = useCallback(
    (index: number, updatedNestedField: SchemaField) => {
      const newNested = [...(field.nested || [])];
      newNested[index] = updatedNestedField;
      updateField({ nested: newNested });
    },
    [field.nested, updateField],
  );

  const removeNestedField = useCallback(
    (index: number) => {
      const newNested = (field.nested || []).filter((_, i) => i !== index);
      updateField({ nested: newNested });
    },
    [field.nested, updateField],
  );

  const addNestedField = useCallback(() => {
    const newNestedField: SchemaField = {
      id: generateId(),
      name: "",
      type: "string",
      enabled: true,
    };
    const newNested = [...(field.nested || []), newNestedField];
    updateField({ nested: newNested });
  }, [field.nested, updateField]);

  const paddingLeft = level * 20;

  return (
    <div>
      <div
        className="flex items-center gap-3 py-1"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <div className="w-16">
          <Input
            value={field.name}
            onChange={(e) => updateField({ name: e.target.value })}
            className="text-xs h-6 px-2 border border-gray-300 rounded bg-white text-black"
          />
        </div>

        <div className="w-16">
          <Select
            value={field.type}
            onValueChange={(value: FieldType) => {
              const updates: Partial<SchemaField> = { type: value };
              if (value === "nested" && !field.nested) {
                updates.nested = [];
              } else if (value !== "nested") {
                updates.nested = undefined;
              }
              updateField(updates);
            }}
          >
            <SelectTrigger className="text-xs h-6 px-2 border border-gray-300 rounded bg-white text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">string</SelectItem>
              <SelectItem value="number">number</SelectItem>
              <SelectItem value="nested">nested</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Switch
          checked={field.enabled}
          onCheckedChange={(enabled) => updateField({ enabled })}
          className="scale-75"
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-4 w-4 p-0 text-gray-600 hover:text-black"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {field.type === "nested" && (
        <div>
          {field.nested &&
            field.nested.map((nestedField, index) => (
              <FieldRow
                key={nestedField.id}
                field={nestedField}
                onUpdate={(updatedField) =>
                  updateNestedField(index, updatedField)
                }
                onRemove={() => removeNestedField(index)}
                level={level + 1}
              />
            ))}
          <div
            style={{ paddingLeft: `${(level + 1) * 20}px` }}
            className="pt-1"
          >
            <Button
              onClick={addNestedField}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 text-xs rounded h-6"
            >
              + Add Item
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SchemaBuilder: React.FC = () => {
  const [fields, setFields] = useState<SchemaField[]>([
    {
      id: "1",
      name: "name",
      type: "string",
      enabled: true,
    },
    {
      id: "2",
      name: "class",
      type: "number",
      enabled: true,
    },
    {
      id: "3",
      name: "address",
      type: "nested",
      enabled: true,
      nested: [
        {
          id: "4",
          name: "line",
          type: "number",
          enabled: true,
        },
        {
          id: "5",
          name: "",
          type: "string",
          enabled: true,
        },
      ],
    },
  ]);

  const addField = useCallback(() => {
    const newField: SchemaField = {
      id: generateId(),
      name: "",
      type: "string",
      enabled: true,
    };
    setFields((prev) => [...prev, newField]);
  }, []);

  const updateField = useCallback(
    (index: number, updatedField: SchemaField) => {
      setFields((prev) => {
        const newFields = [...prev];
        newFields[index] = updatedField;
        return newFields;
      });
    },
    [],
  );

  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const generateSchema = useCallback(() => {
    const convertFieldsToSchema = (fields: SchemaField[]): any => {
      const result: any = {};

      fields.forEach((field) => {
        if (!field.enabled) return;

        const fieldName = field.name;

        switch (field.type) {
          case "string":
            result[fieldName] = fieldName === "" ? "" : "STRING";
            break;
          case "number":
            result[fieldName] = "number";
            break;
          case "nested":
            if (field.nested && field.nested.length > 0) {
              result[fieldName] = convertFieldsToSchema(field.nested);
            } else {
              result[fieldName] = {};
            }
            break;
        }
      });

      return result;
    };

    return convertFieldsToSchema(fields);
  }, [fields]);

  const schema = generateSchema();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* Left Panel - Schema Builder */}
          <div className="bg-white rounded-lg p-4 h-fit">
            <div className="space-y-1">
              {fields.map((field, index) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  onUpdate={(updatedField) => updateField(index, updatedField)}
                  onRemove={() => removeField(index)}
                />
              ))}

              <div className="pt-3 space-y-2">
                <Button
                  onClick={addField}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 text-sm rounded"
                >
                  + Add Item
                </Button>
              </div>

              <div className="pt-4">
                <div
                  className="text-sm text-black cursor-pointer border border-gray-300 max-w-14 rounded-lg px-1"
                  onClick={() => {
                    alert("submit clicked");
                  }}
                >
                  Submit
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - JSON Preview */}
          <div className="bg-gray-300 rounded-lg p-4 h-fit">
            <div className="font-mono text-sm text-gray-800 leading-5">
              <pre>{JSON.stringify(schema, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
