"use client";

import { Input } from "@/components/ui/input";

interface EditableNumberInputProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
  "data-testid"?: string;
}

export function EditableNumberInput({
  value,
  onValueChange,
  min,
  max,
  disabled,
  className,
  id,
  "data-testid": dataTestId,
}: EditableNumberInputProps) {
  return (
    <Input
      id={id}
      type="number"
      min={min}
      max={max}
      value={value}
      disabled={disabled}
      data-testid={dataTestId}
      className={className}
      onChange={(event) => {
        const nextValue = event.target.value;

        if (nextValue === "") {
          onValueChange(0);
          return;
        }

        const parsed = Number.parseInt(nextValue, 10);
        if (Number.isNaN(parsed)) {
          return;
        }

        onValueChange(parsed);
      }}
    />
  );
}
