import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import SpotifyWebApi from "spotify-web-api-node";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const SPOTIFY_CLIENT_ID = process.env['SPOTIFY_CLIENT_ID'];
const SPOTIFY_CLIENT_SECRET = process.env['SPOTIFY_CLIENT_SECRET'];
const SPOTIFY_REDIRECT_URI = process.env['SPOTIFY_REDIRECT_URI'] || 'http://localhost:8888/callback';
const SPOTIFY_ACCESS_TOKEN = process.env['SPOTIFY_ACCESS_TOKEN'];
const SPOTIFY_REFRESH_TOKEN = process.env['SPOTIFY_REFRESH_TOKEN'];


if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error("Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.");
    process.exit(1);
}

const spotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URI,
});

spotifyApi.setAccessToken(SPOTIFY_ACCESS_TOKEN || '');

const server = new McpServer({
    name: "spotify-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {}, // We want to expose tools
    }
});

async function refreshAccessToken() {
    if (!SPOTIFY_REFRESH_TOKEN) {
        console.error("No refresh token available.  Please run 'npm run auth' first.");
        process.exit(1);
    }
    spotifyApi.setRefreshToken(SPOTIFY_REFRESH_TOKEN);
    try {
        const data = await spotifyApi.refreshAccessToken();
        const newAccessToken = data.body.access_token;
        spotifyApi.setAccessToken(newAccessToken);
        console.log('Access token refreshed.');

        // Ideally, you'd update the .env file here, but for simplicity, we'll just log it.
        console.log("New Access Token:", newAccessToken);
        // In a production environment, you would persist the new access token.
        
        // Consider using a library like 'envfile' to update the .env file programmatically:
        // await updateEnvFile({ SPOTIFY_ACCESS_TOKEN: newAccessToken });
    } catch (error) {
        console.error('Could not refresh access token:', error);
        process.exit(1);
    }
}

// --- play ---
server.tool(
    "play",
    "Play a track, album, or playlist, or resume playback.",
    {
        uri: z.string().optional().describe("Spotify URI of the track, album, or playlist to play. If omitted, resumes playback.")
    },
    async ({ uri }) => {
        try {
            if (uri) {
                if (uri.startsWith("spotify:track:")) {
                    await spotifyApi.play({ uris: [uri] });
                } else if (uri.startsWith("spotify:album:") || uri.startsWith("spotify:playlist:")) {
                    await spotifyApi.play({ context_uri: uri });
                } else {
                     return { isError: true, content: [{ type: "text", text: "Invalid Spotify URI." }] };
                }
            } else {
                await spotifyApi.play();
            }
            return { content: [{ type: "text", text: `Playback started/resumed.` }] };
        } catch (error: any) {
            console.error("Error in play tool:", error);
             return { isError: true, content: [{ type: "text", text: `Error: ${error.message}` }] };
        }
    }
);

// --- pause ---
server.tool("pause", "Pause playback.", {}, async () => {
    try {
        await spotifyApi.pause();
        return { content: [{ type: "text", text: `Playback paused.` }] };
    } catch (error: any) {
        console.error("Error in pause tool:", error);
         return { isError: true, content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
});

// --- next ---
server.tool("next", "Skip to the next track.", {}, async () => {
    try {
        await spotifyApi.skipToNext();
        return { content: [{ type: "text", text: `Skipped to next track.` }] };
    } catch (error: any) {
        console.error("Error in next tool:", error);
      return { isError: true, content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
});

// --- previous ---
server.tool("previous", "Skip to the previous track.", {}, async () => {
    try {
        await spotifyApi.skipToPrevious();
        return { content: [{ type: "text", text: `Skipped to previous track.` }] };
    } catch (error: any) {
        console.error("Error in previous tool:", error);
         return { isError: true, content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
});

// --- get_current_track ---
server.tool(
    "get_current_track",
    "Get information about the currently playing track.",
    {},
    async () => {
        try {
            const data = await spotifyApi.getMyCurrentPlayingTrack();
            if (data.body && data.body.item && data.body.item.type === 'track') {
                const track = data.body.item;
                const artists = track.artists.map((artist) => artist.name).join(", ");
                return {
                    content: [
                        {
                            type: "text",
                            text: `Currently playing: ${track.name} by ${artists} from the album ${track.album.name}.`
                        }
                    ]
                };
            } else {
                return { content: [{ type: "text", text: `No track currently playing.` }] };
            }

        } catch (error: any) {
            console.error("Error in get_current_track tool:", error);
           return { isError: true, content: [{ type: "text", text: `Error: ${error.message}` }] };
        }
    }
);

// --- search ---
server.tool(
    "search",
    "Search for a track, album, artist, or playlist.",
    {
        query: z.string().describe("Search query."),
        type: z.enum(["track", "album", "artist", "playlist"]).describe("Type of item to search for.")
    },
    async ({ query, type }) => {
        try {
            const data = await spotifyApi.search(query, [type]);
            let searchResults = "";

            if (type === "track" && data.body.tracks) {
                searchResults = data.body.tracks.items.map((item) => `${item.name} by ${item.artists.map((artist) => artist.name).join(", ")}`).join("\n");
            } else if (type === "album" && data.body.albums) {
                searchResults = data.body.albums.items.map((item) => `${item.name} by ${item.artists.map((artist) => artist.name).join(", ")}`).join("\n");
            } else if (type === "artist" && data.body.artists) {
                searchResults = data.body.artists.items.map((item) => item.name).join("\n");
            } else if (type === "playlist" && data.body.playlists) {
                searchResults = data.body.playlists.items.map((item) => item.name).join("\n");
            }

            if (!searchResults) {
                return { content: [{ type: "text", text: `No ${type}s found for query: ${query}` }] };
            }

            return { content: [{ type: "text", text: `Search results for ${type}s:\n${searchResults}` }] };

        } catch (error: any) {
            console.error("Error in search tool:", error);
            return { isError: true, content: [{ type: "text", text: `Error: ${error.message}` }] };
        }
    }
);


async function main() {
    await refreshAccessToken(); // Refresh the token at startup

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Spotify MCP Server running on stdio"); // Log to stderr
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});