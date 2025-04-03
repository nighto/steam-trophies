// run with node --env-file=.env script.js

// early exit if .env is not defined
if (!process.env.STEAM_API_KEY) {
  throw new Error('API Key not defined on .env file');
}
if (!process.env.STEAM_USER_ID) {
  throw new Error('Steam User ID not defined on .env file');
}

// Steam URLs to query
const STEAM_API_URL_GET_OWNED_GAMES = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${process.env.STEAM_USER_ID}&format=json&include_played_free_games=1&include_appinfo=1`;
const STEAM_API_URL_GET_PLAYER_ACHIEVEMENTS = `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${process.env.STEAM_USER_ID}&l=${STEAM_LANGUAGE}&format=json`; //&appid=XXX

// Language to fetch achievements
// TODO: Move configuration to FE
const STEAM_LANGUAGE = 'en';

const { createServer } = require('node:http');
const host = '127.0.0.1';
const port = 3000; // TODO: Make port configuratble

// extremely naïve, do not handle error yet
const fetchAndReturn = (url, res) => {
  console.log('GET', url);
  fetch(url)
    .then(response => response.json())
    .then(body => {
      res.writeHead(200);
      res.end(JSON.stringify(body));
    });
}

const returnError = (errorCode, errorMsg, res) => {
  res.writeHead(errorCode);
  res.end(JSON.stringify({ error:errorMsg }));
}

const requestListener = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  const path = req.url.split('/');
  path.shift();
  if (path[0] === 'games') {
    fetchAndReturn(STEAM_API_URL_GET_OWNED_GAMES, res);
  } else if (path[0] === 'trophies') {
    if (!path[1]) {
      returnError(500, 'Game id not supplied', res);
    } else {
      const gameId = parseInt(path[1]);
      if (isNaN(gameId)) {
        returnError(500, 'Invalid game id', res);
      } else {
        fetchAndReturn(`${STEAM_API_URL_GET_PLAYER_ACHIEVEMENTS}&appid=${gameId}`, res);
      }
    }
  } else {
    returnError(404, 'Resource not found', res);
  }
};

const server = createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
