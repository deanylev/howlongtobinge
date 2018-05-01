const request = require('request');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8080;
const RESULTS_LIMIT = process.env.RESULTS_LIMIT || 10;
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
  socket.on('search', (query) => {
    request(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&type=movie&s=${encodeURIComponent(query)}`, (error, response, body) => {
      try {
        let info = JSON.parse(body);
        if (info.Response) {
          let fullResults = [];
          let results = info.Search.filter((movie, index) => movie.imdbID && movie.Poster.startsWith('http'));
          let index = 0;
          let getFullResult = () => {
            let result = results.shift();
            index++;
            request(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${result.imdbID}`, (error, response, body) => {
              result = JSON.parse(body);
              if (result.Response) {
                fullResults.push({
                  imdbID: result.imdbID,
                  title: result.Title,
                  year: result.Year,
                  runtime: result.Runtime,
                  poster: result.Poster
                });
              }
              if (results.length && index < RESULTS_LIMIT) {
                getFullResult();
              } else {
                socket.emit('searchResults', fullResults);
              }
            });
          };
          getFullResult();
        } else {
          socket.emit('searchResults', []);
        }
      } catch (err) {
        socket.emit('searchResults', []);
      }
    });
  });
});
