import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { Game } from './game';
import { World } from './world';
import { internal } from '../_generated/api';

// Main game loop - called by Convex scheduler
export const tick = mutation({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, { engineId }) => {
    // Get engine state
    const engine = await ctx.db.get(engineId);
    if (!engine) {
      throw new Error(`Engine ${engineId} not found`);
    }

    // Skip if engine is not running
    if (!engine.running) {
      return { skipped: true, reason: 'Engine not running' };
    }

    // Get unprocessed inputs
    const lastProcessed = engine.processedInputNumber || -1;
    const inputs = await ctx.db
      .query('inputs')
      .withIndex('byInputNumber', (q) => q.eq('engineId', engineId).gt('number', lastProcessed))
      .order('asc')
      .take(100); // Process up to 100 inputs per tick

    // Get world for this engine
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId')
      .filter((q) => q.eq(q.field('engineId'), engineId))
      .first();

    if (!worldStatus) {
      throw new Error(`No world found for engine ${engineId}`);
    }

    const worldDoc = await ctx.db.get(worldStatus.worldId);
    if (!worldDoc) {
      throw new Error(`World ${worldStatus.worldId} not found`);
    }

    // Create game instance
    const world = new World(worldDoc);
    const game = new Game(engine, engineId, world);

    // Process inputs and run simulation
    const inputData = inputs.map((input) => ({
      name: input.name,
      args: input.args,
    }));

    const result = await game.tick(ctx.db, inputData);

    // Mark inputs as processed
    if (inputs.length > 0) {
      const lastInput = inputs[inputs.length - 1];
      await ctx.db.patch(engineId, {
        processedInputNumber: lastInput.number,
      });

      // Update input return values
      for (const input of inputs) {
        await ctx.db.patch(input._id, {
          returnValue: {
            kind: 'ok' as const,
            value: result.outputs || null,
          },
        });
      }
    }

    // Schedule next tick if engine is still running
    const updatedEngine = await ctx.db.get(engineId);
    if (updatedEngine?.running) {
      await ctx.scheduler.runAfter(16, internal.aiTown.main.tick, { engineId });
    }

    return {
      processed: inputs.length,
      outputs: result.outputs,
      debug: result.debugOutput,
    };
  },
});

// Start the game engine
export const start = mutation({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, { engineId }) => {
    const engine = await ctx.db.get(engineId);
    if (!engine) {
      throw new Error(`Engine ${engineId} not found`);
    }

    await ctx.db.patch(engineId, { running: true });

    // Schedule first tick
    await ctx.scheduler.runAfter(0, internal.aiTown.main.tick, { engineId });

    return { started: true };
  },
});

// Stop the game engine
export const stop = mutation({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, { engineId }) => {
    const engine = await ctx.db.get(engineId);
    if (!engine) {
      throw new Error(`Engine ${engineId} not found`);
    }

    await ctx.db.patch(engineId, { running: false });

    return { stopped: true };
  },
});

// Get engine status
export const status = query({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, { engineId }) => {
    const engine = await ctx.db.get(engineId);
    if (!engine) {
      return null;
    }

    const pendingInputs = await ctx.db
      .query('inputs')
      .withIndex('byInputNumber', (q) =>
        q.eq('engineId', engineId).gt('number', engine.processedInputNumber || -1),
      )
      .collect();

    return {
      running: engine.running,
      currentTime: engine.currentTime,
      lastStepTs: engine.lastStepTs,
      generationNumber: engine.generationNumber,
      pendingInputs: pendingInputs.length,
    };
  },
});

// Initialize a new world and engine
export const init = mutation({
  args: {
    worldId: v.optional(v.id('worlds')),
  },
  handler: async (ctx, { worldId }) => {
    // Create engine
    const engineId = await ctx.db.insert('engines', {
      running: false,
      generationNumber: 0,
      currentTime: 0,
    });

    // Create or get world
    let actualWorldId = worldId;
    if (!actualWorldId) {
      actualWorldId = await ctx.db.insert('worlds', {
        nextId: 0,
        lastViewed: Date.now(),
      });
    }

    // Create world status
    await ctx.db.insert('worldStatus', {
      worldId: actualWorldId,
      isDefault: !worldId, // Mark as default if we created it
      engineId,
      lastViewed: Date.now(),
      status: 'inactive',
    });

    return {
      engineId,
      worldId: actualWorldId,
    };
  },
});

// Reset world state
export const restart = mutation({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, { engineId }) => {
    const engine = await ctx.db.get(engineId);
    if (!engine) {
      throw new Error(`Engine ${engineId} not found`);
    }

    // Stop engine first
    await ctx.db.patch(engineId, { running: false });

    // Get world
    const worldStatus = await ctx.db
      .query('worldStatus')
      .withIndex('worldId')
      .filter((q) => q.eq(q.field('engineId'), engineId))
      .first();

    if (!worldStatus) {
      throw new Error(`No world found for engine ${engineId}`);
    }

    const worldDoc = await ctx.db.get(worldStatus.worldId);
    if (!worldDoc) {
      throw new Error(`World ${worldStatus.worldId} not found`);
    }

    // Reset world
    const world = new World(worldDoc);
    await world.restart(ctx.db);

    // Reset engine
    await ctx.db.patch(engineId, {
      currentTime: 0,
      lastStepTs: undefined,
      processedInputNumber: undefined,
      generationNumber: engine.generationNumber + 1,
    });

    return { restarted: true };
  },
});