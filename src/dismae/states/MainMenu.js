Dismae.MainMenu = function (game) {
  this.music = null;
  this.playButton = null;
  this.ratio = window.innerHeight / 720;
};

Dismae.MainMenu.prototype = {
  create: function () {
    this.music = this.add.audio('titleMusic');
    this.music.play();

    var title = this.add.sprite(0, 0, 'titlepage');
    title.alpha = 0;
    title.scale.setTo(this.ratio);
    this.add.tween(title).to({alpha: 1}, 2000, Phaser.Easing.Linear.None, true, 0);

    this.playButton = this.add.button(this.ratio * 400, this.ratio * 600, 'playButton', this.startGame, this, 'over', 'out', 'down');
  },

  update: function () {
  },

  startGame: function (pointer) {
    this.music.stop();
    this.state.start('VisualNovelWrapper');
  }
};
