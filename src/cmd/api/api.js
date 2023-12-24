import * as fs from "fs";
import puppeteer, {Page} from 'puppeteer';
import {getDailyPostChannels, getPassword, getUsername} from "./dataManager.js";
import {client, postTimeH, postTimeM, postTimeMs, postTimeS} from "../../main.js";
import { TextChannel } from "discord.js";

async function postSubstitutionPlanByDay(day, channel) {
    //WebBrowser Setup
    console.log('Retrieving new VPlan...');
    const browser = await setupBrowser();

    const week = currentWeek(new Date);

    const motd = await getMOTD(await browser.newPage(), day, week);
    const element = await getSubstitutionPlanElement(await browser.newPage(), day, week);


    if (element === undefined) {
        channel.send(`:x: **Es konnte kein Vertretungsplan für **${getDayName(day)} **gefunden werden!**`);
        await browser.close();
        return;
    }

    let substitutionFiles = Array.of(element);
    if (motd !== undefined)
        substitutionFiles.unshift(motd)

    channel.send({
        content: `**Vertretungsplan für **${getDayName(day)}`,
        files: substitutionFiles
    })

    await browser.close();
}

/**
 *
 * @param {Date} date
 * @param {TextChannel} channel
 */
export async function postSubstitutionPlanByDate(date, channel) {

    const dayString = (date.getDate() < 10 ? '0' : '') + date.getDate();
    const monthString = (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1);

    const dateString = `${dayString}.${monthString}.${date.getFullYear()}`;

    //WebBrowser Setup
    console.log('Retrieving new VPlan...');
    const browser = await setupBrowser();

    const day = date.getDay();
    const week = currentWeek(date);

    const motd = await getMOTD(await browser.newPage(), day, week);
    const element = await getSubstitutionPlanElement(await browser.newPage(), day, week);

    if (element === undefined) {
        channel.send(`:x: **Es konnte kein Vertretungsplan für den **${dateString} **gefunden werden!**`);
        await browser.close();
        return;
    }

    let substitutionFiles = Array.of(element);
    if (motd !== undefined)
        substitutionFiles.unshift(motd)

    channel.send({
        content: `**Vertretungsplan für **${getDayName(day)} **den** ${dateString}`,
        files: substitutionFiles
    })

    await browser.close();
}


/**
 *
 * @param {Date} date
 * @returns The week of the given date. If the day of the date is a weekend day, the next week is returned
 */
export function currentWeek(date) {
    const isWeekEnd = date.getDay() === 6 || date.getDay() === 0;
    var dayNr = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - dayNr + 3);

    var firstThursday = date.valueOf();
    date.setMonth(0, 1);

    if (date.getDay() != 4) {
        date.setMonth(0, 1 + ((4 - date.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - date) / 604800000) + (isWeekEnd ? 1 : 0);
}

export function getDayName(day) {
    switch (day) {
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


export async function getSubstitutionPlanElement(page, day, week) {

    if (week < 10)
        week = "0" + week;

    try {
        await page.goto(`https://${getUsername()}:${getPassword()}@hoelty-celle.de/vertretungsplan/vplan/${week}/w/w00000.htm`);
    } catch (e) {
        return;
    }

    const all = await page.$$('table.subst');
    return await all[day - 1].screenshot();
}

export async function getMOTD(page, day, week) {
    const data = JSON.parse(fs.readFileSync('./data.json'));

    if (week < 10)
        week = "0" + week;

    try {
        await page.goto(`https://${getUsername()}:${getPassword()}@hoelty-celle.de/vertretungsplan/vplan/${week}/w/w00000.htm`);
    } catch (e) {
        return;
    }

    const motdIndex = await getMOTDIndex(page, day)
    if (motdIndex === undefined)
        return;

    const all = await page.$$("tbody");

    return await all[motdIndex].screenshot();
}

export async function setupBrowser() {
    console.log("Launching Browser...")
    const browser = await puppeteer.launch({
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        args: ['--no-sandbox']
    });
    return browser;
}

/**
 *
 * @param {Page} page
 */
export async function getMOTDIndex(page, day) {
    const tables = await page.$$("table");

    let substIndexes = [];
    for (let i = 0; i < tables.length; i++) {

        const className = await (await tables[i].getProperty("className")).jsonValue();
        if (className === "subst")
            substIndexes.push(i);
    }

    const motdIndex = substIndexes[day - 1] - 1;
    if (motdIndex < 0)
        return;

    if (await (await (await page.$$("table"))[motdIndex].getProperty("className")).jsonValue() === "subst")
        return;

    return motdIndex;
}

export function updateDailyPostTimer() {
    const current = new Date();
    const postDate = new Date(Date.UTC(current.getFullYear(), current.getMonth(), current.getDate(), postTimeH, postTimeM, postTimeS, postTimeMs));
    console.log(`Daily Post Time has been set to: ${postDate}`)
    var postMillis = postDate - current;
    if (postMillis < 0)
        postMillis += 86400000;

    setTimeout(async function () {

        const browser = await setupBrowser();
        const date = new Date;

        if (date.getDay() > 4) {
            //Ensure that we are not in the same millisecond
            await new Promise(resolve => setTimeout(resolve, 1));
            updateDailyPostTimer();
            console.log('Skipped daily post because it\'s weekend...');
            return;
        }

        const day = date.getDay() + 1;
        const week = API.currentWeek(date);

        const motd = await API.getMOTD(await browser.newPage(), day, week);
        const element = await API.getSubstitutionPlanElement(await browser.newPage(), day, week);

        if (element === undefined) {
            console.log('Skipped daily post because no VPlan is present...');
            return;
        }

        let substitutionFiles = Array.of(element);

        if (motd !== undefined)
            substitutionFiles.unshift(motd)

        const dailyPostChannels = getDailyPostChannels();

        Object.keys(dailyPostChannels).forEach(key => {

            const channel = client.guilds.cache.get(key).channels.cache.get(dailyPostChannels[key]);
            channel.send({
                content: `_Daily VPlan_ - **Vertretungsplan für **${API.getDayName(day)}`,
                files: substitutionFiles
            })
        });
        await browser.close();
        //Ensure that we are not in the same millisecond
        await new Promise(resolve => setTimeout(resolve, 1));
        updateDailyPostTimer();
    }, postMillis);
}


export function setSpecialEventTimer(date, handler, posted){

    const current = new Date();

    if(date - current <= 0 && posted)
        date.setFullYear(current.getFullYear() + 1);

    console.log(Math.min(Math.pow(2, 32) / 2 - 1, date - current))


    setTimeout(async  () => {

        const currentDate = new Date();

        if(date - currentDate <= 0) {
            handler();
            setSpecialEventTimer(date, handler, true);
            return;
        }

        setSpecialEventTimer(date, handler, false);


    }, Math.min(Math.pow(2, 32) / 2 - 1, date - current));

}