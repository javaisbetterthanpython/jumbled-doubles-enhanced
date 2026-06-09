import { Button, Input } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { Edit } from "react-iconly";
import clsx from "clsx";

export function PlayerNameEdit({
  name,
  onSave,
  className,
  disabled = false,
  "aria-label": ariaLabel = "Player name",
}: {
  name: string;
  onSave: (newName: string) => void;
  className?: string;
  disabled?: boolean;
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

  return (
    <div className={clsx("flex items-center gap-1 flex-1 min-w-0", className)}>
      <span className="flex-1 min-w-0 truncate">{name}</span>
      {!disabled ? (
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          aria-label={`Edit name for ${name}`}
          onPress={() => setEditing(true)}
        >
          <Edit size="small" />
        </Button>
      ) : null}
    </div>
  );
}
