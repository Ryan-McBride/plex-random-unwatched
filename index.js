const PlexAPI = require('plex-api');
const express = require('express');
const authObj = require('./env.json');

const app = express();
const port = 8000;

const client = new PlexAPI(authObj);
/* eslint-disable no-underscore-dangle */
app.get('/', (req, res) => {
  client.query('/library/sections/1/all')
    .then((resp) => resp.MediaContainer.Metadata)
    .then((allMovies) => {
      const unwatched = allMovies.filter((movie) => !movie.viewCount);
      res.send(unwatched[Math.floor(Math.random() * unwatched.length)]);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.listen(port, () => {
  console.log('randomizer is listening');
});
