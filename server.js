let express = require('express');
let app = express();
let axios = require('axios');
let cors = require('cors');
const PORT = 1376;
const BASE_URL = "https://api.myfantasyleague.com/2020";

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

async function getLeagues() {
    try {
        return axios.get(`${BASE_URL}/export?TYPE=leagueSearch&SEARCH=SafeLeagues+Dynasty&JSON=1`);
    } catch(err) {
        console.error(err);
    }
}

async function getDraftResults(id) {
    try {
        return axios.get(`${BASE_URL}/export?TYPE=draftResults&L=${id}&JSON=1`)
    } catch(err) {
        console.error(err);
    }
}

async function getPlayer(id) {
    try {
        return axios.get(`${BASE_URL}/export?TYPE=players&PLAYERS=${id}&JSON=1`)
    } catch(err) {
        console.error(err);
    }
}

async function getAllDraftResults() {
    let data;
    try {
        await axios.get('http://localhost:1376/leagues').then((resp) => {
            data = resp.data;
        }).catch((err) => {
            console.error(err);
        });
    } catch(err) {
        console.error(err);
    }
    return data;
}

app.get('/', async (req, res) => {
    let draftResults;
    try {
        draftResults = await getAllDraftResults();
        console.log(draftResults);
    } catch(err) {
        console.error(err);
    }

    // console.log("Player: " + draftResults[0].draftResult[0].player + " | " + " Timestamp: " + draftResults[0].draftResult[0].timestamp)
    res.send({draftResults});
});

app.get('/leagues', async (req, res) => {
    let leagues = {};
    let idList = [];
    let draftResult = [];
    await getLeagues().then((resp) => {
        leagues = resp.data.leagues.league;
        let leagueFilter = leagues.filter((el) => {
            return el.name.includes("(SF/TE)");
        });

        for(let i = 0; i < leagueFilter.length; i++) {
            idList.push(leagueFilter[i].id);
        }
    }).catch((err) => {
        console.error(err);
    });

    console.log("League IDS: " + idList.length);
    for(let i = 0; i < 30; i++) {
        await getDraftResults(idList[i]).then((resp) => {
            // console.log(resp.data.draftResults.draftUnit);
            if (resp.data.draftResults.draftUnit.draftPick !== undefined) {
                if (resp.data.draftResults.draftUnit.draftPick[0].timestamp > 1588309200) {
                    if(resp.data.draftResults.draftUnit.draftPick.length > 50) {
                        draftResult = draftResult.concat({
                            id: idList[i],
                            draft: resp.data.draftResults.draftUnit.draftPick
                        });
                        console.log("Good ID:", idList[i]);
                    } else {
                        console.log("ROOKIE DRAFT: " + resp.data.draftResults.draftUnit.draftPick.length);
                    }
                }

            } else {
                console.log("Empty Draft: ", resp.data.draftResults.draftUnit.draftPick);
            }
        }).catch((err) => {
            console.error(err);
        });
        sleep(2000);

    }
    res.send(draftResult);

});


app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

