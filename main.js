const {Client, Intents, TextChannel} = require('discord.js');
const puppeteer = require("puppeteer");
const fs = require('fs');

const PREFIX = '!';

const client = new Client({intents: ['GUILDS', 'GUILD_MESSAGES']});

client.on('ready', () => {

    client.user.setActivity({
        type: 'LISTENING',
        name: '!vplan'
    });
    console.log(`Bot is online as ${client.user.tag}`);
    updateDailyPostTimer();

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

    if(command === 'vplanchannel'){

        if(!fs.existsSync('./guildData.json'))
        fs.writeFileSync('./guildData.json', '{}', 'utf-8');

        if(args.length > 0){

            if(args[0].toUpperCase() === 'REMOVE'){
                const json = JSON.parse(fs.readFileSync('./guildData.json'));
                if(json[message.guild.id] !== undefined){
                    delete json[message.guild.id];
                    fs.writeFileSync('./guildData.json', JSON.stringify(json), 'utf-8');
                    message.channel.send(`**Removed Discord Server **${message.guild.name} **from daily posts**`);
                }
            }
            return;
        }
        
        const json = JSON.parse(fs.readFileSync('./guildData.json'));
        json[message.guild.id] = message.channel.id;
        fs.writeFileSync('./guildData.json', JSON.stringify(json), 'utf-8'); 
        message.channel.send(`**Channel for daily posts has been set to **${message.channel.name}`);
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


async function updateDailyPostTimer(){
    console.log('Init');
    const current = new Date();
    const postDate = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 5, 0, 0, 0);
    var postMillis = postDate - current;
    if(postMillis < 0)
        postMillis += 86400000;

    setTimeout(async function() {

        if(!fs.existsSync('./guildData.json')){
            //Ensure that we are not in the same millisecond
            await new Promise(resolve => setTimeout(resolve, 1));
            updateDailyPostTimer();
            console.log('Skipped daily post because guildData file is not present...');
            return;
        }
         
        const json = JSON.parse(fs.readFileSync('./guildData.json'));    
        const browser = await setupBrowser();
        const date = new Date;

        if(date.getDay() > 5){
            //Ensure that we are not in the same millisecond
            await new Promise(resolve => setTimeout(resolve, 1));
            updateDailyPostTimer();
            console.log('Skipped daily post because it\'s weekend...');
            return;
        }

        const day = date.getDay();
        const week = currentWeek(date);

        const element = await getSubstitutionPlanElement(await browser.newPage(), day, week);
        const screenshot = await element.screenshot();
    
        Object.keys(json).forEach(key => {
    
            const channel = client.guilds.cache.get(key).channels.cache.get(json[key]);
            channel.send({
                content: `_Daily VPlan_ - **Vertretungsplan für **${getDayName(day)}`,
                files: [screenshot]
            })
        });
        await browser.close();
        //Ensure that we are not in the same millisecond
        await new Promise(resolve => setTimeout(resolve, 1));
        updateDailyPostTimer();
    }, postMillis);
}
