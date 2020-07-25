import { HttpError } from "routing-controllers";
import { HttpErrorInterface } from "./http-error-interface";

export default class HttpAuthorizedError extends HttpError implements HttpErrorInterface {
    public error:any;

    constructor(message: string,error?:any)  {
        super(401,message);
        Object.setPrototypeOf(this, HttpAuthorizedError.prototype);
        this.error = error;
    }

    toJSON() {
        return {
            status: this.httpCode,
            message: this.message
        }
    }
}