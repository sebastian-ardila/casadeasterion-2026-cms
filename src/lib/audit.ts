// Formateo legible de entradas del audit_log. Función pura, autocontenida
// (sin imports de auth.ts) para poder testearla con vitest sin arrastrar
// dependencias de Astro. Las etiquetas se duplican deliberadamente aquí.

export type AuditDetails =
  | { kind: "permission"; perm_resource: string; old_level: string | null; new_level: string | null }
  | { kind: "admin_user"; role: string | null };

export type AuditEntry = {
  id: number;
  action: "create" | "update" | "delete";
  resource: string;
  record_label: string | null;
  details: AuditDetails | null;
  created_at: string;
};

const VERB: Record<AuditEntry["action"], string> = {
  create: "Creó",
  update: "Editó",
  delete: "Eliminó",
};

// Sustantivo singular con artículo, por recurso lógico del audit_log.
const NOUN: Record<string, string> = {
  posts: "la publicación",
  books: "el libro",
  authors: "el autor",
  categories: "la categoría",
  collections: "la colección",
  staff: "el miembro del equipo",
  site: "la configuración del sitio",
  orders: "el pedido",
  subscribers: "el suscriptor",
};

// Ícono lucide por recurso del audit_log.
const ICON: Record<string, string> = {
  posts: "lucide:newspaper",
  books: "lucide:book-open",
  authors: "lucide:users",
  categories: "lucide:folder-tree",
  collections: "lucide:library",
  staff: "lucide:building",
  site: "lucide:settings",
  orders: "lucide:shopping-bag",
  subscribers: "lucide:mail",
  admins: "lucide:shield",
};
const FALLBACK_ICON = "lucide:activity";

// Etiqueta en español de cada recurso del sistema de permisos (para textos
// de cambios de permiso). Espejo de RESOURCE_LABEL en auth.ts.
const PERM_LABEL: Record<string, string> = {
  posts: "Publicaciones",
  books: "Catálogo",
  authors: "Autores",
  collaborators: "Colaboradores",
  translators: "Traductores",
  prologuists: "Prologuistas",
  staff: "Nosotros",
  collections: "Colecciones",
  categories: "Categorías",
  site: "Webpage",
  orders: "Pedidos",
  subscribers: "Suscriptores",
  activity: "Auditoría",
  admins: "Usuarios",
};

const LEVEL_LABEL: Record<string, string> = {
  none: "Sin acceso",
  view: "Ver",
  edit: "Editar",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  owner: "Owner",
};

export function describeAuditEntry(e: AuditEntry): { icon: string; text: string } {
  const label = (e.record_label ?? "").trim();

  // Acciones de gestión de usuarios / permisos.
  if (e.resource === "admins" && e.details) {
    if (e.details.kind === "permission") {
      const section = PERM_LABEL[e.details.perm_resource] ?? e.details.perm_resource;
      const lvl = LEVEL_LABEL[e.details.new_level ?? ""] ?? e.details.new_level ?? "—";
      const who = label || "un usuario";
      if (e.action === "delete") {
        return { icon: ICON.admins, text: `Restableció permisos de «${who}» en ${section}` };
      }
      return { icon: ICON.admins, text: `Cambió permisos de «${who}»: ${section} → ${lvl}` };
    }
    if (e.details.kind === "admin_user") {
      const who = label || "un usuario";
      const role = ROLE_LABEL[e.details.role ?? ""] ?? null;
      if (e.action === "create") {
        return { icon: ICON.admins, text: role ? `Agregó al usuario «${who}» (${role})` : `Agregó al usuario «${who}»` };
      }
      if (e.action === "delete") {
        return { icon: ICON.admins, text: `Quitó al usuario «${who}»` };
      }
      return { icon: ICON.admins, text: `Actualizó al usuario «${who}»` };
    }
  }

  // Contenido genérico.
  const verb = VERB[e.action];
  const noun = NOUN[e.resource] ?? `el registro (${e.resource})`;
  const icon = ICON[e.resource] ?? FALLBACK_ICON;
  const text = label ? `${verb} ${noun} «${label}»` : `${verb} ${noun}`;
  return { icon, text };
}

// Nombres lucide únicos que puede devolver describeAuditEntry. La página los
// pre-renderiza (astro-icon SSR) como plantillas ocultas para que el cliente
// las clone al paginar — iconify no está disponible en runtime.
export const AUDIT_ICONS: string[] = Array.from(new Set([...Object.values(ICON), FALLBACK_ICON]));
