# 0005 — OCR via OpenRouter vision model

**Status:** Accepted · 2026-11-03

## Context
Receipts vary a lot. Classic OCR (Tesseract) returns raw text that is hard to turn into items, qty and price. Vision LLMs can return structured JSON directly. The product owner prefers free options, and OpenRouter is acceptable.

## Decision
- `OcrProvider` interface in `src/server/providers/ocr/`. The first implementation is `OpenRouterOcrProvider`.
- Model chosen by env `OPENROUTER_MODEL`. Use a vision-capable free model (`…:free`). The free list changes, so check https://openrouter.ai/models?input_modalities=image&max_price=0.
- The prompt asks for JSON only. The response is validated with the zod `OcrResultDto`, and invalid output becomes a clear error rather than a crash.
- OCR output is only a **draft**. Nothing is saved until the user confirms the form.

## Consequences
- ➕ Good structure extraction without training anything. Swappable: Tesseract.js, Google Vision or a paid model can each be a new provider.
- ➖ Free models are rate-limited and can disappear. Mitigation (2026-11-05): `OPENROUTER_MODEL` takes a priority list of several `:free` models, which fall back on each other (OpenRouter's `models` param plus a client-side retry). If all fail, the user enters the bill manually. Staying on `:free` models keeps OCR at zero cost.
- ➖ The receipt image is sent to a third party. This is mentioned in the user guide.
