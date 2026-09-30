/**
 * A aparência dos campos dos formulários do site: contato, candidatura e a
 * newsletter do diário.
 *
 * Classe sobre o `Input` do registry, e não variante nova nele: o
 * `components/ui/` é do shadcn e o próximo `shadcn add input` desfaria a
 * mudança. A régua é a do site no ar, 48px de altura, que passa com folga dos
 * 44px de alvo de toque.
 */
export const FIELD =
  'h-12 rounded-xl border-foreground/20 bg-background px-4 text-body placeholder:text-foreground/50 focus-visible:border-foreground/50 focus-visible:ring-2 focus-visible:ring-ring/25'

/** O rótulo acima de cada campo. */
export const LABEL = 'text-small font-medium text-foreground'
