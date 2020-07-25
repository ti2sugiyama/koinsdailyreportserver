import { ServerError } from "./server.error";

export class DatabaseError extends ServerError {
    err:any;
    constructor(message: string,err?:any) {
        console.log(message,err);
        super("DatabaseError", message);
        if(err){
            this.err = err;
        }else{
            this.err = undefined;
        }
    }
}