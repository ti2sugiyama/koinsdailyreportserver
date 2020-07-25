import "reflect-metadata";  //routing-controllersの指示で読み込み
import jwtDecode from "jwt-decode";
import { Action, useExpressServer } from "routing-controllers"
import  Log4js from "log4js";
import https from 'https';
import HttpAuthorizedError from "./error/http-error/http-authorized.error";
import userAccountsService from "./services/user-accounts/user-accounts.service";
import { DatabaseError } from "./error/database.error";
import HttpDatabaseError from "./error/http-error/http-database.error";
const CONFIG = require('config');
let express = require("express");
let app = express();

//ssl設定
var fs = require('fs');
var serverOptions = {
  key: fs.readFileSync(CONFIG.SSL.key),
  cert: fs.readFileSync(CONFIG.SSL.cert),
  passphrase: 'ikara'
};
//log設定
const log4js_config = CONFIG.log4js;
Log4js.configure(<Log4js.Configuration>log4js_config);

//起動システム情報を書き出し
let logger = Log4js.getLogger("system");
logger.info("MODE = " +CONFIG.State.Mode);
logger.info("Version = " + CONFIG.State.Version);

//
let access_logger = Log4js.getLogger("access");
app.use(Log4js.connectLogger(access_logger,{}));

//受信データ上限設定
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', parameterLimit:100000,extended: true }))

//baseURL
app.locals.baseUrl = CONFIG.State.baseUrl

//expressサーバー設定(routing-controller使用)
useExpressServer(app,{
  cors: true,
  //(権限チェック+ユーザー取得)
  currentUserChecker: async (action: Action) => {
    const token = action.request.headers["authorization"];
    try{
      var tokendata:any = jwtDecode(token);
      var userAcount = await userAccountsService.getUserAccountByAuthID(tokendata['sub']);
      return userAcount;
    }catch(e){
      if (e instanceof DatabaseError){
        return new HttpDatabaseError("database connection error", e);
      }
      else{
        throw new HttpAuthorizedError("invalid token error",e);
      }
    }
  },
  defaultErrorHandler: false,
  controllers: [__dirname + "/controllers/*.ts", __dirname + "/controllers/*.js",],
  middlewares: [__dirname + "/middlewares/**/*.ts", __dirname + "/middlewares/**/*.js"],
  interceptors: [__dirname + "/interceptors/**/*.ts", __dirname + "/interceptors/**/*.js"],
});
//起動
https.createServer(serverOptions, app).listen(CONFIG.State.port);

logger.info("Server起動");

export {app};