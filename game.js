/* global Phaser */
let game;

const gameOptions = {
    rotationSpeed: 3,
    throwSpeed: 150,
    // minumum angle between two knives
    minAngle: 15
};

// pure JavaScript to scale the game
const resize = () => {
    const canvas = document.querySelector("canvas");
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
};

document.addEventListener("DOMContentLoaded", () => {
    const gameConfig = {
        type: Phaser.CANVAS,
        width: 750,
        height: 1334,
        parent: 'container',
        backgroundColor: 0x444444,
        scene: [playGame]
    };

    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
});

// PlayGame scene
class playGame extends Phaser.Scene {
    // constructor
    constructor() {
        console.log(" call playGame constructor");
        super("PlayGame");
    }

    // method to be executed when the scene preloads
    preload() {
        // loading assets
        this.load.image("target", "target.png");
        this.load.image("knife", "knife.png");
    }

    // method to be executed once the scene has been created
    create() {
        // can the player throw a knife? Yes, at the beginnning of the game
        this.canThrow = true;

        // group to store all rotating knives
        this.knifeGroup = this.add.group();

        // adding the knife
        this.knife = this.add.sprite(
            game.config.width / 2,
            (game.config.height / 5) * 4,
            "knife"
        );
        // adding the target
        this.target = this.add.sprite(game.config.width / 2, 400, "target");

        // moving the target on front
        this.target.depth = 1;
        // waiting for player input to throw a knife
        this.input.on("pointerdown", this.throwKnife, this);
    }

    // method to throw a knife
    throwKnife() {
        // can the player throw?
        if (!this.canThrow) return;

        // player can't throw anymore
        this.canThrow = false;

        console.log(`${this.target.y} と ${this.target.width / 2}`);
        // tween to throw the knife
        this.tweens.add({
            // adding the knife to tween targets
            targets: [this.knife],
            // y destination
            y: this.target.y + this.target.width / 2,
            // tween duration
            duration: gameOptions.throwSpeed,
            // callback scope
            callbackScope: this,
            // function to be executed once the tween has been completed
            onComplete: function(tween) {
                // at the moment, this is a legal hit
                let legalHit = true;
                // getting an array with all rotating knives
                const children = this.knifeGroup.getChildren();
                // looping through rotating knives
                for (let i = 0; i < children.length; i += 1) {
                    const child = children[i];
                    // is the knife too close to the i-th knife?
                    console.log(
                        `target angle:  ${
                            this.target.angle
                        }, child.impactAngle: ${child.impactAngle}`
                    );
                    console.log(
                        `${Phaser.Math.Angle.ShortestBetween(
                            this.target.angle,
                            child.impactAngle
                        )}`
                    );
                    if (
                        Math.abs(
                            Phaser.Math.Angle.ShortestBetween(
                                this.target.angle,
                                child.impactAngle
                            )
                        ) < gameOptions.minAngle
                    ) {
                        // this is not a legal hit
                        legalHit = false;
                        // no need to continue with the loop
                        break;
                    }
                }

                // is this a legal hit?
                if (legalHit) {
                    // player can now throw again
                    this.canThrow = true;
                    // adding the rotating knife in the same place of the knife just landed on target
                    const knife = this.add.sprite(
                        this.knife.x,
                        this.knife.y,
                        "knife"
                    );
                    knife.impactAngle = this.target.angle;
                    // adding the rotating knife to knifeGroup group
                    this.knifeGroup.add(knife);
                    // bringing back the knife to its starting position
                    this.knife.y = (game.config.height / 5) * 4;
                } else {
                    // in case this is not a legal hit
                    console.log(" this is not a legal hit!!!");

                    // tween to throw the knife
                    this.tweens.add({
                        // adding the knife to tween targets
                        targets: [this.knife],
                        // y destination
                        y: game.config.height + this.knife.height,
                        // rotation destination in radians
                        rotation: 5,
                        // tween durtion
                        duration: gameOptions.throwSpeed * 4,
                        // callback scope
                        callbackScope: this,
                        // function to be executed once the tween has been completed
                        onComplete: function(tween) {
                            // restarat the game
                            this.scene.start("PlayGame");
                        }
                    });
                }
            }
        });
    }

    // method to be executed at each frame
    update() {
        // rotating the target
        this.target.angle += gameOptions.rotationSpeed;
        // getting an array with all rotating knives
        const children = this.knifeGroup.getChildren();
        // looping through rotating kinives
        children.forEach(child => {
            // rotating the knife
            child.angle += gameOptions.rotationSpeed;
            // turning knife angle in radians
            const radians = Phaser.Math.DegToRad(child.angle + 90);

            // trigonometry to make the knife rotate around target center
            child.x =
                this.target.x + (this.target.width / 2) * Math.cos(radians);
            child.y =
                this.target.y + (this.target.width / 2) * Math.sin(radians);
        });
    }
}
