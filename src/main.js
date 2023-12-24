import {Client, GatewayIntentBits, ActivityType} from 'discord.js';
import * as fs from 'fs';
import * as API from './cmd/api/api.js';
import {executeCommand} from "./commandExecutor.js";
import {getDailyPostChannels, getDiscordToken, initDataManager} from "./cmd/api/dataManager.js";
import {updateDailyPostTimer, setSpecialEventTimer} from "./cmd/api/api.js";

const PREFIX = '!';

export const postTimeH = 16; //18
export const postTimeM = 0; //30
export const postTimeS = 0; //0
export const postTimeMs = 0; //0


export const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});


//Event Handling

client.on('ready', () => {

    client.user.setActivity({
        type: ActivityType.Listening,
        name: "!vplan"
    })


    console.log(`Bot is online as ${client.user.tag}`);
    updateDailyPostTimer();


    //Setup special events
    const current = new Date();
    const christmasDate = new Date(Date.UTC(current.getFullYear(), 11, 24, 19, 0, 0, 0));

    //Christmas
    setSpecialEventTimer(christmasDate, () => {
        const dailyPostChannels = getDailyPostChannels();
        console.log("Sending Christmas Greetings...")

        Object.keys(dailyPostChannels).forEach(guildId => {

            /**
             *
             * @type {TextChannel}
             */
            const channel = client.guilds.cache.get(guildId).channels.cache.get(dailyPostChannels[guildId]);
            channel.send(":christmas_tree::santa::christmas_tree: **Frohe Weihnachten!** :christmas_tree::santa::christmas_tree:");

        });
    }, false);
    console.log(`Christmas Greetings have been set to: ${christmasDate}`)

});

client.on('messageCreate', (message) => {
    if (!message.content.startsWith(PREFIX))
        return;

    const command = message.content.split(' ')[0].replace(PREFIX, '');
    const args = message.content.split(' ');
    args.shift();

    executeCommand(command, args, message);

});

//Start
console.log("Starting Bot...")

initDataManager();
client.login(getDiscordToken());


