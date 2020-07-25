import { DatabaseError } from "../error/database.error";
import HttpDatabaseError from "../error/http-error/http-database.error";
import { QueryFailedError } from "typeorm";
import HttpDupulicatedDataError from "../error/http-error/http-dupulicated-data.error";
import HttpInternalServerError from "../error/http-error/http-initial-server.error";
import { HttpIllegalValueError } from "../error/http-error/http-illegal-value.error";
import InvalidTokenError from "jwt-decode";
import HttpAuthorizedError from "../error/http-error/http-authorized.error";
import { NotFoundUserAccountError } from "../error/not-found-user-account.error";

export function SeparateError (error:Error):Error{
    if (error instanceof InvalidTokenError) {
        return new HttpAuthorizedError("invalid token");
    }
    if (error instanceof NotFoundUserAccountError) {
        return new HttpAuthorizedError("not found token user");
    }
    if (error instanceof DatabaseError) {
        return new HttpDatabaseError("database connection error",error);
    }
    if (error instanceof QueryFailedError) {
        //mysqlのエラーコードで分類
        //https://dev.mysql.com/doc/refman/5.6/ja/error-messages-server.html
        var sqlErrorNo: number = (error as any).number;
        switch (sqlErrorNo){
            case 1062 :
            case 1291 :  
                return new HttpDupulicatedDataError("dupulicate entry", error);
            case 1292:
                return new HttpIllegalValueError("invalid input", error); 
            default:
                return new HttpDatabaseError("server error ( database error )", error);
        }
    } else {
        return new HttpInternalServerError("server error",error);
    }
}