import { ormconfig } from "./ormconfig";
import { getConnection, Connection, createConnection } from "typeorm";
import { ConnectionNotFoundError } from "typeorm/error/ConnectionNotFoundError";
import { DatabaseError } from "../../error/database.error";

export function getDBConnection(): Promise<Connection>{

    //コネクションを取得する
    var createConnnectionFunc = (resolveFunc:(c:Connection)=>void, rejectFunc:(err:any)=>void) => {
        createConnection(ormconfig).then(
            (connction) => {
                resolveFunc(connction)
            },
            (reason) => rejectFunc( new DatabaseError("connection error",reason)));
    };

    return new Promise((resolveFunc,rejectFunc)=>{
        try{
            var c = getConnection();
            if(c.isConnected){
                resolveFunc(c);
            }else{
                createConnnectionFunc(resolveFunc, rejectFunc);
            }
        }catch(e){
            if (e instanceof ConnectionNotFoundError) {
                createConnnectionFunc(resolveFunc, rejectFunc);
            }else{
                rejectFunc( new DatabaseError("getConnection function error", e));
            }
        }
    });
}