"use client";

import { useState, type ClipboardEvent } from "react";
import { Loader2, Trash2, Undo2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** One row as the view shows it. */
export type PersonRow = {
  key: string;
  name: string;
  isNew: boolean;
  removed: boolean;
  changed: boolean;
  /** Translated error message. */
  error?: string;
  duplicate: boolean;
};

/**
 * Editable list of an event's people. Pure view: every name is an input, so
 * people are added, renamed and removed without waiting for the server, then
 * saved together with **Save**. The only local state is the "add" input text.
 */
export function ParticipantEditor(props: {
  rows: PersonRow[];
  pending: boolean;
  changeCount: number;
  canSave: boolean;
  /** Returns how many people were added (0 when the text was blank). */
  onAdd: (text: string) => number;
  onRename: (key: string, name: string) => void;
  onToggleRemove: (key: string) => void;
  onSave: () => void;
  onDiscard: () => void;
  labels: {
    empty: string;
    name: (n: number) => string;
    addPerson: string;
    addPlaceholder: string;
    addHint: string;
    add: string;
    remove: (name: string) => string;
    undo: (name: string) => string;
    isNew: string;
    duplicate: string;
    unsaved: (n: number) => string;
    save: string;
    discard: string;
  };
}) {
  const [text, setText] = useState("");

  const submit = () => {
    if (props.onAdd(text) > 0) setText("");
  };
  // Pasting "Ana, Budi" or several lines adds everyone at once.
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!/[\n,;]/.test(pasted)) return;
    e.preventDefault();
    props.onAdd(text + pasted);
    setText("");
  };

  return (
    <div className="space-y-3">
      {props.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{props.labels.empty}</p>
      ) : (
        <ol className="space-y-1.5">
          {props.rows.map((r, i) => (
            <li key={r.key} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <Input
                  aria-label={props.labels.name(i + 1)}
                  aria-invalid={!!r.error || undefined}
                  value={r.name}
                  maxLength={100}
                  readOnly={r.removed}
                  disabled={props.pending}
                  className={cn(
                    r.removed && "text-muted-foreground line-through",
                    (r.isNew || r.changed) && !r.removed && "border-primary/60",
                  )}
                  onChange={(e) => props.onRename(r.key, e.target.value)}
                />
                {r.isNew && <Badge variant="secondary">{props.labels.isNew}</Badge>}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={props.pending}
                  aria-label={r.removed ? props.labels.undo(r.name) : props.labels.remove(r.name)}
                  onClick={() => props.onToggleRemove(r.key)}
                >
                  {r.removed ? <Undo2 /> : <Trash2 />}
                </Button>
              </div>
              {(r.error || r.duplicate) && (
                <p className={cn("pl-7 text-xs", r.error ? "text-destructive" : "text-muted-foreground")}>
                  {r.error ?? props.labels.duplicate}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      <form
        noValidate
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          aria-label={props.labels.addPerson}
          placeholder={props.labels.addPlaceholder}
          value={text}
          maxLength={2000}
          enterKeyHint="enter"
          disabled={props.pending}
          onChange={(e) => setText(e.target.value)}
          onPaste={onPaste}
        />
        <Button type="submit" variant="secondary" disabled={props.pending || !text.trim()}>
          <UserPlus /> {props.labels.add}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">{props.labels.addHint}</p>

      {props.changeCount > 0 && (
        <div className="sticky bottom-2 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
          <span className="flex-1 text-sm">{props.labels.unsaved(props.changeCount)}</span>
          <Button type="button" variant="ghost" size="sm" disabled={props.pending} onClick={props.onDiscard}>
            {props.labels.discard}
          </Button>
          <Button type="button" size="sm" disabled={!props.canSave || props.pending} aria-busy={props.pending} onClick={props.onSave}>
            {props.pending && <Loader2 className="animate-spin" />} {props.labels.save}
          </Button>
        </div>
      )}
    </div>
  );
}
