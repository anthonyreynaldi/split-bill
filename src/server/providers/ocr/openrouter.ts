import { RECEIPT_PROMPT, type OcrProvider } from "./ocr-provider";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const ATTEMPT_TIMEOUT_MS = 25_000;

/**
 * OCR via OpenRouter vision models (chat completions with an image).
 *
 * `models` is a priority list (env `OPENROUTER_MODEL`, comma-separated), e.g.
 * several `:free` vision models. Free models share an upstream quota with all
 * OpenRouter users and are often rate-limited (429), so:
 * 1. each request sends OpenRouter's native fallback list (`models: [...]`),
 *    so OpenRouter itself moves on when a model is rate-limited or down;
 * 2. if the request still fails (HTTP error, timeout, empty or non-JSON output),
 *    we retry with the models after the one that failed, at most `models.length` attempts.
 *
 * @throws when every model failed; the message lists each failure.
 */
export function createOpenRouterOcrProvider(cfg: {
  apiKey: string;
  models: readonly string[];
  appUrl: string;
  /** For tests. */
  fetchFn?: typeof fetch;
  /** For tests / quiet runs. */
  log?: (msg: string) => void;
}): OcrProvider {
  if (cfg.models.length === 0) throw new Error("OpenRouter: at least one model is required");
  const doFetch = cfg.fetchFn ?? fetch;
  const log = cfg.log ?? ((m: string) => console.warn(m));

  return {
    async extract({ data, contentType }) {
      const imageUrl = `data:${contentType};base64,${Buffer.from(data).toString("base64")}`;
      const failures: string[] = [];

      for (let i = 0; i < cfg.models.length; i++) {
        const models = cfg.models.slice(i);
        try {
          const { model, json } = await requestOnce(doFetch, cfg, models, imageUrl);
          if (i > 0 || model !== models[0]) log(`[ocr] read by ${model}`);
          return json;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          failures.push(`${models[0]}: ${msg}`);
          log(`[ocr] ${models[0]} failed: ${msg}`);
        }
      }
      throw new Error(`OpenRouter: all models failed\n- ${failures.join("\n- ")}`);
    },
  };
}

async function requestOnce(
  doFetch: typeof fetch,
  cfg: { apiKey: string; appUrl: string },
  models: readonly string[],
  imageUrl: string,
): Promise<{ model: string; json: unknown }> {
  const res = await doFetch(ENDPOINT, {
    method: "POST",
    signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": cfg.appUrl,
      "X-Title": "Split Bill",
    },
    body: JSON.stringify({
      // `models` = OpenRouter's fallback list; a single model needs only `model`
      ...(models.length > 1 ? { models } : { model: models[0] }),
      temperature: 0,
      messages: [
        { role: "system", content: RECEIPT_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract this receipt as JSON." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as {
    model?: string;
    error?: { message?: string; code?: number };
    choices?: { message?: { content?: string } }[];
  };
  // OpenRouter can return 200 with an `error` object (e.g. a provider failed mid-request)
  if (body.error) throw new Error(`error ${body.error.code ?? ""}: ${body.error.message ?? "unknown"}`.trim());
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty response");
  return { model: body.model ?? models[0], json: parseJsonLoose(content) };
}

/**
 * Pull the JSON object out of model output. Models sometimes wrap it in
 * ```json fences, add text around it, or (reasoning models) emit a
 * `<think>…</think>` block first.
 */
export function parseJsonLoose(text: string): unknown {
  const noThink = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const fenced = noThink.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : noThink;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("OCR: no JSON object in model output");
  return JSON.parse(candidate.slice(start, end + 1));
}

/** `"a, b,,c"` → `["a", "b", "c"]`. Used for env `OPENROUTER_MODEL`. */
export function parseModelList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
