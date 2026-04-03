import type { ComponentType } from 'react';
import { ModernCenterClock } from './modernCenterClock/ModernCenterClock';

export type TemplateDefinition = {
  id: string;
  component: ComponentType;
};

/** Single place to register template components (ids must match `electron/templateMeta.ts`). */
export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  { id: 'modern-center-clock', component: ModernCenterClock },
];

export function getTemplateById(
  id: string | null,
): ComponentType | null {
  if (!id) return null;
  const hit = TEMPLATE_REGISTRY.find((t) => t.id === id);
  return hit?.component ?? null;
}
