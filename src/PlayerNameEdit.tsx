import { Button, Input } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { Edit } from "react-iconly";
import clsx from "clsx";

export function PlayerNameEdit({
  name,
  onSave,
  className,
  disabled = false,
  compact = false,
  editTrigger = "icon",
  "aria-label": ariaLabel = "Player name",
}: {
  name: string;
  onSave: (newName: string) => void;
  className?: string;
  disabled?: boolean;
  /** When true, name does not grow to fill the row (for setup lists). */
  compact?: boolean;
  /** `icon` — pencil on the left; `click` — tap the name to edit (no pencil). */
  editTrigger?: "icon" | "click";
  "aria-label"?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const cancel = () => {
    setDraft(name);
    setEditing(false);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      cancel();
      return;
    }
    if (trimmed !== name) {
      onSave(trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        className={clsx("flex-1", className)}
        aria-label={ariaLabel}
        value={draft}
        size="sm"
        variant="underlined"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        fullWidth
      />
    );
  }

  if (editTrigger === "click") {
    if (disabled) {
      return (
        <span
          className={clsx(
            "min-w-0 truncate",
            compact ? "max-w-[9rem] sm:max-w-none" : "flex-1",
            className
          )}
        >
          {name}
        </span>
      );
    }
    return (
      <Button
        variant="light"
        aria-label={`Edit name for ${name}`}
        className={clsx(
          "h-auto min-h-0 min-w-0 justify-start px-1 font-normal text-inherit",
          compact ? "max-w-[9rem] sm:max-w-none" : "flex-1",
          className
        )}
        onPress={() => setEditing(true)}
      >
        <span className="truncate text-left">{name}</span>
      </Button>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-1 min-w-0",
        compact ? "flex-none" : "flex-1",
        className
      )}
    >
      {!disabled ? (
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          className="shrink-0"
          aria-label={`Edit name for ${name}`}
          onPress={() => setEditing(true)}
        >
          <Edit size="small" />
        </Button>
      ) : null}
      <span
        className={clsx(
          "min-w-0 truncate",
          compact ? "max-w-[9rem] sm:max-w-none" : "flex-1"
        )}
      >
        {name}
      </span>
    </div>
  );
}
