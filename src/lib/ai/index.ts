/**
 * Provider-agnostic LLM factory. The CMS only depends on what `getModel()`
 * returns — swapping providers (Anthropic, Mistral, local) is one config
 * change away.
 *
 * Required env vars:
 *   OPENAI_API_KEY       — secret key for the OpenAI provider (default).
 * Optional env vars:
 *   AI_PROVIDER          — "openai" (default) | future providers.
 *   AI_MODEL             — defaults to "gpt-4o-mini" for openai.
 */

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AiProvider = "openai";

interface AiConfig {
  provider: AiProvider;
  model: string;
}

function readConfig(): AiConfig {
  const provider = (import.meta.env.AI_PROVIDER ?? "openai") as AiProvider;
  const model = import.meta.env.AI_MODEL ?? defaultModelFor(provider);
  return { provider, model };
}

function defaultModelFor(provider: AiProvider): string {
  switch (provider) {
    case "openai":
      return "gpt-4o-mini";
  }
}

function readApiKey(provider: AiProvider): string | undefined {
  // Astro loads .env into import.meta.env on the server. The AI SDK provider
  // defaults to process.env, so we read it ourselves and pass it explicitly.
  switch (provider) {
    case "openai":
      return import.meta.env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  }
}

export function isAiConfigured(): boolean {
  const { provider } = readConfig();
  return Boolean(readApiKey(provider));
}

export function getModel(): LanguageModel {
  const { provider, model } = readConfig();
  switch (provider) {
    case "openai": {
      const apiKey = readApiKey("openai");
      const client = createOpenAI({ apiKey });
      return client(model);
    }
  }
}

export function describeModel(): string {
  const { provider, model } = readConfig();
  return `${provider}:${model}`;
}
