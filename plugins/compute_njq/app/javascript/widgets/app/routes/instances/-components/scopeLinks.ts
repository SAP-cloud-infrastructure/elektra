// Derives the domain/project URL prefix from the widget's basepath so the create
// form can link to sibling plugins (networking, compute keypairs). The basepath
// is the compute_njq mount point, e.g. "/monsoon3/cc-demo/compute-njq"; stripping
// the trailing "/compute-njq" segment yields the shared "/monsoon3/cc-demo" scope
// prefix other plugins mount under.
export function scopePrefix(basepath: string): string {
  return basepath.replace(/\/compute-njq\/?$/, "")
}
