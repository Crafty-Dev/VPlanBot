import fs from "fs";


const POST_CHANNELS = "./dailyPostChannels.json";
const DATA = "./data.json";

function readFileToJson(file) {
    return JSON.parse(fs.readFileSync(file).toString())
}


export function initDataManager() {

    console.log("Initializing files...")

    const dataJson = {
        discordToken: null,
        username: null,
        password: null
    }

    const dailyPostData = {
        postChannels: {}
    }


    if (!fs.existsSync(DATA))
        fs.writeFileSync(DATA, JSON.stringify(dataJson))

    if (!fs.existsSync(POST_CHANNELS))
        fs.writeFileSync(POST_CHANNELS, JSON.stringify(dailyPostData))


    console.log("All files have been initialized")
}

//General Data
export function getDiscordToken() {
    return readFileToJson(DATA)["discordToken"];
}

export function getUsername() {
    return readFileToJson(DATA)["username"];
}

export function getPassword() {
    return readFileToJson(DATA)["password"];
}


//VPlan Data
export function getDailyPostChannels() {
    return readFileToJson(POST_CHANNELS)["postChannels"];
}

/**
 *
 * @param guild {Guild}
 * @param channel {TextChannel}
 */
export function setVPlanChannel(guild, channel) {

    const json = readFileToJson(POST_CHANNELS);
    json.postChannels[guild.id] = channel.id;
    fs.writeFileSync(POST_CHANNELS, JSON.stringify(json, 4));

    console.log(json)
}

/**
 *
 * @param guild {Guild}
 */
export function removeVPlanChannel(guild) {

    const json = readFileToJson(POST_CHANNELS);
    delete json.postChannels[guild.id];
    fs.writeFileSync(POST_CHANNELS, JSON.stringify(json, 4))
}