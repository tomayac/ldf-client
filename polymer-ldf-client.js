Polymer({
  /**
   * The `author` attribute sets an initial author
   *
   * @attribute author
   * @type string
   * @default 'Dimitri Glazkov'
   */
  author: 'Dimitri Glazkov',

  /**
   * `fancy` is a property that does something fancy.
   *
   * @property fancy
   * @type bool
   * @default false
   */
  fancy: false,

  ready: function() {
    // Ready is a lifecycle callback.
    // You can do setup work in here.
    // More info: http://www.polymer-project.org/docs/polymer/polymer.html#lifecyclemethods
  },

  /**
   * The `sayHello` method will return a greeting.
   *
   * @method sayHello
   * @param {String} greeting Pass in a specific greeting.
   * @return {String} Returns a string greeting.
   */
  sayHello: function(greeting) {
    var response = greeting || 'Hello World!';
    return 'seed-element says, ' + response;
  },

  /**
   * The `seed-element-lasers-success` event is fired whenever we
   * call fireLasers.
   *
   * @event seed-element-lasers-success
   * @param {Object} detail
   *   @param {string} detail.sound An amazing sound.
   */

  /**
   * The `fireLasers` method will fire the lasers. At least
   * it will dispatch an event that claims lasers were fired :)
   *
   * @method fireLasers
   */
  fireLasers: function() {
    this.fire('seed-element-lasers-success', { sound: 'Pew pew pew!' });
  }

});