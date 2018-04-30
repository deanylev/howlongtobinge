import Component from '@ember/component';
import config from '../../config/environment';

const socket = io(config.APP.SOCKET_HOST);

export default Component.extend({
  socketConnected: false,
  socketDisconnected: Ember.computed.not('socketConnected'),
  isSearching: false,
  search: '',
  searchResults: [],
  filteredResults: Ember.computed('searchResults', 'selectedMovies', function() {
    return this.get('searchResults').filter((result) => !this.get('selectedMovies').find((movie) => movie.imdbID === result.imdbID))
  }),
  isResults: Ember.computed('searchResults', 'filteredResults', function() {
    return this.get('searchResults').length && this.get('filteredResults').length;
  }),
  noResults: Ember.computed.not('isResults'),
  selectedMovies: [],
  totalRuntime: Ember.computed('selectedMovies', function() {
    return this.get('selectedMovies').map((movie) => parseInt(movie.Runtime.slice(0, -4))).reduce((a, b) => a + b);
  }),

  init() {
    this._super(...arguments);

    socket.on('connect', () => this.set('socketConnected', true));
    socket.on('disconnect', () => this.set('socketConnected', false));
  },

  actions: {
    search() {
      return new Promise((resolve, reject) => {
        this.set('searchText', '');
        if (this.get('search').trim()) {
          socket.emit('search', this.get('search'));
          socket.once('searchResults', (results) => {
            this.set('isSearching', true);
            this.set('searchResults', results);
            resolve();
          });
        } else {
          resolve();
        }
      });
    },

    selectMovie(movie) {
      let selected = [...this.get('selectedMovies')];
      selected.push(movie);
      this.set('selectedMovies', selected);
    },

    deselectMovie(movie) {
      let selected = this.get('selectedMovies').filter((selectedMovie) => selectedMovie.imdbID !== movie.imdbID);
      this.set('selectedMovies', selected);
    },

    closeSearch() {
      this.set('isSearching', false);
      this.set('searchResults', []);
    }
  }
});
