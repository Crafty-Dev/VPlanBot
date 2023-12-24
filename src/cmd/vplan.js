import * as API from "./api/api.js";


/**
 *
 * @param args {String[]}
 * @param message {Message}
 */
export function executeCmdVPlan(args, message) {

    if (args.length === 0) {
        const date = new Date;
        if (date.getDay() === 6 || date.getDay() === 0)
            API.postSubstitutionPlanByDay(1, message.channel);
        else
            API.postSubstitutionPlanByDay(date.getDay(), message.channel);
        return;
    }

    if (args[0].includes('.')) {
        const dateData = args[0].split('.');

        const day = parseInt(dateData[0]);
        var month = parseInt(dateData[1]);
        var year = parseInt(dateData[2]);

        if (dateData[1] === '' || dateData.length < 2)
            month = new Date().getMonth() + 1;

        if (dateData[2] === '' || dateData.length < 3)
            year = new Date().getFullYear();

        if (isNaN(day) || isNaN(month) || isNaN(year) || dateData.length > 3) {
            message.channel.send(":x: **Enter a valid date or day!** :x:")
            return;
        }

        const date = new Date(year, month - 1, day);
        API.postSubstitutionPlanByDate(date, message.channel);
    }

    var day;

    switch (args[0].toUpperCase()) {
        case 'MONTAG':
        case 'MONDAY':
        case '1':
            day = 1;
            break;
        case 'DIENSTAG':
        case 'TUESDAY':
        case '2':
            day = 2;
            break;
        case 'MITTWOCH':
        case 'Wednesday':
        case '3':
            day = 3;
            break;
        case 'DONNERSTAG':
        case 'THURSDAY':
        case '4':
            day = 4;
            break;
        case 'FREITAG':
        case 'FRIDAY':
        case '5':
            day = 5;
            break;
        case 'SAMSTAG':
        case 'SATURDAY':
        case '6':
            message.channel.send('**NEIN!**');
            return;
        case 'SONNTAG':
        case 'SUNDAY':
        case '7':
            message.channel.send('**NEIN! NEIN!**');
            return;
        default:
            return;

    }

    API.postSubstitutionPlanByDay(day, message.channel);

}