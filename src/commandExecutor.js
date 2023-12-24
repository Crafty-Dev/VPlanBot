import * as API from "./cmd/api/api.js";
import {executeCmdVPlan} from "./cmd/vplan.js";
import {executeCmdVPlanChannel} from "./cmd/vplanchannel.js";


/**
 *
 * @param command {String}
 * @param args {String[]}
 * @param message {Message}
 */
export function executeCommand(command, args, message) {

    switch (command.toLowerCase()) {

        case "vplan":
            executeCmdVPlan(args, message);
            break;
        case "vplanchannel":
            executeCmdVPlanChannel(args, message);
            break;

    }

}




