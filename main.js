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
            if(date.getDay() > 5)
                postSubstitutionPlanByDay(1, message.channel);
            else
                postSubstitutionPlanByDay(date.getDay(), message.channel);    
            return;
        }

        if(args[0].includes('.')){
            const dateData = args[0].split('.');
            const day = parseInt(dateData[0]);
            var month = parseInt(dateData[1]);
            var year = parseInt(dateData[2]);
            
            if(dateData[1] === '')
                month = new Date().getMonth() + 1;

            if(dateData[2] === '' || dateData.length === 2)
                year = new Date().getFullYear();

            if(isNaN(day) || isNaN(month) || isNaN(year))
                return;

            const date = new Date(year, month - 1, day);
            postSubstitutionPlanByDate(date, message.channel);
        }

        var day;

        switch(args[0].toUpperCase()){
            case 'MONTAG': case 'MONDAY': case '1':
                day = 1;
                break;
            case 'DIENSTAG': case 'TUESDAY': case '2':
                day = 2;
                break;
            case 'MITTWOCH': case 'Wednesday': case '3':
                day = 3;
                break;
            case 'DONNERSTAG': case 'THURSDAY': case '4':
                day = 4;
                break;
            case 'FREITAG': case 'FRIDAY': case '5':
                day = 5;
                break;
            case 'SAMSTAG': case 'SATURDAY': case '6':
                message.channel.send('**NEIN!**');
                return;
            case 'SONNTAG': case 'SUNDAY': case '7':
                message.channel.send('**NEIN! NEIN!**');
                return;
            default:
                return;                    

        }

        postSubstitutionPlanByDay(day, message.channel);

    }
});

client.login(JSON.parse(fs.readFileSync('./data.json')).discordToken);



async function postSubstitutionPlanByDay(day, channel){
        //WebBrowser Setup
        console.log('Retrieving new VPlan...');
        const browser = await setupBrowser();
            
        
        const week = currentWeek(new Date);
        const element = await getSubstitutionPlanElement(await browser.newPage(), day, week);

        channel.send({
            content: `**Vertretungsplan für **${getDayName(day)}`,
            files: [await element.screenshot()]
        })

        await browser.close();
}

/**
 * 
 * @param {Date} date 
 * @param {TextChannel} channel 
 */
async function postSubstitutionPlanByDate(date, channel){

        const dayString = (date.getDate() < 10 ? '0' : '') + date.getDate();
        const monthString = (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1);

        const dateString = `${dayString}.${monthString}.${date.getFullYear()}`;

        //WebBrowser Setup
        console.log('Retrieving new VPlan...');
        const browser = await setupBrowser();            
        
        const day = date.getDay();
        const week = currentWeek(date);

        const element = await getSubstitutionPlanElement(await browser.newPage(), day, week);

        if(element === undefined){
            channel.send(`:x: **Es konnte kein Vertretungsplan für den **${dateString} **gefunden werden!**`);
            return;
        }

        channel.send({
            content: `**Vertretungsplan für **${getDayName(day)} **den** ${dateString}`,
            files: [await element.screenshot()]
        })

        await browser.close();
    }


/**
 * 
 * @param {Date} date 
 * @returns The week of the given date. If the day of the date is a weekend day, the next week is returned
 */
function currentWeek(date) {
    const isWeekEnd = date.getDay() > 5;
    var dayNr = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - dayNr + 3);

    var firstThursday = date.valueOf();
    date.setMonth(0, 1);
    if (date.getDay() != 4) {
        date.setMonth(0, 1 + ((4 - date.getDay()) + 7) % 7);
    }
;    return 1 + Math.ceil((firstThursday - date) / 604800000) + (isWeekEnd ? 1 : 0);
}

function getDayName(day){
    switch(day){
        case 1:
            return 'Montag';
        case 2:
            return 'Dienstag';
        case 3:
            return 'Mittwoch';
        case 4:
            return 'Donnerstag';
        case 5:
            return 'Freitag';
        default:
            return 'Keine Ahnung';
    }
}


async function getSubstitutionPlanElement(page, day, week){
    const data = JSON.parse(fs.readFileSync('./data.json'));

    try {
        await page.goto(`https://${data.username}:${data.password}@hoelty-celle.de/vertretungsplan/vplan/${week}/w/w00000.htm`);
    }catch(e){
        return;
    }

    const all = await page.$$('table.subst');
    return element = all[day - 1];
}


async function setupBrowser(){
    const browser = await puppeteer.launch({
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        args: ['--no-sandbox']
    });
    return browser;
}