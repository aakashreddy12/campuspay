import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
}

export function MultiSelect({
  options,
  selected,
  onSelectionChange,
  placeholder = "Select options...",
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onSelectionChange(selected.filter((item) => item !== value));
    } else {
      onSelectionChange([...selected, value]);
    }
  };

  const removeItem = (value: string) => {
    onSelectionChange(selected.filter((item) => item !== value));
  };

  const selectedLabels = selected.map(
    (value) => options.find((option) => option.value === value)?.label || value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selected.length > 0 && (
              <>
                {selectedLabels.slice(0, maxDisplay).map((label, index) => (
                  <Badge
                    key={selected[index]}
                    variant="secondary"
                    className="text-xs"
                  >
                    {label}
                    <button
                      className="ml-1 hover:bg-muted-foreground/20 rounded-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeItem(selected[index]);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selected.length > maxDisplay && (
                  <Badge variant="secondary" className="text-xs">
                    +{selected.length - maxDisplay} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                selected.includes(option.value) && "bg-accent",
              )}
              onClick={() => handleSelect(option.value)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selected.includes(option.value) ? "opacity-100" : "opacity-0",
                )}
              />
              {option.label}
            </div>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="w-full"
            >
              Clear All
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
