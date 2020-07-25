import {  InternalServerError } from "routing-controllers";
import { HttpErrorInterface } from "./http-error-interface";

export default class HttpInternalServerError extends InternalServerError implements HttpErrorInterface{
    error:any;
    constructor(message:string,error:any)  {
        super(message);
        this.error = error;
    }
}