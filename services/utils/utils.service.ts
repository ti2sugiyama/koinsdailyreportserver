
import { Request } from "express";
import { plainToClass } from "class-transformer";

export function generateUid(): string{
    let chars = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".split("");
    for (let i = 0, len = chars.length; i < len; i++) {
        switch (chars[i]) {
            case "x":
                chars[i] = Math.floor(Math.random() * 16).toString(16);
                break;
            case "y":
                chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                break;
        }
    }
    return chars.join("");
}

export function getQueryStringArray(request:Request,queryName:string):string[]|undefined{
    var query = request.query[queryName];
    if(query===undefined){
        return query;
    }
    if(!Array.isArray(query)){
        return (query as string).split(",");
    }else{
        return query as string[];
    }
}

export function getQueryDateArray(request: Request, queryName: string): Date[] | undefined {
    var query = request.query[queryName];
    if (query === undefined) {
        return query;
    }
    if (!Array.isArray(query)) {
        return plainToClass(Date,(query as string).split(","));
    } else {
        return plainToClass(Date,query as string[]);
    }
}

export function formatDate(date: Date, format = "yyyyMMdd") {
    format = format.replace(/yyyy/g, date.getFullYear() + "");
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/dd/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/M/g, (date.getMonth() + 1) + "");
    format = format.replace(/d/g, (date.getDate() + ""));
    format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
    format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
    format = format.replace(/aaa/g, (['日', '月', '火', '水', '木', '金', '土'])[date.getDay()]);
    return format;
};


/**
 * 分を HH:MM形式に変換する
 * @param minutes 分
 * @return HH:MM
 */
export function getHHMMFromMinutes(minutes: number): string {
    return Math.floor(minutes / 60) + ":" + ("0" + (minutes % 60)).slice(-2);
}