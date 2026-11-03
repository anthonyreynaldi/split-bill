"use client";

import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { ParticipantDto } from "@/shared/dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * People in the event with inline rename/remove. Pure view: the only state
 * is which row is being edited (UI state, not data).
 */
export function ParticipantList(props: {
  participants: ParticipantDto[];
  onRename: (participantId: string, name: string) => void;
  onRemove: (participant: ParticipantDto) => void;
  labels: { empty: string; rename: string; remove: string; save: string; cancel: string };
}) {
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  if (props.participants.length === 0) {
    return <p className="text-sm text-muted-foreground">{props.labels.empty}</p>;
  }

  return (
    <ul className="divide-y">
      {props.participants.map((p) => (
        <li key={p.id} className="flex items-center gap-2 py-2">
          {editing?.id === p.id ? (
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (editing.name.trim()) props.onRename(p.id, editing.name.trim());
                setEditing(null);
              }}
            >
              <Input
                autoFocus
                aria-label={props.labels.rename}
                value={editing.name}
                maxLength={100}
                onChange={(e) => setEditing({ id: p.id, name: e.target.value })}
              />
              <Button type="submit" size="icon" variant="ghost" aria-label={props.labels.save}>
                <Check />
              </Button>
              <Button type="button" size="icon" variant="ghost" aria-label={props.labels.cancel} onClick={() => setEditing(null)}>
                <X />
              </Button>
            </form>
          ) : (
            <>
              <span className="flex-1 truncate">{p.name}</span>
              <Button size="icon" variant="ghost" aria-label={`${props.labels.rename} ${p.name}`} onClick={() => setEditing({ id: p.id, name: p.name })}>
                <Pencil />
              </Button>
              <Button size="icon" variant="ghost" aria-label={`${props.labels.remove} ${p.name}`} onClick={() => props.onRemove(p)}>
                <Trash2 />
              </Button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
