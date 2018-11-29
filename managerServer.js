const Koa = require('koa');
const Router = require('koa-router');
const controller = require('./managerController')

const app = new Koa();
const router = new Router();


const config =require('./config');

function startServer () {
    router.get('/db/cycleInfo', controller.dbCycle)
    router.get('/rt/cycleInfo', controller.rtCycle)
    

    app.use(router.routes())
        .use(router.allowedMethods());
    
    app.listen(config.managerPort)
    console.log("Manage server listen in " + config.managerPort)
}
module.exports = {
    startServer
} 