import { JsonController, Param, Body, Get, Post, Delete, CurrentUser } from 'routing-controllers'
import { UserAccount } from '../models/user-account';
import workerFactoriesService from '../services/workers/worker-factories.service';
import { WorkerFactory } from '../models/worker-factory';
import { SeparateError } from './error-separator';

@JsonController('/workers/:worker_uid/ym/:yyyyMM/factories')
export class WorkerFactoriesInWorkerController {
    @Get('/')
    getAll(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('worker_uid') worker_uid: string, @Param('yyyyMM') yyyyMM:string) {
        return new Promise((resolveFunc: (workerFactories:WorkerFactory[]) => void, rejectFunc: (err: any) => void) =>
            workerFactoriesService.getWorkerFactories({ company_uid: userAccount.company_uid, worker_uids: [worker_uid], yms: [yyyyMM]}).then(
                (workerFactories) => resolveFunc(workerFactories)
                ,(error:any)=>{
                    rejectFunc(SeparateError(error));
                 }
            )
        )
    }
    @Post('/')
    post(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('worker_uid') worker_uid: string, @Param('yyyyMM') yyyyMM: string,@Body() workerFactories:WorkerFactory[]) {
        return new Promise((resolveFunc: (value:string) => void, rejectFunc: (err: any) => void) =>
            workerFactoriesService.deleteinsert(
                {
                    company_uid: userAccount.company_uid,
                    worker_uids: [worker_uid],
                    yms: [yyyyMM],

                },workerFactories,userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                }
            ));
    }

    @Delete('/')
    remove(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('worker_uid') worker_uid: string, @Param('yyyyMM') yyyyMM: string) {
        return new Promise((resolveFunc: (ret:string) => void, rejectFunc: (err: any) => void) =>
            workerFactoriesService.delete({ company_uid: userAccount.company_uid, worker_uids: [worker_uid], yms: [yyyyMM]}).then(
                () => resolveFunc("OK"),
                (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }
}