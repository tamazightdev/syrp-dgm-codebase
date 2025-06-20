import { v } from 'convex/values';
import { defineTable } from 'convex/server';
import { serializedPlayer } from './player';
import { serializedPlayerDescription } from './playerDescription';
import { serializedAgent } from './agent';
import { serializedAgentDescription } from './agentDescription';
import { serializedWorld } from './world';
import { serializedWorldMap } from './worldMap';
import { serializedConversation } from './conversation';
import { conversationId, playerId } from './ids';

export const aiTownTables = {
  worlds: defineTable({ ...serializedWorld }),
  worldStatus: defineTable({
    worldId: v.id('worlds'),
    isDefault: v.boolean(),
    engineId: v.id('engines'),
    lastViewed: v.number(),
    status: v.union(v.literal('running'), v.literal('stoppedByDeveloper'), v.literal('inactive')),
  }).index('worldId', ['worldId']),
  maps: defineTable({
    worldId: v.id('worlds'),
    ...serializedWorldMap,
  }).index('worldId', ['worldId']),
  playerDescriptions: defineTable({
    worldId: v.id('worlds'),
    ...serializedPlayerDescription,
  }).index('worldId', ['worldId', 'playerId']),
  agentDescriptions: defineTable({
    worldId: v.id('worlds'),
    ...serializedAgentDescription,
  }).index('worldId', ['worldId', 'agentId']),
  archivedPlayers: defineTable({ worldId: v.id('worlds'), ...serializedPlayer }).index('worldId', [
    'worldId',
    'id',
  ]),
  archivedConversations: defineTable({
    worldId: v.id('worlds'),
    id: conversationId,
    creator: playerId,
    created: v.number(),
    ended: v.number(),
    lastMessage: serializedConversation.lastMessage,
    numMessages: serializedConversation.numMessages,
    participants: v.array(playerId),
  }).index('worldId', ['worldId', 'id']),
  archivedAgents: defineTable({ worldId: v.id('worlds'), ...serializedAgent }).index('worldId', [
    'worldId',
    'id',
  ]),
  participatedTogether: defineTable({
    worldId: v.id('worlds'),
    conversationId,
    player1: playerId,
    player2: playerId,
    ended: v.number(),
  })
    .index('edge', ['worldId', 'player1', 'player2', 'ended'])
    .index('conversation', ['worldId', 'player1', 'conversationId'])
    .index('playerHistory', ['worldId', 'player1', 'ended']),
};