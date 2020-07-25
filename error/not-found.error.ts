import { DatabaseError } from "./database.error";

export class NotFoundError extends DatabaseError {
    notfoundkey:string;
    constructor(notfoundkey: string) {
        super("NotFound Data");
        this.notfoundkey = notfoundkey;
    }
}