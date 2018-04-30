import Component from '@ember/component';
import config from '../../config/environment';

const socket = io(config.APP.SOCKET_HOST);

export default Component.extend({
  socketConnected: false,
  socketDisconnected: Ember.computed.not('socketConnected'),
  isSearching: false,
  search: '',
  disableSearch: Ember.computed('search', 'socketDisconnected', function() {
    return !this.get('search').trim() || this.get('search').length < 4 || this.get('socketDisconnected');
  }),
  searchResults: [],
  filteredResults: Ember.computed('searchResults', 'selectedMovies', function() {
    return this.get('searchResults').filter((result) => !this.get('selectedMovies').find((movie) => movie.imdbID === result.imdbID))
  }),
  isResults: Ember.computed('searchResults', 'filteredResults', function() {
    return this.get('searchResults').length && this.get('filteredResults').length;
  }),
  noResults: Ember.computed.not('isResults'),
  selectedMovies: [],
  runtimeDisplay: localStorage.getItem('runtimeDisplay'),
  totalRuntime: Ember.computed('selectedMovies', 'runtimeDisplay', function() {
    let total = this.get('selectedMovies').map((movie) => parseInt(movie.Runtime.slice(0, -4))).reduce((a, b) => a + b);
    if (this.get('runtimeDisplay') === 'hours') {
      let hours = Math.floor(total / 60);
      let minutes = total % 60;
      return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
    } else {
      return `${total} minutes`;
    }
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
        socket.emit('search', this.get('search'));
        socket.once('searchResults', (results) => {
          this.set('isSearching', true);
          this.set('searchResults', results);
          resolve();
        });
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
    },

    changeRuntimeDisplay() {
      let display = this.get('runtimeDisplay') === 'hours' ? 'minutes' : 'hours';
      this.set('runtimeDisplay', display);
      localStorage.setItem('runtimeDisplay', display);
    }
  }
});
