import { JsonController, Param, Body, Get, Post, Delete, CurrentUser, NotFoundError, InternalServerError, QueryParam, Req } from 'routing-controllers'
import workersService from '../services/workers/workers.service'
import { Worker } from '../models/worker';
import { UserAccount } from '../models/user-account';
import { SeparateError } from './error-separator';
import { getQueryStringArray } from '../services/utils/utils.service';
import { Request } from 'express';
/**
 * WorkersController
 */
@JsonController('/workers')
export class WorkersController {
    @Get('/')
    getAll(@CurrentUser({ required: true }) userAccount: UserAccount, @QueryParam("allflg") allflg: boolean) {
        return new Promise((resolveFunc: (workers: Worker[]) => void, rejectFunc: (err: any) => void) =>
            workersService.getWorkers({ company_uid: userAccount.company_uid,allflg:allflg}).then(
                (workers) => resolveFunc(workers),
                (error:any)=>{
                    rejectFunc(SeparateError(error));
                 }
            )
        )
    }

    @Get('/:uid')
    getOne(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('uid') uid: string, @QueryParam("allflg") allflg: boolean) {
        return new Promise((resolveFunc:(worker:Worker)=>void,rejectFunc:(err:any)=>void)=>
            workersService.getWorker({ company_uid: userAccount.company_uid, uid:uid,allflg:allflg}).then(
                (worker) => resolveFunc(worker)
                ,(error:any) => {
                    if(error === undefined){
                        rejectFunc( new NotFoundError(uid+" is not found"));
                    }else {
                        rejectFunc(SeparateError(error));
                     }
                }
            ));
    }

    @Post('/')
    post(@CurrentUser({ required: true }) userAccount: UserAccount, @Body() workers:Worker[]) {

        return new Promise((resolveFunc: (value:string) => void, rejectFunc: (err: any) => void) =>
            workersService.save(workers,userAccount.company_uid,userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }

    @Delete('/')
    remove(@CurrentUser({ required: true }) userAccount: UserAccount, @Req() request: Request) {
        return new Promise((resolveFunc: (ret:string) => void, rejectFunc: (err: any) => void) =>
            workersService.delete({ company_uid: userAccount.company_uid, worker_uids: getQueryStringArray(request, "uids") },userAccount.uid).then(
                () => resolveFunc("OK"),
                (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }

    @Delete('/:uid')
    removeOne(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('uid') uid: string) {
        return new Promise((resolveFunc: (ret:string) => void, rejectFunc: (err: any) => void) =>
            workersService.delete({ company_uid: userAccount.company_uid, worker_uids: [uid] },userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }
}