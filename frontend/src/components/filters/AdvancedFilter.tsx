import React, { useState, useCallback } from 'react';
import { X, Filter, Plus, Trash2 } from 'lucide-react';

export interface FilterRule {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: string | number | string[];
  conjunction?: 'AND' | 'OR';
}

export interface FilterConfig {
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'range';
    options?: Array<{ label: string; value: string }>;
  }>;
  onApply: (rules: FilterRule[]) => void;
  onClear?: () => void;
}

export const AdvancedFilter: React.FC<FilterConfig> = ({
  fields,
  onApply,
  onClear,
}) => {
  const [rules, setRules] = useState<FilterRule[]>([
    {
      id: '1',
      field: fields[0]?.name || '',
      operator: 'equals',
      value: '',
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);

  const addRule = useCallback(() => {
    const newRule: FilterRule = {
      id: Date.now().toString(),
      field: fields[0]?.name || '',
      operator: 'equals',
      value: '',
      conjunction: 'AND',
    };
    setRules([...rules, newRule]);
  }, [fields, rules]);

  const removeRule = useCallback((id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  }, [rules]);

  const updateRule = useCallback(
    (id: string, updates: Partial<FilterRule>) => {
      setRules(
        rules.map(rule =>
          rule.id === id ? { ...rule, ...updates } : rule
        )
      );
    },
    [rules]
  );

  const handleApply = () => {
    onApply(rules.filter(rule => rule.value !== ''));
    setIsOpen(false);
  };

  const handleClear = () => {
    setRules([
      {
        id: '1',
        field: fields[0]?.name || '',
        operator: 'equals',
        value: '',
      },
    ]);
    onClear?.();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#1A1A2E] hover:bg-[#2E2E4A] border border-[#2E2E4A] rounded-lg text-[#9B98B8] transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filters
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[#16213E] border border-[#2E2E4A] rounded-lg shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Advanced Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#9B98B8] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {rules.map((rule, index) => (
              <div key={rule.id} className="space-y-2">
                {index > 0 && (
                  <select
                    value={rule.conjunction || 'AND'}
                    onChange={e =>
                      updateRule(rule.id, { conjunction: e.target.value as 'AND' | 'OR' })
                    }
                    className="w-full px-2 py-1 bg-[#0A0E27] border border-[#2E2E4A] rounded text-[#9B98B8] text-sm"
                  >
                    <option>AND</option>
                    <option>OR</option>
                  </select>
                )}

                <div className="flex gap-2">
                  <select
                    value={rule.field}
                    onChange={e => updateRule(rule.id, { field: e.target.value })}
                    className="flex-1 px-2 py-1 bg-[#0A0E27] border border-[#2E2E4A] rounded text-[#9B98B8] text-sm"
                  >
                    {fields.map(field => (
                      <option key={field.name} value={field.name}>
                        {field.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={rule.operator}
                    onChange={e =>
                      updateRule(rule.id, {
                        operator: e.target.value as FilterRule['operator'],
                      })
                    }
                    className="px-2 py-1 bg-[#0A0E27] border border-[#2E2E4A] rounded text-[#9B98B8] text-sm"
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater">Greater</option>
                    <option value="less">Less</option>
                    <option value="between">Between</option>
                    <option value="in">In</option>
                  </select>

                  <button
                    onClick={() => removeRule(rule.id)}
                    className="p-1 text-[#FF6B35] hover:bg-[#FF6B35]/10 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={rule.value}
                  onChange={e => updateRule(rule.id, { value: e.target.value })}
                  placeholder="Filter value"
                  className="w-full px-2 py-1 bg-[#0A0E27] border border-[#2E2E4A] rounded text-[#F0EFF8] text-sm"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-[#2E2E4A]">
            <button
              onClick={addRule}
              className="flex items-center gap-2 px-3 py-1 text-[#6C47FF] hover:bg-[#6C47FF]/10 rounded text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>

            <div className="flex-1" />

            <button
              onClick={handleClear}
              className="px-3 py-1 text-[#9B98B8] hover:bg-[#2E2E4A] rounded text-sm transition-colors"
            >
              Clear
            </button>

            <button
              onClick={handleApply}
              className="px-3 py-1 bg-[#6C47FF] hover:bg-[#5234DB] text-white rounded text-sm transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter;
