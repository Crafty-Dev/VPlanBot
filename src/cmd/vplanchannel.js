import fs from "fs";
import {removeVPlanChannel, setVPlanChannel} from "./api/dataManager.js";


/**
 *
 * @param args {String[]}
 * @param message {Message}
 */
export function executeCmdVPlanChannel(args, message){


    if (!fs.existsSync('./guildData.json'))
        fs.writeFileSync('./guildData.json', '{}', 'utf-8');

    if (args.length > 0) {

        if (args[0].toUpperCase() === 'REMOVE') {
            const json = fs.readFileSync('./guildData.json').toJSON();
            if (json[message.guild.id] !== undefined) {
                removeVPlanChannel(message.guild);
                message.channel.send(`**Removed Discord Server **${message.guild.name} **from daily posts**`);
            }
        }
        return;
    }

    setVPlanChannel(message.guild, message.channel);
    message.channel.send(`**Channel for daily posts has been set to **${message.channel.name}`);

}