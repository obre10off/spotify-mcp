import SpotifyWebApi from 'spotify-web-api-node';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const SPOTIFY_CLIENT_ID = process.env['SPOTIFY_CLIENT_ID'];
const SPOTIFY_CLIENT_SECRET = process.env['SPOTIFY_CLIENT_SECRET'];
const SPOTIFY_REDIRECT_URI = process.env['SPOTIFY_REDIRECT_URI'] || 'http://localhost:8888/callback';

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error("Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.");
  process.exit(1);
}

const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI,
});

const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
];

const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'some-state');

const app = express();

app.get('/callback', async (req, res) => {
  const code = req.query['code'] as string;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    console.log('Expires in:', data.body.expires_in);

    console.log('\nAdd these to your .env file:');
    console.log(`SPOTIFY_ACCESS_TOKEN=${accessToken}`);
    console.log(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);


    res.send('Authorization successful! Check the console for your tokens.');
    process.exit(0); // Exit after getting tokens

  } catch (error) {
    console.error('Error getting tokens:', error);
    res.send('Authorization failed! Check the console for errors.');
  }
});

async function startAuthServer() {
    // await open(authorizeURL); // The open package doesn't work well on bun
    console.log('Visit this URL in your browser:', authorizeURL);
    app.listen(8888, () => {
        console.log('Authorization server listening on port 8888');
    });
}
startAuthServer();