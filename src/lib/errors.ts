/**
 * Translate raw Postgres / Supabase / Storage errors into user-friendly
 * Spanish messages for the CMS.
 *
 * Falls back to the original message if it's short and looks human enough,
 * otherwise returns a generic catch-all so the user never sees walls of
 * SQL state codes.
 */
export function friendlyError(err: unknown): string {
  // Supabase / PostgREST errors are plain objects with `.message`, not
  // Error instances. Unwrap any object that exposes a string message so
  // we can match it against the rules below instead of silently falling
  // through to the catch-all.
  const raw =
    err instanceof Error
      ? err.message ?? ""
      : err && typeof err === "object" && typeof (err as { message?: unknown }).message === "string"
        ? (err as { message: string }).message
        : "";
  if (!raw) return "Ocurrió un error inesperado.";
  const lower = raw.toLowerCase();

  if (lower.includes("duplicate key") || lower.includes("violates unique")) {
    if (lower.includes("books_isbn_unique") || lower.includes("isbn"))
      return "Ya existe un libro con ese ISBN. Verifica que no sea un duplicado.";
    if (lower.includes("_slug_"))
      return "Ya existe un elemento con ese slug. Cambia el slug y reintenta.";
    if (lower.includes("admin_emails") || lower.includes("subscribers_email"))
      return "Ese correo electrónico ya está registrado.";
    if (lower.includes("profiles_email"))
      return "Ya existe un perfil con ese correo.";
    return "Ya existe un elemento con esos datos únicos.";
  }

  if (lower.includes("violates not-null") || lower.includes("null value in column")) {
    const m = raw.match(/column "([^"]+)"/);
    return m ? `Falta completar el campo: ${m[1]}.` : "Faltan campos requeridos.";
  }

  if (lower.includes("violates foreign key")) {
    if (lower.includes("author_id"))
      return "El autor seleccionado ya no existe.";
    if (lower.includes("category_id"))
      return "La categoría seleccionada ya no existe.";
    return "Hay una referencia inválida en el formulario.";
  }

  if (lower.includes("violates check constraint") || lower.includes("check constraint")) {
    if (lower.includes("status"))
      return "El estado debe ser 'borrador' o 'publicado'.";
    if (lower.includes("role"))
      return "Rol inválido.";
    if (lower.includes("level"))
      return "Nivel de permiso inválido.";
    if (lower.includes("resource"))
      return "Sección inválida.";
    if (lower.includes("format"))
      return "Formato de libro inválido.";
    if (lower.includes("kind"))
      return "Tipo de categoría inválido.";
    return "Algún valor del formulario no cumple con las restricciones.";
  }

  if (lower.includes("permission denied") || lower.includes("row-level security")) {
    return "No tienes permisos para realizar esta acción.";
  }

  if (lower.includes("invalid input syntax") || lower.includes("invalid input value")) {
    return "Algún campo tiene un formato inválido.";
  }

  if (lower.includes("file_too_large")) return "El archivo supera los 10 MB permitidos.";
  if (lower.includes("invalid_bucket")) return "Destino de archivo inválido.";
  if (lower.includes("no_file")) return "No se seleccionó ningún archivo.";

  // Don't dump multi-line SQL errors at users.
  if (raw.length > 200 || raw.includes("\n")) return "Ocurrió un error al guardar. Intenta de nuevo.";
  return raw || "Ocurrió un error.";
}
