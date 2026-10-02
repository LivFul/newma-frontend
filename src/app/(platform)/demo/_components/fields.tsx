import { type ReactNode, useId } from "react";

// Labelled native controls shared by the workflow forms (keyboard and screen-reader friendly).
const CONTROL =
  "min-h-10 w-full rounded-md border border-border-strong bg-bg-elevated px-3 text-fg";

type SelectFieldProps = Readonly<{
  label: string;
  value: string;
  options: readonly Readonly<{ value: string; label: string }>[];
  onChange: (value: string) => void;
  name?: string;
}>;

export function SelectField({ label, value, options, onChange, name }: SelectFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type TextFieldProps = Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: "text" | "number";
  hint?: ReactNode;
  autoComplete?: string;
}>;

export function TextField({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  hint,
  autoComplete = "off",
}: TextFieldProps) {
  const id = useId();
  const hintId = useId();
  const shared = {
    id,
    value,
    autoComplete,
    "aria-describedby": hint ? hintId : undefined,
    className: multiline ? `${CONTROL} min-h-20 py-2` : CONTROL,
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
      {multiline ? (
        <textarea {...shared} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input {...shared} type={type} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );
}

export const humanize = (value: string): string => value.replaceAll("_", " ");

export const formatInstant = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toUTCString();
};
