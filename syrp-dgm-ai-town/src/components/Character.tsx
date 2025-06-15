import { Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js';

interface CharacterProps {
  id: string;
  name: string;
  position: { x: number; y: number };
  facing: { x: number; y: number };
  status: 'idle' | 'walking' | 'talking' | 'thinking' | 'sleeping';
  trustScore: number;
  emotionalState: {
    happiness: number;
    stress: number;
    energy: number;
    sociability: number;
  };
  onClick?: () => void;
}

interface CharacterUpdateProps {
  position: { x: number; y: number };
  facing: { x: number; y: number };
  status: 'idle' | 'walking' | 'talking' | 'thinking' | 'sleeping';
  trustScore: number;
  emotionalState: {
    happiness: number;
    stress: number;
    energy: number;
    sociability: number;
  };
}

export class Character {
  container: Container;
  private body: Graphics;
  private nameText: Text;
  private statusIndicator: Graphics;
  private trustIndicator: Graphics;
  private emotionIndicator: Graphics;
  private selectionRing: Graphics;
  private props: CharacterProps;
  private isSelected: boolean = false;

  constructor(props: CharacterProps) {
    this.props = props;
    this.container = new Container();
    this.container.x = props.position.x;
    this.container.y = props.position.y;

    // Create character body
    this.body = new Graphics();
    this.drawBody();
    this.container.addChild(this.body);

    // Create name text
    this.nameText = new Text(props.name, new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xffffff,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 2,
      dropShadowDistance: 1,
    }));
    this.nameText.anchor.set(0.5, 1);
    this.nameText.y = -35;
    this.container.addChild(this.nameText);

    // Create status indicator
    this.statusIndicator = new Graphics();
    this.drawStatusIndicator();
    this.container.addChild(this.statusIndicator);

    // Create trust indicator
    this.trustIndicator = new Graphics();
    this.drawTrustIndicator();
    this.container.addChild(this.trustIndicator);

    // Create emotion indicator
    this.emotionIndicator = new Graphics();
    this.drawEmotionIndicator();
    this.container.addChild(this.emotionIndicator);

    // Create selection ring
    this.selectionRing = new Graphics();
    this.drawSelectionRing();
    this.selectionRing.visible = false;
    this.container.addChild(this.selectionRing);

    // Make interactive
    this.container.interactive = true;
    this.container.buttonMode = true;
    this.container.on('pointerdown', () => {
      this.props.onClick?.();
      this.setSelected(true);
    });

    // Add hover effects
    this.container.on('pointerover', () => {
      this.body.tint = 0xcccccc;
    });

    this.container.on('pointerout', () => {
      this.body.tint = 0xffffff;
    });
  }

  update(newProps: CharacterUpdateProps) {
    // Update position
    this.container.x = newProps.position.x;
    this.container.y = newProps.position.y;

    // Update facing direction
    const angle = Math.atan2(newProps.facing.y, newProps.facing.x);
    this.body.rotation = angle + Math.PI / 2; // Adjust for sprite orientation

    // Update status
    this.props.status = newProps.status;
    this.drawStatusIndicator();

    // Update trust score
    this.props.trustScore = newProps.trustScore;
    this.drawTrustIndicator();

    // Update emotional state
    this.props.emotionalState = newProps.emotionalState;
    this.drawEmotionIndicator();
    this.drawBody(); // Redraw body with emotion-based color
  }

  setSelected(selected: boolean) {
    this.isSelected = selected;
    this.selectionRing.visible = selected;
  }

  private drawBody() {
    this.body.clear();
    
    // Get color based on emotional state
    const color = this.getEmotionColor();
    
    // Draw character body (simple circle for now)
    this.body.beginFill(color);
    this.body.lineStyle(2, 0x333333);
    this.body.drawCircle(0, 0, 15);
    this.body.endFill();

    // Draw eyes
    this.body.beginFill(0x000000);
    this.body.drawCircle(-5, -5, 2);
    this.body.drawCircle(5, -5, 2);
    this.body.endFill();

    // Draw mouth based on happiness
    this.body.lineStyle(2, 0x000000);
    const happiness = this.props.emotionalState.happiness;
    if (happiness > 60) {
      // Happy - smile
      this.body.arc(0, 2, 6, 0, Math.PI);
    } else if (happiness < 40) {
      // Sad - frown
      this.body.arc(0, 8, 6, Math.PI, 0);
    } else {
      // Neutral - straight line
      this.body.moveTo(-4, 5);
      this.body.lineTo(4, 5);
    }
  }

  private drawStatusIndicator() {
    this.statusIndicator.clear();
    
    const colors = {
      idle: 0x888888,
      walking: 0x00ff00,
      talking: 0x0088ff,
      thinking: 0xffaa00,
      sleeping: 0x4444ff,
    };

    const color = colors[this.props.status] || 0x888888;
    
    this.statusIndicator.beginFill(color);
    this.statusIndicator.drawCircle(12, -12, 4);
    this.statusIndicator.endFill();
  }

  private drawTrustIndicator() {
    this.trustIndicator.clear();
    
    const trustScore = this.props.trustScore;
    const normalizedTrust = Math.max(0, Math.min(100, trustScore)) / 100;
    
    // Color from red (low trust) to green (high trust)
    const red = Math.floor((1 - normalizedTrust) * 255);
    const green = Math.floor(normalizedTrust * 255);
    const color = (red << 16) | (green << 8) | 0;
    
    // Draw trust bar
    this.trustIndicator.beginFill(0x333333);
    this.trustIndicator.drawRect(-10, 20, 20, 3);
    this.trustIndicator.endFill();
    
    this.trustIndicator.beginFill(color);
    this.trustIndicator.drawRect(-10, 20, 20 * normalizedTrust, 3);
    this.trustIndicator.endFill();
  }

  private drawEmotionIndicator() {
    this.emotionIndicator.clear();
    
    const { happiness, stress, energy } = this.props.emotionalState;
    
    // Draw small emotion indicators
    const indicators = [
      { value: happiness, color: 0xffff00, x: -15, label: 'H' },
      { value: stress, color: 0xff4444, x: -5, label: 'S' },
      { value: energy, color: 0x44ff44, x: 5, label: 'E' },
    ];
    
    indicators.forEach(({ value, color, x }) => {
      const alpha = Math.max(0.3, value / 100);
      this.emotionIndicator.beginFill(color, alpha);
      this.emotionIndicator.drawCircle(x, 25, 3);
      this.emotionIndicator.endFill();
    });
  }

  private drawSelectionRing() {
    this.selectionRing.clear();
    this.selectionRing.lineStyle(3, 0xffff00, 0.8);
    this.selectionRing.drawCircle(0, 0, 25);
  }

  private getEmotionColor(): number {
    const { happiness, stress, energy } = this.props.emotionalState;
    
    // Base color
    let r = 100;
    let g = 150;
    let b = 200;
    
    // Adjust based on emotions
    r += (happiness - 50) * 2; // More red when happy
    g += (energy - 50) * 1.5;  // More green when energetic
    b -= stress * 1.5;         // Less blue when stressed
    
    // Clamp values
    r = Math.max(50, Math.min(255, r));
    g = Math.max(50, Math.min(255, g));
    b = Math.max(50, Math.min(255, b));
    
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}