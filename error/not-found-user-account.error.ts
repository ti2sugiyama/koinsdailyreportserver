import { ServerError } from "./server.error";

export class NotFoundUserAccountError extends ServerError {
    notfoundkey:string;
    constructor(notfoundkey: string) {
        super("NotFound UserAccount Data");
        this.notfoundkey = notfoundkey;
    }
}