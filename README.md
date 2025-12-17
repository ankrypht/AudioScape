> [!IMPORTANT]
> Currently the music streaming is not working. YouTube changed some stuff and now its harder to get streaming urls (within react-native). I am trying to find a solution and hopefully it will be fixed soon.

<div align="center">
    <img src="./assets/images/transparent-icon.png" width="180" height="180" style="display: block; margin: 0 auto"/>
    <h1>AudioScape</h1>

**An Android Application For Streaming Music From YouTube Music Build With React-Native Using Expo.**

![GitHub Release](https://img.shields.io/github/v/release/ankrypht/AudioScape?label=Latest%20Release&logo=github&logoColor=white)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/ankrypht/AudioScape/total?label=Downloads&logo=refinedgithub&logoColor=white)
![GitHub commits since latest release](https://img.shields.io/github/commits-since/ankrypht/AudioScape/latest)
![GitHub License](https://img.shields.io/github/license/ankrypht/AudioScape?label=License&logo=gnu&logoColor=white)
![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/ankrypht/AudioScape/main?label=Code%20Quality&logo=codefactor&logoColor=white)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/ankrypht/AudioScape/main?label=Last%20Commit&logo=Git&logoColor=white)
![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/t/ankrypht/AudioScape?label=Total%20Commits)
![GitHub top language](https://img.shields.io/github/languages/top/ankrypht/AudioScape?label=TypeScript&logo=typescript&logoColor=white)
![GitHub language count](https://img.shields.io/github/languages/count/ankrypht/AudioScape?label=Languages%20Used)
![GitHub issues](https://img.shields.io/github/issues/ankrypht/AudioScape?label=Issues)
![GitHub pull requests](https://img.shields.io/github/issues-pr/ankrypht/AudioScape?label=Pull%20Requests)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/ankrypht/AudioScape?label=Code%20Size)

**Built With The Tools & Technologies:**

![Expo](https://img.shields.io/badge/Expo-1C2024?logo=expo&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-61DAFB?logo=react&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-DD2C0D?logo=firebase&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-CB3837?logo=npm&logoColor=white)
![Babel](https://img.shields.io/badge/Babel-F9DC3E?logo=babel&logoColor=black)
![Redux](https://img.shields.io/badge/Redux-764ABC?logo=redux&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=black)
![Render](https://img.shields.io/badge/Render-000000?logo=render&logoColor=white)

</div>

## 📱 Screenshots

<div align="center">
   <img src="./assets/images/screenshot-1.png" width="45%" />
   <img src="./assets/images/screenshot-2.png" width="45%" />
   <img src="./assets/images/screenshot-3.png" width="45%" />
   <img src="./assets/images/screenshot-4.png" width="45%" />
   <img src="./assets/images/screenshot-5.png" width="45%" />
   <img src="./assets/images/screenshot-6.png" width="45%" />
</div>

## ✨ Features

- Play songs from YouTube Music
- Background playback with stop when app swipe out from task manager
- Add Songs To Favorites Category
- Dynamic Player Background
- Create Playlists
- Search for songs
- Automatically check for updates
- Synced Lyrics
- Download Songs

## 📲 Installation

[<img src="./assets/images/getItGithub.png" alt="GitHub" height="80">](https://github.com/ankrypht/AudioScape/releases/latest)

## 🤝 Contributing

**You need a YouTube 'po token' api to develop the app yourself**

- You can find the code for the api at: https://github.com/ankrypht/YouTubeApi

- You can either host the api locally or use "https://render.com/" to host the api (recommended), either way add the link to a **.env** (reffer to .env.example) file and **don't forget to give '/data' at the end of the api link**.

_Example :_

```
EXPO_PUBLIC_PO_TOKEN_API="https://<your render project name>.onrender.com/data"
```

> [!IMPORTANT]
> This project requires a development build.

**Pull requests are welcome**

- If you want to **develop new functions** or **fix a bug**, fork the repository and send a pull request.

## 🫂 Acknowledgments

- [**YouTube.js**](https://github.com/LuanRT/YouTube.js): A JavaScript client for YouTube's private API
- [**LrcLib**](https://lrclib.net): Lyrics provider
- [**react-native-spotify-lyrics**](https://github.com/uragirii/react-native-spotify-lyrics): Main logic for the synced lyrics feature

## 📝 License

```
AudioScape is a free software licensed under GPL v3.0 with following condition.

- Copied/Modified version of this software can not be used for 'non-free' and profit purposes.
- You can not publish copied/modified version of this app on closed source app repository
  like PlayStore/AppStore.

```

## ❗ Disclaimer

```
This project has been created while learning & learning is the main intention.
This project is not sponsored or affiliated with, funded, authorized, endorsed by any content provider.
Any Song, content, trademark used in this app are intellectual property of their respective owners.
AudioScape is not responsible for any infringement of copyright or other intellectual property rights that may result
from the use of the songs and other content available through this app.

This Software is released "as-is", without any warranty, responsibility or liability.
In no event shall the Author of this Software be liable for any special, consequential,
incidental or indirect damages whatsoever (including, without limitation, any
other pecuniary loss) arising out of the use of inability to use this product, even if
Author of this Sotware is aware of the possibility of such damages and known defect.
```
