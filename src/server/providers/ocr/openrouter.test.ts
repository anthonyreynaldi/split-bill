import { describe, expect, it } from "vitest";
import { createOpenRouterOcrProvider, parseJsonLoose, parseModelList } from "./openrouter";

const image = { data: new Uint8Array([1, 2, 3]), contentType: "image/jpeg" };
const ok = (model: string, content: string) =>
  new Response(JSON.stringify({ model, choices: [{ message: { content } }] }), { status: 200 });

/** Fake fetch that answers from a queue and records each request body. */
function fakeFetch(...answers: (Response | Error)[]) {
  const bodies: Record<string, unknown>[] = [];
  const fn = (async (_url: string, init?: RequestInit) => {
    bodies.push(JSON.parse(String(init?.body)));
    const next = answers.shift();
    if (!next) throw new Error("no more answers");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof fetch;
  return { fn, bodies };
}

const make = (models: string[], fetchFn: typeof fetch, logs: string[] = []) =>
  createOpenRouterOcrProvider({ apiKey: "k", models, appUrl: "http://x", fetchFn, log: (m) => logs.push(m) });

describe("OpenRouter OCR provider", () => {
  it("sends one model as `model` and returns the parsed JSON", async () => {
    const f = fakeFetch(ok("a:free", '{"items":[]}'));
    await expect(make(["a:free"], f.fn).extract(image)).resolves.toEqual({ data: { items: [] }, model: "a:free" });
    expect(f.bodies[0]).toMatchObject({ model: "a:free" });
    expect(f.bodies[0]).not.toHaveProperty("models");
  });

  it("sends several models as OpenRouter's `models` fallback list", async () => {
    const logs: string[] = [];
    const f = fakeFetch(ok("b:free", '{"total":1}'));
    await expect(make(["a:free", "b:free"], f.fn, logs).extract(image)).resolves.toEqual({ data: { total: 1 }, model: "b:free" });
    expect(f.bodies[0]).toMatchObject({ models: ["a:free", "b:free"] });
    expect(logs).toEqual(["[ocr] read by b:free"]); // OpenRouter fell back on its side
  });

  it("retries with the remaining models when a request fails", async () => {
    const logs: string[] = [];
    const f = fakeFetch(new Response("rate-limited upstream", { status: 429 }), ok("b:free", '{"ok":true}'));
    await expect(make(["a:free", "b:free", "c:free"], f.fn, logs).extract(image)).resolves.toEqual({ data: { ok: true }, model: "b:free" });
    expect(f.bodies.map((b) => b.models ?? b.model)).toEqual([["a:free", "b:free", "c:free"], ["b:free", "c:free"]]);
    expect(logs[0]).toMatch(/^\[ocr\] a:free failed: HTTP 429/);
  });

  it("treats a 200 with an error object, empty output or non-JSON as a failure", async () => {
    const f = fakeFetch(
      new Response(JSON.stringify({ error: { code: 502, message: "provider down" } }), { status: 200 }),
      ok("b:free", ""),
      ok("c:free", "sorry, I can't read this"),
    );
    const err = await make(["a:free", "b:free", "c:free"], f.fn).extract(image).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toMatch(/all models failed/);
    expect((err as Error).message).toMatch(/a:free: error 502: provider down/);
    expect((err as Error).message).toMatch(/b:free: empty response/);
    expect((err as Error).message).toMatch(/c:free: OCR: no JSON object/);
  });

  it("network errors also fall through to the next model", async () => {
    const f = fakeFetch(new Error("timeout"), ok("b:free", "{}"));
    await expect(make(["a:free", "b:free"], f.fn).extract(image)).resolves.toEqual({ data: {}, model: "b:free" });
  });
});

describe("parseJsonLoose", () => {
  it("handles plain JSON, fences, surrounding text and <think> blocks", () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonLoose('Here you go:\n```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(parseJsonLoose('<think>maybe {"a":0}?</think>\n{"a":3}')).toEqual({ a: 3 });
    expect(() => parseJsonLoose("no json")).toThrow(/no JSON/);
  });
});

describe("parseModelList", () => {
  it("splits, trims and drops empties", () => {
    expect(parseModelList(" a:free , b:free,,")).toEqual(["a:free", "b:free"]);
    expect(parseModelList("a:free")).toEqual(["a:free"]);
    expect(parseModelList(undefined)).toEqual([]);
  });
});
