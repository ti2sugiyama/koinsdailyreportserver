import { NotFoundError } from "routing-controllers";
import { HttpErrorInterface } from "./http-error-interface";

export default class HttpNotFoundError extends NotFoundError implements HttpErrorInterface{
    error:any;
    constructor(message:string,error:any)  {
        super(message);
        this.error = error;
    }
}