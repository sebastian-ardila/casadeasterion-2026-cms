// Shared font catalog used by every CMS dropdown that lets editors
// pick a typeface. The shape (value/label/hint/fontFamily) is the one
// Dropdown.astro understands and renders with a live preview.
//
// Keep in sync with HERO_CARD_FONTS in
// apps/web/src/lib/hero-card.ts and with the Google Fonts <link> in
// both src/layouts/AppLayout.astro (CMS) and apps/web/src/layouts/
// Layout.astro (public). Adding an entry here without registering it
// in those three places will render correctly in the CMS preview but
// fall back to a system font on the live site.

export type FontOption = {
  value: string;
  label: string;
  hint: string;
  fontFamily: string;
};

export const FONT_OPTIONS: FontOption[] = [
  // --- Serifs (editorial) ---
  { value: "serif",             label: "Cormorant Garamond", hint: "Serif editorial clásica",                  fontFamily: '"Cormorant Garamond", Georgia, serif' },
  { value: "eb-garamond",       label: "EB Garamond",        hint: "Serif clásica de transición",              fontFamily: '"EB Garamond", Georgia, serif' },
  { value: "goudy",             label: "Goudy",              hint: "Serif clásica con calidez tipográfica",    fontFamily: '"Sorts Mill Goudy", "EB Garamond", Georgia, serif' },
  { value: "playfair",          label: "Playfair Display",   hint: "Serif con contraste",                      fontFamily: '"Playfair Display", Georgia, serif' },
  { value: "lora",              label: "Lora",               hint: "Serif suave para lectura",                 fontFamily: '"Lora", Georgia, serif' },
  { value: "libre-baskerville", label: "Libre Baskerville",  hint: "Serif clásica para texto",                 fontFamily: '"Libre Baskerville", Georgia, serif' },
  { value: "crimson",           label: "Crimson Pro",        hint: "Serif humanista",                          fontFamily: '"Crimson Pro", Georgia, serif' },
  { value: "fraunces",          label: "Fraunces",           hint: "Serif moderna expresiva",                  fontFamily: '"Fraunces", Georgia, serif' },
  { value: "spectral",          label: "Spectral",           hint: "Serif transicional clara",                 fontFamily: '"Spectral", Georgia, serif' },
  // --- Sans (modern) ---
  { value: "sans",              label: "Inter",              hint: "Sans-serif neutral",                       fontFamily: '"Inter", system-ui, sans-serif' },
  { value: "dm-sans",           label: "DM Sans",            hint: "Sans geométrica moderna",                  fontFamily: '"DM Sans", "Inter", sans-serif' },
  { value: "space-grotesk",     label: "Space Grotesk",      hint: "Sans-serif técnica",                       fontFamily: '"Space Grotesk", "Inter", sans-serif' },
  { value: "manrope",           label: "Manrope",            hint: "Sans humanista moderna",                   fontFamily: '"Manrope", "Inter", sans-serif' },
  { value: "work-sans",         label: "Work Sans",          hint: "Sans grotesca optimista",                  fontFamily: '"Work Sans", "Inter", sans-serif' },
  { value: "plus-jakarta",      label: "Plus Jakarta Sans",  hint: "Sans contemporánea suave",                 fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' },
  { value: "outfit",            label: "Outfit",             hint: "Sans geométrica refinada",                 fontFamily: '"Outfit", "Inter", sans-serif' },
  // --- Display ---
  { value: "marcellus",         label: "Marcellus",          hint: "Display estilo lapidario",                 fontFamily: '"Marcellus", "Cormorant Garamond", serif' },
];
