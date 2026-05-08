import type { APIRoute } from "astro";
import { generateObject } from "ai";
import { z } from "zod";
import { requireAdmin } from "~/lib/auth";
import { getModel, isAiConfigured, describeModel } from "~/lib/ai";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const RequestSchema = z.object({
  kind: z.enum(["post", "book", "author"]),
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(20000),
  // Hint fields the model can use as additional context.
  subtitle: z.string().optional(),
  authorName: z.string().optional(),
});

const ExcerptField = z
  .string()
  .describe(
    "Resumen de 1-2 frases para tarjetas y redes sociales. Sin clickbait, en español neutro. Entre 80 y 200 caracteres.",
  );
const MetaField = z
  .string()
  .describe(
    "Descripción SEO para Google. Entre 140 y 160 caracteres. Debe incluir las palabras clave principales naturalmente.",
  );
const TagsField = z
  .array(z.string())
  .min(2)
  .max(8)
  .describe(
    "Etiquetas internas para organización dentro del CMS (no visibles al público en buscadores). Sustantivos cortos en minúsculas, sin tildes ni espacios extras. Ejemplo: 'editorial', 'literatura colombiana', 'reseña'.",
  );
const KeywordsField = z
  .array(z.string())
  .min(3)
  .max(10)
  .describe(
    "Términos SEO públicos por los que se quiere posicionar este contenido en buscadores. Frases más largas y explícitas que las tags. Ejemplo: 'editorial independiente colombiana', 'novela latinoamericana 2026'.",
  );
const CoverAltField = z
  .string()
  .describe(
    "Texto alternativo para la imagen de portada. Debe describir lo que esa imagen probablemente representa para el contenido (no el contenido en sí). Entre 60 y 125 caracteres. Sin la palabra 'imagen' ni 'foto' al inicio.",
  );

const SchemaForKind = {
  post: z.object({
    excerpt: ExcerptField,
    meta_description: MetaField,
    tags: TagsField,
    keywords: KeywordsField,
    cover_image_alt: CoverAltField,
  }),
  book: z.object({
    tags: TagsField,
    keywords: KeywordsField,
    cover_image_alt: CoverAltField,
  }),
  author: z.object({
    keywords: KeywordsField,
  }),
} as const;

const SYSTEM_PROMPT = `Eres editor de Casa de Asterión Ediciones, una editorial literaria colombiana. Tu trabajo es generar metadatos en español para artículos, libros y fichas de autor de un CMS editorial.

Reglas:
- Idioma: español neutro, registro literario pero claro.
- No uses clickbait, hashtags, emojis ni signos de exclamación dramáticos.
- "tags" son internas para el CMS — palabras cortas, sin acentos ni espacios al inicio/final.
- "keywords" son SEO públicas — frases más descriptivas, pueden tener tildes y palabras compuestas.
- "excerpt" se muestra al usuario en listas y redes sociales. Es prosa.
- "meta_description" la lee Google. Debe sonar natural y ser independiente del excerpt.
- No repitas literalmente el título.`;

export const POST: APIRoute = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard instanceof Response) return json({ error: "unauthorized" }, 401);

  if (!isAiConfigured()) {
    return json(
      {
        error: "ai_not_configured",
        message:
          "Falta la API key del proveedor de IA. Define OPENAI_API_KEY en el entorno.",
      },
      503,
    );
  }

  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "invalid_request", issues: parsed.error.issues }, 400);
  }
  const { kind, title, content, subtitle, authorName } = parsed.data;

  const userPrompt = [
    `Tipo: ${kind === "post" ? "artículo" : kind === "book" ? "libro" : "ficha de autor"}`,
    `Título: ${title}`,
    subtitle ? `Subtítulo: ${subtitle}` : null,
    authorName ? `Autor: ${authorName}` : null,
    "",
    "Contenido:",
    content.slice(0, 12000),
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await generateObject({
      model: getModel(),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      schema: SchemaForKind[kind],
      temperature: 0.4,
    });

    return json({
      ok: true,
      model: describeModel(),
      data: result.object,
    });
  } catch (err) {
    console.error("[ai/generate-metadata] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: "ai_failed", message }, 502);
  }
};
