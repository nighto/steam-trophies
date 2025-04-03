# steam-trophies

A web interface to display your Steam Achievements in a manner similar to PlayStation trophies.

<img src="https://github.com/user-attachments/assets/14a912bf-7715-48e1-a370-cef82ca96e27" width="400"/>

Please note that this project is not affiliated or endorsed with Valve or Sony.

## Configuring

First, make a copy of `.env.example` to `.env` and fill in the values. You will need a Steam API Key, which you can get on [the Steam website](https://steamcommunity.com/dev/apikey), as well as your Steam User ID (SteamID64), which you can get easily on [Steam ID Finder](https://www.steamidfinder.com/).

Your profile does not need to be public; if it is private, it can be read with your users' API key.

## Running

Run the server with

    node --env-file=.env script.js

and run the client with

    npx http-server
