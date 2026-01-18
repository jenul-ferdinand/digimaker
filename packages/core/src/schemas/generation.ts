import { z } from 'zod';

export const GenerateOptionsSchema = z.object({
  outputDir: z.string().optional(),
  filename: z.string().optional(),
});

export interface GenerateOptions extends z.infer<typeof GenerateOptionsSchema> {};