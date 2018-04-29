import Component from '@ember/component';
import config from '../../config/environment';

const socket = io(config.APP.SOCKET_HOST);

export default Component.extend({
  search: '',
  searching: false,
  searchResults: [],
  selectedMovies: [],
  searchDidChange: Ember.observer('search', function() {
    socket.emit('search', this.get('search'));
  }),
  totalRuntime: Ember.computed('selectedMovies', function() {
    return this.get('selectedMovies').map((movie) => parseInt(movie.Runtime.slice(0, -4))).reduce((a, b) => a + b);
  }),

  init() {
    this._super(...arguments);

    socket.on('searchResults', (results) => {
      this.set('searchResults', results);
    });

    socket.on('selectedMovies', (movies) => {
      this.set('selectedMovies', movies);
    });
  },

  didInsertElement() {
    Ember.$('#search').focus(() => this.set('searching', true));
    Ember.$('#search').blur(() => setTimeout(() => this.set('searching', false), 500));
  },

  actions: {
    selectMovie(id) {
      socket.emit('selectMovie', id);
    },

    deselectMovie(id) {
      socket.emit('deselectMovie', id);
    }
  }
});
