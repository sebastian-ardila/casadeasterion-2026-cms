import { describe, it, expect } from "vitest";
import { describeAuditEntry, type AuditEntry } from "./audit";

const base: Omit<AuditEntry, "action" | "resource" | "record_label" | "details"> = {
  id: 1,
  created_at: "2026-06-20T12:00:00Z",
};

describe("describeAuditEntry", () => {
  it("creación de libro", () => {
    const r = describeAuditEntry({ ...base, action: "create", resource: "books", record_label: "El Aleph", details: null });
    expect(r.text).toBe("Creó el libro «El Aleph»");
    expect(r.icon).toBe("lucide:book-open");
  });

  it("edición de autor", () => {
    const r = describeAuditEntry({ ...base, action: "update", resource: "authors", record_label: "Borges", details: null });
    expect(r.text).toBe("Editó el autor «Borges»");
  });

  it("borrado de categoría", () => {
    const r = describeAuditEntry({ ...base, action: "delete", resource: "categories", record_label: "Poesía", details: null });
    expect(r.text).toBe("Eliminó la categoría «Poesía»");
  });

  it("etiqueta vacía cae a genérico", () => {
    const r = describeAuditEntry({ ...base, action: "update", resource: "site", record_label: null, details: null });
    expect(r.text).toBe("Editó la configuración del sitio");
  });

  it("cambio de permiso", () => {
    const r = describeAuditEntry({
      ...base, action: "update", resource: "admins", record_label: "Juan Pérez",
      details: { kind: "permission", perm_resource: "subscribers", old_level: "none", new_level: "view" },
    });
    expect(r.text).toBe("Cambió permisos de «Juan Pérez»: Suscriptores → Ver");
    expect(r.icon).toBe("lucide:shield");
  });

  it("alta de usuario del CMS", () => {
    const r = describeAuditEntry({
      ...base, action: "create", resource: "admins", record_label: "juan@mail.com",
      details: { kind: "admin_user", role: "editor" },
    });
    expect(r.text).toBe("Agregó al usuario «juan@mail.com» (Editor)");
  });

  it("baja de usuario del CMS", () => {
    const r = describeAuditEntry({
      ...base, action: "delete", resource: "admins", record_label: "juan@mail.com",
      details: { kind: "admin_user", role: "editor" },
    });
    expect(r.text).toBe("Quitó al usuario «juan@mail.com»");
  });

  it("recurso desconocido no rompe", () => {
    const r = describeAuditEntry({ ...base, action: "create", resource: "weird", record_label: "X", details: null });
    expect(r.text).toContain("«X»");
    expect(typeof r.icon).toBe("string");
  });
});
