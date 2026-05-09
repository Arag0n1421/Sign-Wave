import aslTemplates from "../public/asl_templates.json";
import type { SignTemplate } from "./types";

export const DEFAULT_ASL_TEMPLATES = aslTemplates as SignTemplate[];
export const ASL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const LOCAL_TEMPLATE_STORAGE_KEY = "sign-wave-asl-letter-templates-v1";

export function getDemoGlosses() {
  return DEFAULT_ASL_TEMPLATES.map((template) => ({
    gloss: template.gloss,
    label: template.label,
    tags: template.tags
  }));
}

export function mergeTemplates(baseTemplates: SignTemplate[], localTemplates: SignTemplate[]) {
  const byGloss = new Map(baseTemplates.map((template) => [template.gloss, template]));

  for (const localTemplate of localTemplates) {
    const base = byGloss.get(localTemplate.gloss);
    byGloss.set(localTemplate.gloss, {
      ...(base ?? localTemplate),
      ...localTemplate,
      examples: [...(base?.examples ?? []), ...localTemplate.examples]
    });
  }

  return Array.from(byGloss.values());
}

export function createLetterTemplate(gloss: string, examples: number[][][]): SignTemplate {
  return {
    id: `local-asl-letter-${gloss.toLowerCase()}`,
    gloss,
    label: `Letter ${gloss}`,
    tags: ["asl", "alphabet", "local-recording"],
    examples
  };
}
