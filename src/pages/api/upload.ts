import type { APIRoute } from "astro";
import sharp from "sharp";
import { requireAdmin } from "~/lib/auth";
import { getSupabaseServerClient } from "~/lib/supabase-server";

const RASTER_RE = /^image\/(jpeg|png|gif|avif|webp)$/;

export const POST: APIRoute = async (ctx) => {
  const guard = await requireAdmin(ctx);
  if (guard instanceof Response) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const fd = await ctx.request.formData();
  const file = fd.get("file");
  const bucket = String(fd.get("bucket") ?? "covers");

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "no_file" }), { status: 400 });
  }
  if (!["covers", "content", "authors"].includes(bucket)) {
    return new Response(JSON.stringify({ error: "invalid_bucket" }), { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "file_too_large" }), { status: 400 });
  }

  const supabase = getSupabaseServerClient(ctx.request, ctx.cookies);

  const safeBase = file.name.replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "image";

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let outBuffer: Buffer = inputBuffer;
  let outType = file.type;
  let outExt = file.name.split(".").pop()?.toLowerCase() || "bin";

  // Reject anything that isn't a raster image we know how to convert.
  // SVG and other vector/exotic types are intentionally NOT supported here —
  // every raster upload through the CMS becomes a .webp on disk.
  if (!RASTER_RE.test(file.type)) {
    return new Response(
      JSON.stringify({ error: "unsupported_format", message: `Formato no soportado: ${file.type || "desconocido"}. Sube JPG, PNG, GIF, AVIF o WebP.` }),
      { status: 415, headers: { "content-type": "application/json" } },
    );
  }

  // Convert raster images to WebP. Even uploads that arrive as WebP go
  // through Sharp so we re-encode at our standard quality/size budget and
  // strip metadata. If Sharp fails (corrupt file, OOM, etc.) we surface a
  // 500 instead of silently keeping the unconverted original.
  try {
    outBuffer = await sharp(inputBuffer, { animated: false, failOn: "none" })
      .rotate()                         // honor EXIF orientation
      .resize({                         // cap to 2400px to keep WebP encode cheap
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    outType = "image/webp";
    outExt = "webp";
  } catch (err) {
    console.error("[upload] webp conversion failed:", err);
    return new Response(
      JSON.stringify({
        error: "conversion_failed",
        message: "No se pudo procesar la imagen. Si es muy grande, intenta una versión más liviana.",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const year = new Date().getFullYear();
  const path = `${year}/${safeBase}-${crypto.randomUUID().slice(0, 8)}.${outExt}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, outBuffer, {
      contentType: outType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return new Response(JSON.stringify({
    url: data.publicUrl,
    path,
    contentType: outType,
    size: outBuffer.length,
    originalSize: inputBuffer.length,
  }), {
    headers: { "content-type": "application/json" },
  });
};
