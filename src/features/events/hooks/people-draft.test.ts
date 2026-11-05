import { describe, expect, it } from "vitest";
import { changeCount, draftChanges, draftFromServer, duplicateKeys, nameError, splitNames } from "./people-draft";

const server = [
  { id: "a", name: "Ana" },
  { id: "b", name: "Budi" },
  { id: "c", name: "Citra" },
];

describe("people draft", () => {
  it("splits a pasted list on commas, semicolons and new lines", () => {
    expect(splitNames(" Ana, Budi;\nCitra\r\n\n , ")).toEqual(["Ana", "Budi", "Citra"]);
    expect(splitNames("   ")).toEqual([]);
  });

  it("has no changes right after loading", () => {
    expect(changeCount(draftChanges(draftFromServer(server)))).toBe(0);
  });

  it("collects adds, renames (trimmed, only when different) and removes", () => {
    const rows = draftFromServer(server);
    rows[0].name = " Ana "; // same after trim → not a rename
    rows[1].name = "Budi S";
    rows[2].removed = true;
    rows.push({ key: "n1", name: " Dedi ", removed: false }, { key: "n2", name: "Gone", removed: true });
    expect(draftChanges(rows)).toEqual({
      add: ["Dedi"],
      rename: [{ participantId: "b", name: "Budi S" }],
      remove: ["c"],
    });
  });

  it("validates names, except on removed rows", () => {
    expect(nameError({ key: "x", name: "  ", removed: false })).toBe("required");
    expect(nameError({ key: "x", name: "x".repeat(101), removed: false })).toBe("tooLong");
    expect(nameError({ key: "x", name: "  ", removed: true })).toBeUndefined();
    expect(nameError({ key: "x", name: "Ana", removed: false })).toBeUndefined();
  });

  it("flags duplicate names case-insensitively", () => {
    const rows = draftFromServer(server);
    rows.push({ key: "n1", name: " ana ", removed: false }, { key: "n2", name: "Citra", removed: false });
    rows[2].removed = true; // removed Citra doesn't clash with the new one
    expect([...duplicateKeys(rows)].sort()).toEqual(["a", "n1"]);
  });
});
