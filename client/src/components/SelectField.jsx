import { Label, ListBox, Select } from '@heroui/react';

export default function SelectField({
  value,
  onChange,
  options = [],
  label,
  placeholder = 'اختر خياراً',
  className = '',
  isRequired = false,
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <Label className="block text-xs font-bold text-zinc-600 mb-1.5 select-none">
          {label}
        </Label>
      )}
      <Select
        className="w-full ui-select"
        selectedKey={value || null}
        onSelectionChange={key => onChange(key == null ? '' : String(key))}
        isRequired={isRequired}
      >
        <Select.Trigger className="h-11 w-full flex items-center justify-between gap-2 px-3.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all cursor-pointer shadow-xs">
          <Select.Value>
            {({ selectedText, isPlaceholder }) => (
              <span
                className={`truncate text-sm ${isPlaceholder ? 'text-zinc-400 font-normal' : 'font-semibold text-zinc-900'
                  }`}
              >
                {isPlaceholder ? placeholder : selectedText}
              </span>
            )}
          </Select.Value>
          <Select.Indicator className="text-zinc-400 shrink-0" />
        </Select.Trigger>
        <Select.Popover className="z-50 min-w-[180px] bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-scale-up">
          <ListBox className="p-1">
            {options.map(option => (
              <ListBox.Item
                key={option.value}
                id={option.value}
                textValue={option.label}
                className="px-3 py-2 rounded-lg text-sm text-zinc-800 hover:bg-zinc-100 cursor-pointer transition-colors flex items-center justify-between"
              >
                <span>{option.label}</span>
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}