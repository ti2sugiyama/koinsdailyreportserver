import { ServerError } from "./server.error";

export class IllegalValueError extends ServerError {
    constructor(message: string) {
        super("IllegalValueError", message);
    }
}