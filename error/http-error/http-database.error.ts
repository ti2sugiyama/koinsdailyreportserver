import { HttpError } from "routing-controllers";
import { HttpErrorInterface } from "./http-error-interface";

export default class HttpDatabaseError extends HttpError implements HttpErrorInterface {
    public error: any;

    constructor(message: string, error?: any) {
        super(500, message);
        Object.setPrototypeOf(this, HttpDatabaseError.prototype);
        this.error = error;
    }

    toJSON() {
        return {
            status: this.httpCode,
            message: this.message
        }
    }
}