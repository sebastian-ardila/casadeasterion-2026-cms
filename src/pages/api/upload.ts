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

  // Convert raster images to WebP (skip if already WebP).
  if (RASTER_RE.test(file.type) && file.type !== "image/webp") {
    try {
      outBuffer = await sharp(inputBuffer, { animated: false })
        .rotate() // honor EXIF orientation
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      outType = "image/webp";
      outExt = "webp";
    } catch (err) {
      // If conversion fails, fall back to original (unlikely for valid raster types).
      console.error("[upload] webp conversion failed, uploading original:", err);
    }
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
