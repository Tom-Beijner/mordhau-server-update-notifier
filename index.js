const fetch = require("node-fetch");
const fs = require("fs");
const { promisify } = require("util");

const writeFile = promisify(fs.writeFile);

const config = require("./config.json");

let lastUpdate;

try {
    lastUpdate = parseInt(fs.readFileSync("./lastupdate", "utf8"));
} catch {
    fs.writeFileSync("./lastupdate", "0");
}

async function updateLastUpdate(timestamp) {
    await writeFile("./lastupdate", timestamp);
}

async function send(embed) {
    return fetch(config.webhook, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: config.mention_role_id && `<@&${config.mention_role_id}>`,
            embeds: [embed],
        }),
    });
}

async function getMordhauLatestUpdate() {
    const res = await fetch(`https://api.steamcmd.net/v1/info/629800`, {
        headers: { "Content-Type": "application/json" },
    });
    return (await res.json()).data["629800"].depots.branches.public;
}

async function main() {
    console.log(`Will check update for Mordhau`);

    try {
        const mordhauLatestUpdate = await getMordhauLatestUpdate();
        console.log(mordhauLatestUpdate.timeupdated);
        if (lastUpdate < parseInt(mordhauLatestUpdate.timeupdated)) {
            console.log(
                `Update available (BuildID: ${mordhauLatestUpdate.buildid})`
            );
            await updateLastUpdate(mordhauLatestUpdate.timeupdated);

            lastUpdate = parseInt(mordhauLatestUpdate.timeupdated);

            console.log("Sending message using webhook");
            await send({
                title: `Mordhau Server Update`,
                description: [
                    `BuildID: ${mordhauLatestUpdate.buildid}`,
                    // `Updated At: ${mordhauLatestUpdate.timeupdated}`,
                    "",
                    "An update is available for Mordhau servers",
                    "Make sure to restart servers",
                ].join("\n"),
            });
        }
    } catch (error) {
        console.error(
            `Failed to check for update (Error: ${error.message || error})`
        );
    }
}

console.log("Mordhau update notifier initiated");
setInterval(async () => await main(), 300000);
