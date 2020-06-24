/* eslint-disable func-names */
/* eslint-disable max-len */
/* eslint-disable no-plusplus */
import * as Phaser from 'phaser';
import './style.css';

let game;

// global game options
const gameOptions = {
  platformStartSpeed: 350,
  spawnRange: [100, 350],
  platformSizeRange: [50, 250],
  playerGravity: 900,
  jumpForce: 400,
  playerStartPosition: 200,
  jumps: 3,
};

window.onload = function () {
  // object containing configuration options
  const gameConfig = {
    type: Phaser.AUTO,
    width: 640,
    height: 480,
    // eslint-disable-next-line no-use-before-define
    scene: playGame,
    backgroundColor: 0x444444,

    // physics settings
    physics: {
      default: 'arcade',
    },
  };
  game = new Phaser.Game(gameConfig);
  window.focus();
  // eslint-disable-next-line no-use-before-define
  resize();
  // eslint-disable-next-line no-use-before-define
  window.addEventListener('resize', resize, false);
};

// playGame scene
class playGame extends Phaser.Scene {
  constructor() {
    super('PlayGame');
    this.scoreWindow = null;
    this.scoreCounter = 0;
  }

  preload() {
    this.load.image('sky', './assets/images/sky.png');
    this.load.image('platform', './assets/images/platform.png');
    this.load.spritesheet('player_run', './assets/images/Pink_Monster_Run_6.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('player_jump', './assets/images/Pink_Monster_Jump_8.png', { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player_run', { start: 0, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('player_jump', { start: 0, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
    // group with all active platforms.
    this.add.image(game.config.width / 2, game.config.height / 2, 'sky');
    this.platformGroup = this.add.group({

      // once a platform is removed, it's added to the pool
      removeCallback(platform) {
        platform.scene.platformPool.add(platform);
      },
    });

    // pool
    this.platformPool = this.add.group({

      // once a platform is removed from the pool, it's added to the active platforms group
      removeCallback(platform) {
        platform.scene.platformGroup.add(platform);
      },
    });

    // number of consecutive jumps made by the player
    this.playerJumps = 0;
    this.scoreCounter = 0;
    // adding a platform to the game, the arguments are platform width and x position
    this.addPlatform(game.config.width, game.config.width / 2);

    // adding the player;
    this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height / 1.5, 'player_run');
    this.player.setGravityY(gameOptions.playerGravity);

    // setting collisions between the player and the platform group
    this.physics.add.collider(this.player, this.platformGroup);

    // checking for input
    this.input.on('pointerdown', this.jump, this);
    this.score = this.add.text(16, 16, `Score: ${this.scoreCounter}`, { fontSize: '32px', fill: '#000' });
  }

  // the core of the script: platform are added from the pool or created on the fly
  addPlatform(platformWidth, posX) {
    let platform;
    if (this.platformPool.getLength()) {
      platform = this.platformPool.getFirst();
      platform.x = posX;
      platform.active = true;
      platform.visible = true;
      this.platformPool.remove(platform);
    } else {
      platform = this.physics.add.sprite(posX, game.config.height * 0.8, 'platform');
      platform.setImmovable(true);
      platform.setVelocityX(gameOptions.platformStartSpeed * -1);
      this.platformGroup.add(platform);
    }
    platform.displayWidth = platformWidth;
    this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
  }

  // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
  jump() {
    if (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)) {
      if (this.player.body.touching.down) {
        this.playerJumps = 0;
      }
      this.player.setVelocityY(gameOptions.jumpForce * -1);
      this.playerJumps++;
      this.player.anims.play('jump', true);
      this.scoreCounter += 1;
      this.score.setText(`Score: ${this.scoreCounter}`);
    }
  }

  update() {
    // game over
    if (this.player.y > game.config.height) {
      this.scene.start('PlayGame');
    }
    this.player.x = gameOptions.playerStartPosition;
    this.player.anims.play('run', true);

    // recycling platforms
    let minDistance = game.config.width;
    this.platformGroup.getChildren().forEach(function (platform) {
      const platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
      minDistance = Math.min(minDistance, platformDistance);
      if (platform.x < -platform.displayWidth / 2) {
        this.platformGroup.killAndHide(platform);
        this.platformGroup.remove(platform);
      }
    }, this);

    // adding new platforms
    if (minDistance > this.nextPlatformDistance) {
      const nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
      this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2);
    }
  }
}
function resize() {
  const canvas = document.querySelector('canvas');
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const windowRatio = windowWidth / windowHeight;
  const gameRatio = game.config.width / game.config.height;
  if (windowRatio < gameRatio) {
    canvas.style.width = `${windowWidth}px`;
    canvas.style.height = `${windowWidth / gameRatio}px`;
  } else {
    canvas.style.width = `${windowHeight * gameRatio}px`;
    canvas.style.height = `${windowHeight}px`;
  }
}
