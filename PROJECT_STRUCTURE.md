# 📂 AudioScape Project Structure

Welcome to the AudioScape project! This document provides a clear and comprehensive overview of the project's structure, making it easy for new contributors to understand the purpose of each directory and key file.

---

## 🌳 Root Directory

The root directory contains essential configuration files, documentation, and the main source code folders.

### Configuration Files & Folders

- `📄 .env-guideline-sizes`: A guideline for the sizes of environment variables.
- `📄 .env.example`: An example file outlining the necessary environment variables.
- `📄 .gitignore`: Specifies files and folders that Git should ignore.
- `📄 app.config.js`: Core configuration for the Expo app, including name, version, icon, and plugins.
- `📄 babel.config.js`: Configuration for Babel, the JavaScript compiler.
- `📄 eas.json`: Configuration for Expo Application Services (EAS) for building and deploying the app.
- `📄 eslint.config.js`: Configuration for ESLint, ensuring consistent code style and quality.
- `📄 metro.config.js`: Configuration for Metro, the React Native bundler.
- `📄 package.json`: Lists all project dependencies and defines useful scripts.
- `📄 package-lock.json`: Ensures consistent dependency versions across all environments.
- `📄 tsconfig.json`: Configures the TypeScript compiler.

### Core Project Structure

- `📁 .github/`: Holds GitHub-specific files, like workflow definitions.
  - `📁 workflows/`: Contains CI/CD workflow configurations.
    - `📄 release-please.yml`: A workflow for automating releases.
- `📁 .vscode/`: Contains Visual Studio Code editor settings.
  - `📄 settings.json`: Workspace-specific settings for VS Code.
- `📁 app/`: Contains all the screens, navigation logic, and layouts.
- `📁 assets/`: Holds all static assets like fonts and images.
- `📁 components/`: Home to reusable React components used throughout the app.
- `📁 constants/`: Stores constant values like colors, tokens, and static data.
- `📁 helpers/`: Contains helper functions for various tasks.
- `📁 hooks/`: Includes custom React hooks for shared logic.
- `📁 services/`: Manages interactions with external APIs (e.g., YouTube).
- `📁 store/`: Contains the Redux store for state management.
- `📁 styles/`: Defines global styles for the application.
- `📁 types/`: Holds all TypeScript type definitions.
- `📄 storage.ts`: Defines functions for interacting with local device storage.
- `📄 LICENSE`: The project's software license.
- `📄 README.md`: The main project README with general information.

---

## 📁 Directory Breakdown

Here is a more detailed look into the key directories.

### `app`

This directory is the heart of the application, managing all routes and screen layouts using `expo-router`.

- `📁 (modals)/`: Contains all modal screens that appear on top of other content.
  - `📄 addToPlaylist.tsx`: Modal for adding a track to a playlist.
  - `📄 createPlaylist.tsx`: Modal for creating a new playlist.
  - `📄 deletePlaylist.tsx`: Confirmation modal for deleting a playlist.
  - `📄 lyrics.tsx`: Modal to display the current song's lyrics.
  - `📄 menu.tsx`: A generic menu modal for items.
  - `📄 queue.tsx`: Modal to show the upcoming tracks in the queue.
- `📁 (tabs)/`: Defines the main tab navigation structure.
  - `📁 home/`: The main home screen and its sub-pages.
    - `📄 _layout.tsx`: Layout for the home screen.
    - `📄 album.tsx`: Screen to display a single album.
    - `📄 artist.tsx`: Screen to display a single artist.
    - `📄 index.tsx`: The main home screen.
    - `📄 itemList.tsx`: A generic list screen for items.
    - `📄 search.tsx`: The search screen.
  - `📁 playlists/`: The playlists screen and logic for viewing a specific playlist.
    - `📄 _layout.tsx`: Layout for the playlists screen.
    - `📄 [playlistName].tsx`: Screen to display a single playlist.
    - `📄 index.tsx`: The main playlists screen.
  - `📄 _layout.tsx`: The layout for the tab navigator itself.
  - `📄 downloads.tsx`: Screen to show downloaded tracks.
  - `📄 favorites.tsx`: Screen to show favorited tracks.
  - `📄 index.tsx`: The default entry screen for the tabs (redirects to home).
- `📄 _layout.tsx`: The root layout for the entire app. It sets up global providers (Theme, Redux, Gesture Handler), loads fonts, and initializes the track player.
- `📄 player.tsx`: The full-screen music player UI.
- `📄 +not-found.tsx`: A catch-all screen for handling invalid routes.

### `assets`

- `📁 fonts/`: Contains custom fonts for the application.
  - `📄 Meriva.ttf`
  - `📄 SpaceMono-Regular.ttf`
- `📁 images/`: Contains all images and icons.
  - `📁 backgroundGradients/`: A collection of gradient images for backgrounds.
  - `📄 adaptive-icon-background.png`
  - `📄 adaptive-icon-foreground.png`
  - `📄 favicon.png`
  - `📄 getItGithub.png`
  - `📄 icon.png`
  - `📄 notification-icon.png`
  - `📄 screenshot-1.png`
  - `📄 screenshot-2.png`
  - `📄 screenshot-3.png`
  - `📄 screenshot-4.png`
  - `📄 screenshot-5.png`
  - `📄 screenshot-6.png`
  - `📄 splash.png`
  - `📄 transparent-icon.png`
  - `📄 unknown_track.png`

### `components`

This directory contains reusable UI components.

- `📁 navigation/`: Components specifically for navigation purposes.
  - `📄 TabBarIcon.tsx`: The icon component used in the main tab bar.
  - `📄 VerticalArrowDismiss.tsx`: A component for a vertical arrow dismiss gesture.
  - `📄 VerticalGesture.tsx`: A component for handling vertical gestures.
- `📄 FloatingPlayer.tsx`: The mini-player that persists at the bottom of the screen.
- `📄 GradientBackground.tsx`: A component for rendering a gradient background.
- `📄 Lyrics.tsx`: Component to display synchronized or static lyrics.
- `📄 MessageModal.tsx`: A reusable modal for showing informational messages.
- `📄 MovingText.tsx`: A marquee-style component for scrolling long text.
- `📄 MusicPlayerContext.tsx`: React Context for managing the global music player state.
- `📄 PlayerControls.tsx`: The set of controls (play, pause, skip) for the music player.
- `📄 PlayerProgressbar.tsx`: The progress bar/slider for the music player.
- `📄 QuickPicksSection.tsx`: A UI section for displaying "Quick Picks".
- `📄 TrendingSection.tsx`: A UI section for displaying trending music.
- `📄 UpdateModal.tsx`: A modal to notify users about available updates.

### `constants`

- `📄 Colors.ts`: Defines the color palette for the application.
- `📄 images.ts`: A collection of image assets.
- `📄 playbackService.ts`: Service for handling audio playback.
- `📄 tokens.ts`: Contains constants for design tokens.

### `helpers`

- `📄 haptics.ts`: Provides functions for triggering haptic feedback.
- `📄 miscellaneous.ts`: A collection of miscellaneous helper functions.

### `hooks`

This directory contains custom React hooks to encapsulate and reuse stateful logic.

- `📄 useImageColors.tsx`: Extracts prominent colors from an image.
- `📄 useLastActiveTrack.tsx`: Retrieves the last played track.
- `📄 useLogTrackPlayerState.tsx`: Logs the state of the track player for debugging.
- `📄 useLyricsContext.tsx`: React Context for managing lyrics data.
- `📄 useNotificationClickHandler.tsx`: Handles what happens when a user clicks a music notification.
- `📄 useSetupTrackPlayer.tsx`: Initializes and configures `react-native-track-player`.
- `📄 useTrackPlayerFavorite.tsx`: Manages the logic for favoriting/unfavoriting tracks.
- `📄 useTrackPlayerRepeatMode.tsx`: Manages the repeat mode (none, track, queue).

### `services`

This directory handles communication with external services and APIs.

- `📄 download.ts`: Contains functions for downloading and managing audio files.
- `📄 youtube.ts`: Contains functions for fetching data from the YouTube API.

### `store`

- `📄 library.tsx`: Contains the Redux store and reducers for the music library.

### `styles`

- `📄 index.ts`: Defines global styles for the application.

### `types`

- `📄 index.d.ts`: Contains global TypeScript type definitions.
- `📄 searchItems.d.ts`: Defines types for search results.
