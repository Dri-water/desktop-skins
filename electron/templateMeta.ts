export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
};

/** Keep in sync with `src/templates/templateRegistry.ts` ids. */
export const TEMPLATE_META: TemplateMeta[] = [
  {
    id: 'modern-center-clock',
    name: 'Modern Center Clock',
    description:
      'A minimal glass card with a large centered digital clock and date — calm and readable.',
  },
];
