import { HttpError } from "routing-controllers";
import { HttpErrorInterface } from "./http-error-interface";

export class HttpIllegalValueError extends HttpError implements HttpErrorInterface {
    public error: any;
    constructor(message: string, error?: any) {
        super(405, message);
        Object.setPrototypeOf(this, HttpIllegalValueError.prototype);
        this.error = error;
    }

    toJSON() {
        return {
            status: this.httpCode,
            message: this.message
        }
    }
}