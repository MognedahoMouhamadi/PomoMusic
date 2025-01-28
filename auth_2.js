import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import cors from 'cors';

const client_id = '73327830db814e12a5ddd73914ee4ef2';
const client_secret = '44e26ae65ae3480998dd004220c4f4fe';
const redirect_uri = 'http://localhost:8888/callback';

const app = express();

// Route pour initier la connexion
app.get('/login', (req, res) => {
    const scope = 'user-read-private user-read-email user-read-playback-state user-read-currently-playing user-modify-playback-state';
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
    res.redirect(authUrl);
});

// Route pour gérer le callback et obtenir le token
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        res.status(400).send('Code de validation manquant');
        return;
    }

    try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                code,
                redirect_uri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) throw new Error('Impossible de récupérer le token');

        const tokenData = await tokenResponse.json();
        fs.writeFileSync('credential.json', JSON.stringify(tokenData));

        res.send('Connexion réussie. Token enregistré.');
    } catch (error) {
        console.error('Erreur lors de la récupération du token :', error);
        res.status(500).send('Erreur serveur.');
    }
});



async function refreshToken() {
    const credentials = JSON.parse(fs.readFileSync('credential.json', 'utf8'));
    const { refresh_token } = credentials;

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erreur lors du rafraîchissement du token : ${response.status}`);
        }

        const newToken = await response.json();
        fs.writeFileSync('credential.json', JSON.stringify({
            ...credentials,
            access_token: newToken.access_token,
        }));

        console.log('Token rafraîchi avec succès.');
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token :', error);
    }
};

app.get('/credentials', (req, res) => {
    try {
        const credentials = JSON.parse(fs.readFileSync('credential.json', 'utf8'));
        res.json(credentials);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier credential.json:', error);
        res.status(500).send('Erreur serveur');
    }
});




// Fonction pour récupérer la musique en cours
export async function getcurrentMusic() {
    try {
        const credentials = JSON.parse(fs.readFileSync('credential.json', 'utf8'));
        const { access_token } = credentials;

        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        if (!response.ok) {
            console.error('Erreur API Spotify', await response.json());
            return;
        }

        const data = await response.json();
        console.log('Lecture en cours :', data);
    } catch (error) {
        console.error('Erreur lors de la récupération de la musique en cours :', error);
    }
}






app.get('/play', async (req, res) => {
    await refreshToken(); 
    try {
        const credentials = JSON.parse(fs.readFileSync('credential.json', 'utf8'));
        const { access_token } = credentials;

        const albumUri = 'spotify:album:1amYhlukNF8WdaQC3gKkgL'; // Remplacez par l'URI de votre album
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                context_uri: albumUri,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        res.send({ message: 'Lecture de l\'album démarrée.' });
    } catch (error) {
        console.error('Erreur dans /play :', error);
        res.status(500).send({ error: 'Impossible de démarrer la lecture.' });
    }
});





// // Fonction pour mettre en pause la lecture
app.put('/pause', async (req, res) => {
    try {
        const credentials = JSON.parse(fs.readFileSync('credential.json', 'utf8'));
        const { access_token } = credentials;

        const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        res.send({ message: 'Lecture mise en pause.' });
    } catch (error) {
        console.error('Erreur dans /pause :', error);
        res.status(500).send({ error: 'Impossible de mettre en pause.' });
    }
});


app.use(cors({
    origin: 'http://127.0.0.1:5500', // Origine autorisée
}));

app.use(cors());


// Démarrage du serveur
app.listen(8888, () => {
    console.log('Serveur démarré sur http://localhost:8888');
});






// stockage du temps

app.post('/save-timer', express.json(), (req, res) => {
    const { minutes, seconds } = req.body;

    // Vérifiez que les données sont valides
    if (isNaN(minutes) || isNaN(seconds)) {
        return res.status(400).send({ error: 'Données invalides' });
    }

    // Écrivez les données dans un fichier JSON
    const timerData = { minutes, seconds };
    fs.writeFileSync('timer.json', JSON.stringify(timerData));

    res.send({ message: 'Temps sauvegardé avec succès' });
});

// Route pour récupérer les temps
app.get('/load-timer', (req, res) => {
    try {
        const data = fs.readFileSync('timer.json', 'utf-8');
        res.send(JSON.parse(data));
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier JSON:', error);
        res.status(500).send({ error: 'Impossible de charger les temps' });
    }
});