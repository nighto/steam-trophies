// run with npx http-server

const SERVER = 'http://localhost:3000';
const URL_GAMES = `${SERVER}/games`;
const URL_TROPHIES = `${SERVER}/trophies`;
const URL_SCHEMA = `${SERVER}/schema`;

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
const fetchSchema = gameId => fetch(`${URL_SCHEMA}/${gameId}`).then(handleResponse);

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

  // save list
  localStorage.setItem('games', JSON.stringify(sortedGames));

  // append game list
  const gamesList = document.querySelector('#games-list');
  sortedGames.filter(filterByOptions).forEach(game => gamesList.appendChild(gameListEntry(game)));

  // keep chainable
  return data;
};

const gameListEntry = game => {
  // game.appid, .name, .img_icon_url, .rtime_last_played, .playtime_forever

  // game div
  const div = document.createElement('div');
  div.className = 'games-list__game';
  div.id = `game-${game.appid}`;
  div.tabIndex = 0;
  div.addEventListener('click', () => showGameAchievements(game.appid));

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
  // TODO: Reuse cached data
  fetchTrophies(game.appid).then(data => updateTrophies(data, game.appid));

  return div;
};

const updateTrophies = (data, appid) => {
  // playerstats.achievements[] = { achieved: 0/1, name, description, unlocktime }

  // store a copy
  localStorage.setItem(`game-${appid}`, JSON.stringify(data));

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

const achievementRow = (name, description, unlocked, platinum, id) => {
  // trophies without description should be shown as "Hidden Trophy"
  const row = document.createElement('div');
  // TODO: Can't use "id", some games have ids with punctuation, needs to escape their values, maybe with atob and btoa?
  row.id = `achievement-${id}`;
  row.className = `achievements-list__achievement achievements-list__achievement--${unlocked ? 'unlocked' : 'locked'}${platinum ? ' achievements-list__achievement--platinum' : ''}${description ? '' : ' achievements-list__achievement--hidden'}`;

  // icon or image
  if (platinum) {
    const icon = document.createElement('span');
    icon.className = 'achievements-list__achievement__image';
    if (unlocked) {
      icon.textContent = '🏆';
    } else {
      icon.textContent = '🔒';
    }
    row.appendChild(icon);
  } else {
    const img = document.createElement('img'); // no src, that will come later
    img.id = `achievement-${id}__image`;
    img.className = 'achievements-list__achievement__image';
    row.appendChild(img);
  }

  // name and description
  const nameAndDescription = document.createElement('p');
  nameAndDescription.className = 'achievements-list__achievement__title';
  const descriptionField = document.createElement('small');
  nameAndDescription.textContent = description ? name : 'Hidden Trophy';
  descriptionField.textContent = description;
  nameAndDescription.appendChild(descriptionField);
  row.appendChild(nameAndDescription);

  return row;
}

const showGameAchievements = gameId => {
  // { playerstats: { gameName, steamID, achievements[]: { achieved:0|1, apiname, description, name, unlocktime } } }

  // hide games list, remove its event listener
  document.querySelector('#games-list').classList.add('hidden');
  document.body.removeEventListener('keydown', gameListKeyHandler);

  // get achievements data
  const achievementsData = JSON.parse(localStorage.getItem(`game-${gameId}`));

  // empty list
  const achievementsDiv = document.querySelector('#achievements-list');
  achievementsDiv.innerHTML = null;

  // game title row
  const titleDiv = document.createElement('div');
  titleDiv.className = 'achievements-list__game';

  const img = document.createElement('img');
  img.className = 'achievements-list__game__image';
  img.src = `${STEAM_GAME_IMAGE}/${gameId}/header.jpg`;
  titleDiv.appendChild(img);

  const title = document.createElement('p');
  title.className = 'achievements-list__game__title';
  title.textContent = achievementsData.playerstats.gameName;
  titleDiv.appendChild(title);

  achievementsDiv.append(titleDiv);

  const achievements = achievementsData.playerstats.achievements;
  const unlockedAchievements = achievements.filter(a => a.achieved === 1);
  const lockedAchievements = achievements.filter(a => a.achieved === 0);
  const hasPlatinum = achievements.length > 0 && unlockedAchievements.length === achievements.length && lockedAchievements.length === 0;

  // now we show all achievements/trophies, in this logic:
  // first, only if gamer has conquered all achievements, a Platinum trophy, unlocked
  if (hasPlatinum) {
    achievementsDiv.append(achievementRow('Perfect Game', 'All Trophies unlocked', true, true));
  }

  // second, a list of achieved conquers as trophies
  unlockedAchievements.forEach(a => achievementsDiv.append(achievementRow(a.name, a.description, true, false, a.apiname)));

  // third, only if has not conquered all achievements, a Platinum trophy, locked
  if (!hasPlatinum) {
    achievementsDiv.append(achievementRow('Perfect Game', 'All Trophies unlocked', false, true));
  }

  // fourth, a list of non-achieved conquers as locked trophies
  lockedAchievements.forEach(a => achievementsDiv.append(achievementRow(a.name, a.description, false, false, a.apiname)));

  // finally, we get the schema data, i.e. the API call with the achievements images
  // TODO: Reuse cached data
  fetchSchema(gameId).then(data => {
    // { game: { gameName, availableGameStats: { achievements[]: { name (= apiname of other api), displayName (= name of other api), description, icon (=unlocked), icongray (=locked) } } } }
    const { game: { availableGameStats: { achievements } } } = data;
    achievements.forEach(a => {
      console.log(a);
      const row = document.querySelector(`#achievement-${a.name}`);
      const img = document.querySelector(`#achievement-${a.name}__image`);
      const isUnlocked = row.className.includes('unlocked');
      img.src = isUnlocked ? a.icon : a.icongray;
    });
  });
};

const gameListKeyHandler = event => {
  // it'd be easier to just dispatch a keydown key Tab event, but that's not allowed. :()
  // document.body.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Tab', shiftKey: bool }));
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const focusedElement = document.querySelector('*:focus');
    // if nothing is currently focused, we need to focus either on the first or the last
    const allFocusableTargets = document.querySelectorAll('[tabindex]');
    if (!focusedElement) {
      if (event.key === 'ArrowDown') {
        // focus on the first element.
        return allFocusableTargets[0].focus();
      }
      if (event.key === 'ArrowUp') {
        // focus on the last element.
        return allFocusableTargets[allFocusableTargets.length - 1].focus();
      }
    }
    // if something is focused, we can focus the next or the prev, but we need to make sure that it exists
    if (focusedElement) {
      if (event.key === 'ArrowDown') {
        return focusedElement.nextElementSibling ? focusedElement.nextElementSibling.focus() : allFocusableTargets[0].focus();
      }
      if (event.key === 'ArrowUp') {
        return focusedElement.previousElementSibling ? focusedElement.previousElementSibling.focus() : allFocusableTargets[allFocusableTargets.length - 1].focus();
      }
    }
  }
  if (event.key === 'Enter') {
    document.querySelector('*:focus')?.click();
  }
};

// after defining everything, show list
fetchGames.then(data => {
  showGamesList(data);
  document.body.addEventListener('keydown', gameListKeyHandler);
});
