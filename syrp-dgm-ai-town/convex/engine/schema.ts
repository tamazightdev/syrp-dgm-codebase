import { defineTable } from 'convex/server';
import { Infer, v } from 'convex/values';

const input = v.object({
  engineId: v.id('engines'),
  number: v.number(),
  name: v.string(),
  args: v.any(),
  returnValue: v.optional(
    v.union(
      v.object({
        kind: v.literal('ok'),
        value: v.any(),
      }),
      v.object({
        kind: v.literal('error'),
        message: v.string(),
      }),
    ),
  ),
  received: v.number(),
});

export const engine = v.object({
  currentTime: v.optional(v.number()),
  lastStepTs: v.optional(v.number()),
  processedInputNumber: v.optional(v.number()),
  running: v.boolean(),
  generationNumber: v.number(),
});
export type Engine = Infer<typeof engine>;

export const engineTables = {
  inputs: defineTable(input).index('byInputNumber', ['engineId', 'number']),
  engines: defineTable(engine),
};