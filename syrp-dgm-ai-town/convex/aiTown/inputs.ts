import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { playerId, conversationId } from './ids';

// Send an input to the game engine
export const sendInput = mutation({
  args: {
    engineId: v.id('engines'),
    name: v.string(),
    args: v.any(),
  },
  handler: async (ctx, { engineId, name, args }) => {
    // Get next input number
    const lastInput = await ctx.db
      .query('inputs')
      .withIndex('byInputNumber', (q) => q.eq('engineId', engineId))
      .order('desc')
      .first();

    const inputNumber = (lastInput?.number || -1) + 1;

    // Insert input
    const inputId = await ctx.db.insert('inputs', {
      engineId,
      number: inputNumber,
      name,
      args,
      received: Date.now(),
    });

    return { inputId, inputNumber };
  },
});

// Player joins the world
export const join = mutation({
  args: {
    engineId: v.id('engines'),
    name: v.string(),
    character: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'join',
      args: {
        name: args.name,
        character: args.character,
        description: args.description,
      },
    });
  },
});

// Player leaves the world
export const leave = mutation({
  args: {
    engineId: v.id('engines'),
    playerId: playerId,
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'leave',
      args: {
        playerId: args.playerId,
      },
    });
  },
});

// Player sends a message
export const sendMessage = mutation({
  args: {
    engineId: v.id('engines'),
    playerId: playerId,
    text: v.string(),
    messageUuid: v.string(),
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'sendMessage',
      args: {
        playerId: args.playerId,
        text: args.text,
        messageUuid: args.messageUuid,
      },
    });
  },
});

// Player starts a conversation
export const startConversation = mutation({
  args: {
    engineId: v.id('engines'),
    playerId: playerId,
    invitee: playerId,
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'startConversation',
      args: {
        playerId: args.playerId,
        invitee: args.invitee,
      },
    });
  },
});

// Player accepts conversation invite
export const acceptInvite = mutation({
  args: {
    engineId: v.id('engines'),
    playerId: playerId,
    conversationId: conversationId,
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'acceptInvite',
      args: {
        playerId: args.playerId,
        conversationId: args.conversationId,
      },
    });
  },
});

// Player rejects conversation invite
export const rejectInvite = mutation({
  args: {
    engineId: v.id('engines'),
    playerId: playerId,
    conversationId: conversationId,
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'rejectInvite',
      args: {
        playerId: args.playerId,
        conversationId: args.conversationId,
      },
    });
  },
});

// Player leaves conversation
export const leaveConversation = mutation({
  args: {
    engineId: v.id('engines'),
    playerId: playerId,
    conversationId: conversationId,
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'leaveConversation',
      args: {
        playerId: args.playerId,
        conversationId: args.conversationId,
      },
    });
  },
});

// Player finishes speaking
export const finishSpeaking = mutation({
  args: {
    engineId: v.id('engines'),
    playerId: playerId,
    conversationId: conversationId,
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'finishSpeaking',
      args: {
        playerId: args.playerId,
        conversationId: args.conversationId,
      },
    });
  },
});

// Player walks to a destination
export const walkTo = mutation({
  args: {
    engineId: v.id('engines'),
    playerId: playerId,
    destination: v.object({
      x: v.number(),
      y: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'walkTo',
      args: {
        playerId: args.playerId,
        destination: args.destination,
      },
    });
  },
});

// Agent sends a message
export const agentSendMessage = mutation({
  args: {
    engineId: v.id('engines'),
    agentId: playerId,
    text: v.string(),
    messageUuid: v.string(),
    leaveConversation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'agentSendMessage',
      args: {
        agentId: args.agentId,
        text: args.text,
        messageUuid: args.messageUuid,
        leaveConversation: args.leaveConversation,
      },
    });
  },
});

// Wake up an agent
export const agentWakeUp = mutation({
  args: {
    engineId: v.id('engines'),
    agentId: playerId,
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'agentWakeUp',
      args: {
        agentId: args.agentId,
      },
    });
  },
});

// Stop the engine
export const stop = mutation({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'stop',
      args: {},
    });
  },
});

// Start the engine
export const start = mutation({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'start',
      args: {},
    });
  },
});

// Restart the engine
export const restart = mutation({
  args: {
    engineId: v.id('engines'),
  },
  handler: async (ctx, args) => {
    return await sendInput(ctx, {
      engineId: args.engineId,
      name: 'restart',
      args: {},
    });
  },
});

// Get input status
export const getInputStatus = mutation({
  args: {
    inputId: v.id('inputs'),
  },
  handler: async (ctx, { inputId }) => {
    const input = await ctx.db.get(inputId);
    if (!input) {
      return null;
    }

    return {
      processed: input.returnValue !== undefined,
      success: input.returnValue?.kind === 'ok',
      result: input.returnValue?.kind === 'ok' ? input.returnValue.value : undefined,
      error: input.returnValue?.kind === 'error' ? input.returnValue.message : undefined,
    };
  },
});