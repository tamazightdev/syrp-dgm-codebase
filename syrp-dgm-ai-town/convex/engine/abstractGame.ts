import { v } from 'convex/values';
import { Doc, Id } from '../_generated/dataModel';
import { DatabaseReader, DatabaseWriter } from '../_generated/server';
import { Engine } from './schema';

export const TICK = 16;
export const STEP_INTERVAL = 1000;

export type GameId<T> = Id<T> & { readonly __tableName: T };

export abstract class AbstractGame<T> {
  engine: Engine;
  engineId: Id<'engines'>;

  constructor(engine: Engine, engineId: Id<'engines'>) {
    this.engine = engine;
    this.engineId = engineId;
  }

  abstract tick(
    db: DatabaseWriter,
    inputs: { name: string; args: any }[],
  ): Promise<{ outputs?: any[]; debugOutput?: string }>;

  abstract load(db: DatabaseReader): Promise<T>;
  abstract save(db: DatabaseWriter, world: T): Promise<void>;

  // Input validation schema - override in concrete implementations
  static inputValidators: Record<string, any> = {};

  // Validate input against schema
  validateInput(name: string, args: any): boolean {
    const validator = (this.constructor as any).inputValidators[name];
    if (!validator) {
      console.warn(`No validator found for input: ${name}`);
      return false;
    }
    try {
      validator.parse(args);
      return true;
    } catch (error) {
      console.error(`Input validation failed for ${name}:`, error);
      return false;
    }
  }

  // Process a single input with error handling
  async processInput(
    db: DatabaseWriter,
    world: T,
    input: { name: string; args: any },
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      if (!this.validateInput(input.name, input.args)) {
        return { success: false, error: 'Input validation failed' };
      }

      const result = await this.handleInput(db, world, input.name, input.args);
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing input ${input.name}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Abstract method for handling specific inputs - implement in concrete classes
  abstract handleInput(db: DatabaseWriter, world: T, name: string, args: any): Promise<any>;

  // Get current simulation time
  now(): number {
    return this.engine.currentTime || 0;
  }

  // Check if enough time has passed for next step
  shouldStep(): boolean {
    const now = Date.now();
    const lastStep = this.engine.lastStepTs || 0;
    return now - lastStep >= STEP_INTERVAL;
  }

  // Update engine timing
  updateTiming(db: DatabaseWriter): Promise<void> {
    const now = Date.now();
    return db.patch(this.engineId, {
      lastStepTs: now,
      currentTime: this.now() + TICK,
    });
  }

  // Stop the engine
  async stop(db: DatabaseWriter): Promise<void> {
    await db.patch(this.engineId, { running: false });
  }

  // Start the engine
  async start(db: DatabaseWriter): Promise<void> {
    await db.patch(this.engineId, { running: true });
  }

  // Check if engine is running
  isRunning(): boolean {
    return this.engine.running;
  }

  // Get next generation number
  nextGeneration(): number {
    return this.engine.generationNumber + 1;
  }

  // Update generation number
  async incrementGeneration(db: DatabaseWriter): Promise<void> {
    await db.patch(this.engineId, {
      generationNumber: this.nextGeneration(),
    });
  }
}

// Helper function to create input validators
export function createInputValidator(schema: any) {
  return v.object(schema);
}

// Base input types that all games should support
export const baseInputs = {
  stop: createInputValidator({}),
  start: createInputValidator({}),
  restart: createInputValidator({}),
};

export { AbstractGame }