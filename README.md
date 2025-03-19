# Spotify MCP Server

This project implements a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that allows you to control Spotify playback using natural language through an MCP client, such as [Cursor](https://cursor.sh/) or [Claude for Desktop](https://claude.ai/download) (macOS and Windows only).

## Features

This server exposes the following tools:

*   `play`: Play a track, album, or playlist, or resume playback.
*   `pause`: Pause playback.
*   `next`: Skip to the next track.
*   `previous`: Skip to the previous track.
*   `get_current_track`: Get information about the currently playing track.
*   `search`: Search for tracks, albums, artists, or playlists.

## Prerequisites

*   [Bun](https://bun.sh/) (version 1.0.0 or later)
*   A Spotify Premium account.
*   A Spotify Developer application:
    *   Create one at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
    *   Obtain your Client ID and Client Secret.
    *   Add `http://localhost:8888/callback` to the Redirect URIs in your app's settings.
*   An MCP client (e.g., Cursor or Claude for Desktop).

## Installation and Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/obre10off/spotify-mcp.git
    cd spotify-mcp
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Create a `.env` file:**

    Create a file named `.env` in the root of the project directory.  Add the following, replacing the placeholders with your actual Spotify credentials:

    ```
    SPOTIFY_CLIENT_ID=your_spotify_client_id
    SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
    SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
    # These will be filled in after running the auth script:
    SPOTIFY_ACCESS_TOKEN=
    SPOTIFY_REFRESH_TOKEN=
    ```

4.  **Run the authorization script:**

    This script will open your browser, prompt you to log in to Spotify and grant permissions, and then retrieve your initial access and refresh tokens.

    ```bash
    bun run auth
    ```

    The script will print the `SPOTIFY_ACCESS_TOKEN` and `SPOTIFY_REFRESH_TOKEN` to the console.  Copy these values into your `.env` file.

5.  **Configure your MCP client:**

    *   **Cursor:**
        *   Open Cursor's settings (Cmd+, or Ctrl+,).
        *   Search for "Model Context Protocol".
        *   Click "Edit in settings.json".
        *   Add the following to the `mcp.servers` array (replace `/absolute/path/to/your/spotify-mcp` with the *absolute* path to your `spotify-mcp` directory):

            ```json
            {
                "mcp.servers": [
                    {
                        "spotify": {
                            "command": "bun",
                            "args": ["/absolute/path/to/your/spotify-mcp/src/index.ts"],
                            "env": {
                                "SPOTIFY_CLIENT_ID": "your_spotify_client_id",
                                "SPOTIFY_CLIENT_SECRET": "your_spotify_client_secret",
                                "SPOTIFY_REDIRECT_URI": "http://localhost:8888/callback",
                                "SPOTIFY_ACCESS_TOKEN": "your_spotify_access_token",
                                "SPOTIFY_REFRESH_TOKEN": "your_spotify_refresh_token"
                            }
                        }
                    }
                ]
            }
            ```
            It is recommended to use a `.env` file and only put the environment variables related to Spotify there, instead of adding the values to the settings.json file.

    *   **Claude for Desktop (macOS/Windows):**
        *   Open the Claude for Desktop configuration file:
            *   **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
            *   **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
        *   Add the following to the `mcpServers` object (replace `/absolute/path/to/your/spotify-mcp` with the *absolute* path to your `spotify-mcp` directory):
           ```json
            {
              "mcpServers": {
                "spotify": {
                  "command": "bun",
                  "args": ["/absolute/path/to/your/spotify-mcp/src/index.ts"]
                }
              }
            }
            ```
            It is recommended to use a `.env` file and only put the environment variables related to Spotify there, instead of adding the values to the `claude_desktop_config.json` file.

    * **Important:** Always use *absolute* paths in your client configuration.

6. **Restart your MCP Client**

   Make sure to restart your MCP client (Cursor/Claude) to apply the settings.

## Running the Server

```bash
bun run start


This command starts the server with automatic reloading on file changes (thanks to Bun's --watch flag). Keep this terminal window open while you're using the server.


## Usage

Once the server is running and your MCP client is configured, you can start using natural language commands to control Spotify. Examples:

"Play Bohemian Rhapsody"

"Pause the music"

"What song is playing?"

"Search for Taylor Swift albums"

"Next track"

"Play spotify:track:4uLU6hMCjMI75M1A2tKUQC"