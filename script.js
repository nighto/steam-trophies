// run with npx http-server

const URL_GAMES = 'http://localhost:3000/games';
const URL_TROPHIES = 'http://localhost:3000/trophies';

//const STEAM_GAME_IMAGE = 'http://media.steampowered.com/steamcommunity/public/images/apps';
//img.src = `${STEAM_GAME_IMAGE}/${game.appid}/${game.img_icon_url}.jpg`;
// another option is https://cdn.cloudflare.steamstatic.com/steam/apps/1569040/capsule_231x87.jpg
const STEAM_GAME_IMAGE = 'https://steamcdn-a.akamaihd.net/steam/apps';

// TODO move this to be configurable by the user
const OPTIONS = {
  SHOW_GAMES_NOT_PLAYED: false,
  SHOW_GAMES_WITHOUT_TROPHIES: false,
};

const handleResponse = response => {
  if (!response.ok) {
    throw new Error(`HTTP error, status = ${response.status}`);
  }
  return response.json();
};
const fetchGames = fetch(URL_GAMES).then(handleResponse);
const fetchTrophies = gameId => fetch(`${URL_TROPHIES}/${gameId}`).then(handleResponse);

const filterByOptions = game => {
  if (!OPTIONS.SHOW_GAMES_NOT_PLAYED) {
    if (game.playtime_forever === 0 || game.rtime_last_played === 0) {
      return false;
    }
  }
  return true;
};

const showGamesList = data => {
  // remove loading
  document.querySelector('#loading').remove();

  // sort by last played on top
  const sortedGames = data.response.games.sort((a, b) => b.rtime_last_played - a.rtime_last_played);

  // append game list
  const gamesList = document.querySelector('#games-list');
  sortedGames.filter(filterByOptions).forEach(game => gamesList.appendChild(gameListEntry(game)));

  // keep chainable
  return data;
};

const gameListEntry = game => {
  // game.appid, .name, .img_icon_url, .rtime_last_played, .playtime_forever
  const div = document.createElement('div');
  div.className = 'games-list__game';
  div.id = `game-${game.appid}`;
  div.tabIndex = 0;

  // game image
  const img = document.createElement('img');
  img.className = 'games-list__game__image';
  img.src = `${STEAM_GAME_IMAGE}/${game.appid}/header.jpg`;
  div.appendChild(img);

  // game title: name and progress (placeholder)
  const title = document.createElement('div');
  title.className = 'games-list__game__title';
  const name = document.createElement('p');
  name.className = 'games-list__game__title__name';
  name.textContent = game.name;
  title.append(name);
  const progress = document.createElement('div');
  progress.id = `progress-${game.appid}`;
  progress.className = 'games-list__game__title__progress';
  title.appendChild(progress);
  div.appendChild(title);

  // game trophy count placeholder
  const trophyCount = document.createElement('div');
  trophyCount.id = `trophies-${game.appid}`;
  trophyCount.className = 'games-list__game__trophies';
  div.appendChild(trophyCount);

  // fetch trophies
  fetchTrophies(game.appid).then(data => updateTrophies(data, game.appid));

  return div;
};

const updateTrophies = (data, appid) => {
  // playerstats.achievements[] = { achieved: 0/1, name, description, unlocktime }
  
  // get trophies count
  const { playerstats: { achievements } } = data;

  // remove games without achievements
  if (!OPTIONS.SHOW_GAMES_WITHOUT_TROPHIES && achievements === undefined) {
    return document.querySelector(`#game-${appid}`).remove();
  }

  const totalAchievementsCount = achievements.length;
  const unlockedAchievementsCount = achievements.filter(a => a.achieved === 1).length;
  const percentage = Math.round((unlockedAchievementsCount / totalAchievementsCount) * 100);
  // fake platinum trophy = if has all achievements and at least one, aka. completed the game
  const platinum = totalAchievementsCount > 0 && unlockedAchievementsCount === totalAchievementsCount ? 1 : 0;

  // create progressbar
  const progress = document.createElement('progress');
  progress.max = totalAchievementsCount;
  progress.value = unlockedAchievementsCount;

  // create percentage value
  const label = document.createElement('label');
  label.textContent = `${percentage}%`;

  // create trophies
  const platinumTrophy = document.createElement('span');
  platinumTrophy.textContent = platinum;
  const regularTrophies = document.createElement('span');
  regularTrophies.textContent = unlockedAchievementsCount;

  // append them
  const progressDiv = document.querySelector(`#progress-${appid}`);
  const trophiesDiv = document.querySelector(`#trophies-${appid}`);
  progressDiv.appendChild(progress);
  progressDiv.appendChild(label);
  trophiesDiv.appendChild(platinumTrophy);
  trophiesDiv.appendChild(regularTrophies);
};

fetchGames.then(data => showGamesList(data));
