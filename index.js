const PlexAPI = require('plex-api');
const express = require('express');
const fs = require('fs');
const authObj = require('./env.json');

const app = express();
const port = 8000;

const client = new PlexAPI(authObj);
/* eslint-disable no-underscore-dangle */

const getGuid = (url) => url.replace('com.plexapp.agents.imdb://', '').replace(/\?lang.*/g, '');

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

app.get('/diff', (req, res) => {
  const newMovies = {};
  const newShows = {};
  const newEpisodes = {};
  const newSnap = [{}, {}];
  const snapshotExists = fs.existsSync('./snapshot.json');
  const snapshot = snapshotExists ? JSON.parse(fs.readFileSync('./snapshot.json', 'utf8')) : [{}, {}];
  const moviesSnap = snapshot[0];
  const showsSnap = snapshot[1];

  client.query('/library/sections/1/all')
    .then((resp) => {
      resp.MediaContainer.Metadata.forEach((item) => {
        const {
          guid, title, year, art,
        } = item;
        const cleanGuid = getGuid(guid);
        const snapData = {
          guid: cleanGuid,
          title,
          year,
          art,
        };
        newSnap[0][cleanGuid] = snapData;
        if (!moviesSnap[cleanGuid]) {
          newMovies[cleanGuid] = snapData;
        }
      });
      console.log(`New Movies:\t${Object.keys(newMovies).length}`);
    })
    .then(() => client.query('/library/sections/2/all'))
    .then((resp) => {
      resp.MediaContainer.Metadata.forEach((item) => {
        const {
          guid, title, year, art, leafCount,
        } = item;
        const cleanGuid = getGuid(guid);
        const snapData = {
          guid: cleanGuid,
          title,
          year,
          art,
          leafCount,
        };
        newSnap[1][cleanGuid] = snapData;
        if (!showsSnap[cleanGuid]) {
          newShows[cleanGuid] = snapData;
        } else if (showsSnap[cleanGuid].leafCount !== leafCount) {
          newEpisodes[cleanGuid] = snapData;
        }
      });
      console.log(`New Shows:\t${Object.keys(newShows).length}`);
      console.log(`New Episodes:\t${Object.keys(newEpisodes).length}`);
    })
    .then(() => {
      fs.writeFileSync('./snapshot.json', JSON.stringify(newSnap), 'utf8');
      res.sendStatus(200);
    });
});

app.listen(port, () => {
  console.log('randomizer is listening');
});
