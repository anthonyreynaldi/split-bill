import { RECEIPT_PROMPT, type OcrProvider } from "./ocr-provider";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/**
 * OCR via an OpenRouter vision model (chat completions with an image).
 * Model: env `OPENROUTER_MODEL` (pick a vision-capable `:free` model).
 */
export function createOpenRouterOcrProvider(cfg: { apiKey: string; model: string; appUrl: string }): OcrProvider {
  return {
    async extract({ data, contentType }) {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        signal: AbortSignal.timeout(60_000),
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": cfg.appUrl,
          "X-Title": "Split Bill",
        },
        body: JSON.stringify({
          model: cfg.model,
          temperature: 0,
          messages: [
            { role: "system", content: RECEIPT_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: "Extract this receipt as JSON." },
                {
                  type: "image_url",
                  image_url: { url: `data:${contentType};base64,${Buffer.from(data).toString("base64")}` },
                },
              ],
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenRouter: empty response");
      return parseJsonLoose(content);
    },
  };
}

/** Models sometimes wrap JSON in ```json fences or add text around it. */
export function parseJsonLoose(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("OCR: no JSON object in model output");
  return JSON.parse(candidate.slice(start, end + 1));
}
