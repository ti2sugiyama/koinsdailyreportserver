//from https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Error

export class ServerError extends Error {
    constructor(message:string = '', ...params:any) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ServerError);
        }

        this.name = 'ServerError';
        this.message = message;
    }
}