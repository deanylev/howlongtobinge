const request = require('request');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8080;
const { OMDB_API_KEY } = process.env;

http.listen(PORT, () => {
  console.log('started server on port', PORT);
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', (req, res) => {
  res.render('pages/index');
});

io.on('connect', (socket) => {
  let selectedMovies = [];

  socket.on('search', (query) => {
    request(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&type=movie&s=${encodeURIComponent(query)}`, (error, response, body) => {
      try {
        let info = JSON.parse(body);
        if (info.Response) {
          let results = info.Search.filter((movie, index) => index <= 4 && movie.imdbID && movie.Poster.startsWith('http') && !selectedMovies.find((selectedMovie) => selectedMovie.imdbID === movie.imdbID));
          socket.emit('searchResults', results);
        } else {
          socket.emit('searchResults', []);
        }
      } catch (err) {
        socket.emit('searchResults', []);
      }
    });
  });

  socket.on('selectMovie', (id) => {
    request(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${id}`, (error, response, body) => {
      let result = JSON.parse(body);
      if (result.Response && !selectedMovies.find((movie) => movie.imdbID === id)) {
        selectedMovies.push(result)
        socket.emit('selectedMovies', selectedMovies);
      }
    });
  });

  socket.on('deselectMovie', (id) => {
    selectedMovies = selectedMovies.filter((movie) => movie.imdbID !== id);
    socket.emit('selectedMovies', selectedMovies);
  });
});
