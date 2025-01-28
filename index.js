// //API + CONNEXION avec spotify + bouton connecter
//Sur le clic Editer => cache le texte "<span> 5:00 </span>"" + on fait apparaitre un champs de saisie ("fait")
//Editer() : getelementbyid("btn-edit") display = none ("fait")
//const clientId = 'VOTRE_CLIENT_ID';
//const clientSecret = 'VOTRE_CLIENT_SECRET';
//const playlistId = 'VOTRE_PLAYLIST_ID';






document.addEventListener('submit', (event) => {
    event.preventDefault(); // Empêche tout formulaire de soumettre
    console.log('Soumission empêchée.');
});




let isPlay = false; // État initial : pas en lecture
let timerInterval = null; // ID de l'intervalle
let isEdit = false;
let stockminutes = "05";
let stocksecondes = "00";


document.addEventListener('DOMContentLoaded', async () => {
    const timerElement = document.getElementById('timer');

    // Récupérer le temps stocké depuis le serveur ou une autre source
    const storedTime = await loadTimer(); // Par exemple, { minutes: "03", seconds: "30" }
 

    // Mettre à jour l’afficheur avec la valeur stockée
    if (storedTime && timerElement) {
        const { minutes, seconds } = storedTime;
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        console.error('Aucune donnée de temps trouvée.');
    }
});


async function loadTimer() {
    try {
        const response = await fetch('http://localhost:8888/load-timer');
        if (!response.ok) throw new Error('Erreur lors du chargement des temps.');
        return await response.json(); // Doit retourner { minutes: "03", seconds: "30" }
    } catch (error) {
        console.error('Erreur lors du chargement des temps :', error);
        return { minutes: "05", seconds: "00" }; // Valeur par défaut
    }
}

function initializeDefaultTime() {

    let minutes = document.getElementById('minutes').value;
    let secondes = document.getElementById('secondes').value;
    document.getElementById('timer').textContent = `${String(minutes).padStart(2, '0')}:${String(secondes).padStart(2, '0')}`;
    console.log("le temps est initialisé")
};



function Valider() {
    let minutes = document.getElementById('minutes').value;
    let seconds = document.getElementById('secondes').value;

    if (minutes >= 60 || seconds >= 60 || minutes === "" || seconds === "") {
        alert("Erreur de saisie : Veuillez entrer des valeurs valides !");
        return;
    }

    // Mettre à jour les valeurs stockées
    stockminutes = minutes.padStart(2, '0');
    stocksecondes = seconds.padStart(2, '0');

    // Sauvegarder les temps
    saveTimer(stockminutes, stocksecondes);

    // Réinitialiser l'affichage et cacher les champs d'entrée
    document.getElementById('timer').textContent = `${stockminutes}:${stocksecondes}`;
    document.getElementById('timer').style.display = "inline-block";
    document.getElementById('deuxpoints').style.display = "none";
    document.getElementById('btn-check').style.display = "none";
    document.getElementById('secondes').style.display = "none";
    document.getElementById('minutes').style.display = "none";

    console.log("Temps validés et sauvegardés.");
}



function Reset() {
    try {
        clearInterval(timerInterval);
        timerInterval = null;
        isPlay = false;

        // Utiliser les valeurs stockées pour réinitialiser le temps
        document.getElementById('timer').textContent = `${stockminutes}:${stocksecondes}`;
        document.getElementById('button-play').style.display = "inline-block";
        document.getElementById('button-pause').style.display = "none";

        console.log("Chrono réinitialisé avec succès.");
    } catch (error) {
        console.error("Erreur lors du Reset:", error);
    }
};

async function Pause(event) {
    if (event) {
        event.preventDefault(); // Empêche le comportement par défaut
    }

    isPlay = false;
    document.getElementById('button-play').style.display = "inline-block";
    document.getElementById('button-pause').style.display = "none";

    // Mettre en pause la musique via le serveur
    try {
        const response = await fetch('http://localhost:8888/pause', { method: 'PUT' });
        if (!response.ok) {
            throw new Error(`Erreur Spotify : ${response.status}`);
        }
        const data = await response.json();
        console.log(data.message);
    } catch (error) {
        console.error('Erreur lors de la mise en pause de la lecture Spotify :', error);
    }

    // Arrêter le minuteur
    clearInterval(timerInterval);
    timerInterval = null;
}


function Editer() {

    isEdit = !isEdit; // Toggles the value of isEdit
    // le gros soucis ici était  la mise à jour de l'affichage

if (isEdit) {
    document.getElementById('timer').style.display="none";
    document.getElementById('deuxpoints').style.display="inline-block";
    document.getElementById('btn-check').style.display="inline-block";
    document.getElementById('secondes').style.display="inline-block";
    document.getElementById('minutes').style.display="inline-block";
    console.log(isEdit)

}else{

    document.getElementById('timer').style.display="inline-block";
    document.getElementById('deuxpoints').style.display="none";
    document.getElementById('btn-check').style.display="none";
    document.getElementById('secondes').style.display="none";
    document.getElementById('minutes').style.display="none";
    console.log(isEdit)

}

};




async function Play(event) {
    if (event) {
        event.preventDefault(); // Empêche le comportement par défaut
    }

    isPlay = !isPlay;

    if (isPlay) {
        document.getElementById('button-play').style.display = "none";
        document.getElementById('button-pause').style.display = "inline-block";

        // Lancer la musique via le serveur
        try {
            const response = await fetch('http://localhost:8888/play', { method: 'GET' });
            if (!response.ok) {
                throw new Error(`Erreur Spotify : ${response.status}`);
            }
            const data = await response.json();
            console.log(data.message);
        } catch (error) {
            console.error('Erreur lors du démarrage de la lecture Spotify :', error);
            isPlay = false; // Réinitialisation de l'état
        }

        // Lancer le minuteur
        startTimer();
    } else {
        Pause(); // Appeler Pause si Play est désactivé
    }
}



function startTimer(minutes, seconds) {
    let remainingMinutes = minutes;
    let remainingSeconds = seconds;

    timerInterval = setInterval(() => {
        if (remainingSeconds === 0) {
            if (remainingMinutes === 0) {
                clearInterval(timerInterval);
                timerInterval = null;

                // Arrêter Spotify automatiquement
                Pause();
                alert("Temps écoulé !");
                localStorage.removeItem('timerState');
                return;
            } else {
                remainingMinutes--;
                remainingSeconds = 59;
            }
        } else {
            remainingSeconds--;
        }

        // Mettre à jour l'affichage
        document.getElementById('timer').textContent = `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

        // Sauvegarder l'état du chrono
        localStorage.setItem('timerState', JSON.stringify({
            minutes: remainingMinutes,
            seconds: remainingSeconds,
            isPlay: true
        }));
    }, 1000);
}



// une fois le "champs de saisi" apparu on le rempli puis je "Valide" (penser à faire une esthétique en css) ("fait")

// j'appuie sur démarrer ou play pour lancer le minuteur et la play liste
// faire une fonction Minuteur() comment ?

// Quand j'appuie sur Reset le Chrono revient à l'état antérieur c'est à dire le minuteur que j'ai configuré !

async function fetchCredentials() {
    try {
        console.log('Requête pour récupérer les credentials envoyée');
        const response = await fetch('http://localhost:8888/credentials');
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Credentials récupérés avec succès :', data);
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des credentials :', error);
        return null;
    }
}

// Sauvegarder les temps dans le serveur
async function saveTimer(minutes, seconds) {
    try {
        const response = await fetch('http://localhost:8888/save-timer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ minutes, seconds }),
        });
        const data = await response.json();
        console.log(data.message);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des temps :', error);
    }
}


// Appeler loadTimer au chargement de la page
window.onload = async () => {
    const timerElement = document.getElementById('timer');

    // Récupérer les temps depuis le serveur
    const storedTime = await loadTimer();
    console.log('aaaa',storedTime);

    if (storedTime && timerElement) {
        const { minutes, seconds } = storedTime;

        // Mettre à jour l'afficheur avec les données récupérées
        stockminutes = String(minutes).padStart(2, '0');
        stocksecondes = String(seconds).padStart(2, '0');
        timerElement.textContent = `${stockminutes}:${stocksecondes}`;
        console.log(`Temps chargés : ${stockminutes}:${stocksecondes}`);
    } else {
        console.error('Impossible de charger les temps sauvegardés.');
    }
};



// Exposer les fonctions globalement pour les rendre accessibles dans le HTML


// Ajoutez les autres fonctions comme `initializeDefaultTime`, etc.
window.Play = Play;
window.Pause = Pause;
window.Editer = Editer;
window.Valider = Valider;
window.Reset = Reset;
