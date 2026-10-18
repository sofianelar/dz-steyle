import { Input } from '@heroui/react';

export default function InputField({
  label,
  className = '',
  style,
  ...props
}) {
  const inputElement = (
    <Input
      {...props}
      style={style}
      aria-label={props['aria-label'] || label || props.placeholder}
      className={`h-11 w-full px-3.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all font-sans shadow-xs ${className}`}
    />
  );

  if (label) {
    return (
      <div className="w-full">
        <label className="block text-xs font-bold text-zinc-600 mb-1.5 select-none">
          {label}
        </label>
        {inputElement}
      </div>
    );
  }

  return inputElement;
}