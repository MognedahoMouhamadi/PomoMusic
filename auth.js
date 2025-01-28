

async function startPlaylist(accessToken, playlistId) {
    await axios.put(
        'https://api.spotify.com/v1/me/player/play',
        {
            context_uri: `spotify:playlist:${playlistId}`,
            position_ms: 0,
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }
    );
    console.log('Playlist démarrée.');
}


 async function stopPlayback(accessToken) {
    try {
        await axios.put(
            'https://api.spotify.com/v1/me/player/pause',
            null,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        console.log('Lecture Spotify mise en pause.');
    } catch (error) {
        console.error('Erreur lors de la mise en pause de Spotify:', error.response?.data || error.message);
    }
}

 async function getUserPlaylists(accessToken) {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const playlists = response.data.items;
        playlists.forEach(playlist => {
            console.log(`Name: ${playlist.name}, ID: ${playlist.id}`);
        });

        return playlists;
    } catch (error) {
        console.error('Erreur lors de la récupération des playlists :', error.response?.data || error.message);
    }
}


//getUserPlaylists(accessToken).then(playlists => {
    if (playlists) {
        console.log('Playlists récupérées avec succès :', playlists);
    }
//});

 async function refreshSpotifyToken(clientId, clientSecret, currentRefreshToken) {
    const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: currentRefreshToken,
            }),
            {
                headers: {
                    Authorization: `Basic ${base64Credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        accessToken = response.data.access_token;
        console.log('Token Spotify mis à jour avec succès :', accessToken);
        return accessToken;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du token Spotify :', error.response?.data || error.message);
        throw error;
    }
}
refreshSpotifyToken();



 function setTokens(newAccessToken, newRefreshToken) {
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
}


