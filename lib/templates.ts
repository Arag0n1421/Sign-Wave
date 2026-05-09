import aslTemplates from "../public/asl_templates.json";
import type { SignTemplate } from "./types";

export const DEFAULT_ASL_TEMPLATES = aslTemplates as SignTemplate[];

export function getDemoGlosses() {
  return DEFAULT_ASL_TEMPLATES.map((template) => ({
    gloss: template.gloss,
    label: template.label,
    tags: template.tags
  }));
}
