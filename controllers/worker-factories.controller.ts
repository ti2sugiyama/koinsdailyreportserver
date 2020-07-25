import { JsonController,Get, Post, Delete, CurrentUser, BodyParam, Req } from 'routing-controllers'
import { UserAccount } from '../models/user-account';
import workerFactoriesService from '../services/workers/worker-factories.service';
import { WorkerFactory } from '../models/worker-factory';
import { SeparateError } from './error-separator';
import { Request } from 'express';
import { getQueryStringArray } from '../services/utils/utils.service';


@JsonController('/workerfactories')
export class WorkerFactoriesController {

    @Get('/')
    getAll(@CurrentUser({ required: true }) userAccount: UserAccount, 
        @Req() request:Request) {
        return new Promise((resolveFunc: (workerFactories:WorkerFactory[]) => void, rejectFunc: (err: any) => void) =>
            workerFactoriesService.getWorkerFactories({ 
                company_uid: userAccount.company_uid, 
                worker_uids: getQueryStringArray(request,"worker_uids"),
                yms: getQueryStringArray(request, "yyyyMMs")
            }).then(
                (workerFactories) => resolveFunc(workerFactories)
                ,(error:any)=>{
                    rejectFunc(SeparateError(error));
                 }
            )
        )
    }
    @Post('/')
    post(@CurrentUser({ required: true }) userAccount: UserAccount,@BodyParam("worker_uids") worker_uids:string[],@BodyParam("yyyyMMs") yyyyMMs:string[],@BodyParam("workerFactories") workerFactories:WorkerFactory[]) {
        return new Promise((resolveFunc: (value:string) => void, rejectFunc: (err: any) => void) =>
            workerFactoriesService.deleteinsert(
                {
                    company_uid: userAccount.company_uid,
                    worker_uids: worker_uids,
                    yms: yyyyMMs,

                },workerFactories,userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                }
            ));
    }

    @Delete('/')
    remove(@CurrentUser({ required: true }) userAccount: UserAccount, 
        @Req() request: Request) {
        return new Promise((resolveFunc: (ret:string) => void, rejectFunc: (err: any) => void) =>
            workerFactoriesService.delete({
                company_uid: userAccount.company_uid,
                worker_uids: getQueryStringArray(request, "worker_uids"),
                yms: getQueryStringArray(request, "yyyyMMs")
            }).then(
                () => resolveFunc("OK"),
                (error: any) => {
                    rejectFunc(SeparateError(error));
                }
            ));
    }
}