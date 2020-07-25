import { Middleware, ExpressErrorMiddlewareInterface, HttpError } from "routing-controllers";
import Log4js from "log4js";

@Middleware({ type: "after" })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
    error(error: any, request: any, response: any, next: (err?: any) => any) {
        let logger = Log4js.getLogger("error");
        logger.error(error);

        if (error instanceof HttpError) {
            response.status(error.httpCode);
            response.json(
                {
                    name: error.name,
                    message:error.message
                });
        }else{
            next(error);
        }
        
    }
}