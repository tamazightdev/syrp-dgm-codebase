import { Viewport } from 'pixi-viewport';

export interface PixiViewportOptions {
  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  interaction?: any;
}

export class PixiViewport extends Viewport {
  constructor(options: PixiViewportOptions) {
    super({
      screenWidth: options.screenWidth,
      screenHeight: options.screenHeight,
      worldWidth: options.worldWidth,
      worldHeight: options.worldHeight,
      interaction: options.interaction,
    });
  }

  // Custom methods for game-specific viewport behavior
  centerOnAgent(position: { x: number; y: number }) {
    this.moveCenter(position.x, position.y);
  }

  followAgent(position: { x: number; y: number }, smooth: boolean = true) {
    if (smooth) {
      this.animate({
        time: 500,
        position: { x: position.x, y: position.y },
        ease: 'easeInOutQuad',
      });
    } else {
      this.moveCenter(position.x, position.y);
    }
  }

  zoomToFitAgents(agents: Array<{ position: { x: number; y: number } }>) {
    if (agents.length === 0) return;

    const positions = agents.map(agent => agent.position);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    const padding = 100;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.fitWorld(true);
    this.moveCenter(centerX, centerY);
  }

  setZoomLimits(minScale: number = 0.1, maxScale: number = 5) {
    this.clampZoom({ minScale, maxScale });
  }

  enableInteraction() {
    this.drag().pinch().wheel().decelerate();
  }

  disableInteraction() {
    this.plugins.remove('drag');
    this.plugins.remove('pinch');
    this.plugins.remove('wheel');
    this.plugins.remove('decelerate');
  }
}