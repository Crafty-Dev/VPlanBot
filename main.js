const {Client, Intents, TextChannel} = require('discord.js');
const puppeteer = require("puppeteer");
const fs = require('fs');

const PREFIX = '-';

const client = new Client({intents: ['GUILDS', 'GUILD_MESSAGES']});

client.on('ready', () => {

    client.user.setActivity({
        type: 'LISTENING',
        name: 'hoelty-celle.de'
    });
    console.log(`Bot is online as ${client.user.tag}`);

});

client.on('messageCreate', (message) => {
    if(!message.content.startsWith(PREFIX))
    return;

    const command = message.content.split(' ')[0].replace(PREFIX, '');
    const args = message.content.split(' ');
    args.shift();
    
    //Commands
    if(command === 'vplan'){

        if(args.length === 0){
            const date = new Date;
            const day = date.getDay();
            if(day > 5)
                postSubstitutionPlan(0, message.channel);
            else
                postSubstitutionPlan(day - 1, message.channel);    
            return;
        }

        switch(args[0].toUpperCase()){
            case 'MONTAG': case 'MONDAY': case '1':
                postSubstitutionPlan(0, message.channel);
                break;
            case 'DIENSTAG': case 'TUESDAY': case '2':
                postSubstitutionPlan(1, message.channel);
                break;
            case 'MITTWOCH': case 'Wednesday': case '3':
                postSubstitutionPlan(2, message.channel);
                break;
            case 'DONNERSTAG': case 'THURSDAY': case '4':
                postSubstitutionPlan(3, message.channel);
                break;
            case 'FREITAG': case 'FRIDAY': case '5':
                postSubstitutionPlan(4, message.channel);
                break;
            case 'SAMSTAG': case 'SATURDAY': case '6':
                message.channel.send('**NEIN!**');
                break;
            case 'SONNTAG': case 'SUNDAY': case '7':
                message.channel.send('**NEIN! NEIN!**');
                break;                

        }

    }
});

client.login(JSON.parse(fs.readFileSync('./data.json')).discordToken);



/**
 * 
 * @param {*} day 
 * @param {TextChannel} channel 
 */
function postSubstitutionPlan(day, channel){
    (async() => {

        //WebBrowser Setup
        console.log('Retrieving new VPlan...');
        const browser = await puppeteer.launch({
            defaultViewport: {
                width: 1920,
                height: 1080
            },
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
            
        //WebBrowser Functions
        
        const week = currentWeek();
        const data = JSON.parse(fs.readFileSync('./data.json'));

        await page.goto(`https://${data.username}:${data.password}@hoelty-celle.de/vertretungsplan/vplan/${week}/w/w00000.htm`);
    
        const all = await page.$$('table.subst');
        const element = all[day];
        
        var dayName;

        switch(day){
            case 0:
                dayName = 'Montag';
                break;
            case 1:
                dayName = 'Dienstag';
                break;
            case 2:
                dayName = 'Mittwoch';
                break;
            case 3:
                dayName = 'Donnerstag';
                break;
            case 4:
                dayName = 'Freitag';
                break;
            default:
                dayName = 'Keine Ahnung';
        }

        channel.send({
            content: `**Vertretungsplan für **${dayName}`,
            files: [await element.screenshot()]
        })

        await browser.close();
    })();
}


function currentWeek() {
    var date = new Date;
    var dayNr = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - dayNr + 3);

    var firstThursday = date.valueOf();

    date.setMonth(0, 1);
    if (date.getDay() != 4) {
        date.setMonth(0, 1 + ((4 - date.getDay()) + 7) % 7);
    }

    return (1 + Math.ceil((firstThursday - date) / 604800000)) + (date.getDay() > 5 ? 1 : 0);
}