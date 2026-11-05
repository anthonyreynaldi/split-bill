/**
 * Pure helpers for editing an event's people as a local draft that is saved
 * in one go (`saveParticipants`). No React here, so it is easy to test.
 */
import { NameSchema, type ParticipantDto, type SaveParticipantsInput } from "@/shared/dto";

/** One row of the people editor. `id` is missing for people not saved yet. */
export type DraftPerson = {
  key: string;
  id?: string;
  /** Name as saved; undefined for new rows. */
  original?: string;
  name: string;
  removed: boolean;
};

export const draftFromServer = (people: ParticipantDto[]): DraftPerson[] =>
  people.map((p) => ({ key: p.id, id: p.id, original: p.name, name: p.name, removed: false }));

/** `"Ana, Budi\nCitra"` → `["Ana", "Budi", "Citra"]`. Lets people paste a whole list. */
export const splitNames = (text: string): string[] =>
  text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** What saving the draft would change. */
export function draftChanges(rows: DraftPerson[]): Omit<SaveParticipantsInput, "eventId"> {
  return {
    add: rows.filter((r) => !r.id && !r.removed).map((r) => r.name.trim()),
    rename: rows
      .filter((r) => r.id && !r.removed && r.name.trim() !== r.original)
      .map((r) => ({ participantId: r.id!, name: r.name.trim() })),
    remove: rows.filter((r) => r.id && r.removed).map((r) => r.id!),
  };
}

export const changeCount = (c: Omit<SaveParticipantsInput, "eventId">) =>
  c.add.length + c.rename.length + c.remove.length;

/** i18n key from `validation.*` for a row's name, or undefined when it is fine. Removed rows are never invalid. */
export function nameError(row: DraftPerson): string | undefined {
  if (row.removed) return undefined;
  const r = NameSchema.safeParse(row.name);
  return r.success ? undefined : r.error.issues[0]?.message;
}

/** Keys of rows whose name appears more than once (case-insensitive), ignoring removed rows. */
export function duplicateKeys(rows: DraftPerson[]): Set<string> {
  const byName = new Map<string, string[]>();
  for (const r of rows) {
    if (r.removed || !r.name.trim()) continue;
    const k = r.name.trim().toLocaleLowerCase();
    byName.set(k, [...(byName.get(k) ?? []), r.key]);
  }
  return new Set([...byName.values()].filter((keys) => keys.length > 1).flat());
}
