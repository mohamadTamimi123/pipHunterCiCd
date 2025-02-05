import app from './app';

import passport from "passport";


import './libs/passportjs/auth'
import './libs/passportjs/google-strategy'




import {sequelize} from "./libs/sequelize/src/db";
import config from "./config";


async function main() {
    try {

        await sequelize.sync()

        app.listen(config.port, () => {
            console.log(`Example app listening on port ${config.port}`);
        });
    } catch (err) {
        console.log(err);
    }
}


main();
