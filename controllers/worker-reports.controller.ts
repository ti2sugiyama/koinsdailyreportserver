import { JsonController, Param, Get, Post, Delete, CurrentUser, QueryParam, BodyParam, Req } from 'routing-controllers'
import { UserAccount } from '../models/user-account';
import { SeparateError } from './error-separator';
import workerReportsService from '../services/worker-reports/worker-reports.service';
import { WorkerReport } from '../models/worker-report';
import { Request } from 'express';
import { getQueryStringArray, getQueryDateArray } from '../services/utils/utils.service';

@JsonController('/workerreports')
export class WorkersController {
    @Get('/')
    getAll(@CurrentUser({ required: true }) userAccount: UserAccount, 
        @Req() request: Request, 
        @QueryParam("start_ymd") start_ymd: Date, 
        @QueryParam("end_ymd") end_ymd: Date, 
        @QueryParam("allflg") allflg: boolean) {
            return new Promise((resolveFunc: (workerReports: WorkerReport[]) => void, rejectFunc: (err: any) => void) =>
            workerReportsService.getWorkerReports(
                { 
                    company_uid : userAccount.company_uid,
                    worker_uids: getQueryStringArray(request, "worker_uids"),
                    yms         : getQueryStringArray(request, "yyyyMMs"),
                    start_ymd   : start_ymd,
                    end_ymd     : end_ymd,
                    ymds        : getQueryDateArray(request,"ymds"),
                    factory_uids: getQueryStringArray(request, "factory_uids"),
                    allflg: allflg
                  }).then(
                    (workerReports) => resolveFunc(workerReports),
                    (error:any)=>rejectFunc(SeparateError(error)
                )
            )
        )
    }


    @Post('/')
    post(@CurrentUser({ required: true }) userAccount: UserAccount,
        @BodyParam('worker_uids') worker_uids: string[],
        @BodyParam('start_ymd') start_ymd: Date,
        @BodyParam('end_ymd') end_ymd: Date,
        @BodyParam('yyyyMMs') yms:string[],
        @BodyParam('ymds') ymds: Date[],
        @BodyParam('factory_uids') factory_uids: string[], 
        @BodyParam("workerReports") workerReports:WorkerReport[]) {
        return new Promise((resolveFunc: (value:string) => void, rejectFunc: (err: any) => void) =>
            workerReportsService.deleteinsert({
                company_uid: userAccount.company_uid,
                worker_uids: worker_uids,
                yms:yms,
                start_ymd: start_ymd,
                end_ymd: end_ymd,
                ymds: ymds,
                factory_uids: factory_uids,
            },workerReports,userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                }
            ));
    }

    @Delete('/')
    remove(@CurrentUser({ required: true }) userAccount: UserAccount, 
        @Req() request: Request,
        @QueryParam('start_ymd') start_ymd: Date,
        @QueryParam('end_ymd') end_ymd: Date,
        ) {
        return new Promise((resolveFunc: (ret:string) => void, rejectFunc: (err: any) => void) =>
            workerReportsService.delete({
                company_uid : userAccount.company_uid,
                worker_uids : getQueryStringArray(request, "worker_uids"),
                yms         : getQueryStringArray(request, "yyyyMMs"),
                start_ymd   : start_ymd,
                end_ymd     : end_ymd,
                ymds        : getQueryDateArray(request, "ymds"),
                factory_uids: getQueryStringArray(request, "factory_uids"),
            },userAccount.uid).then(
                () => resolveFunc("OK"),
                (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }

    @Delete('/:uid')
    removeOne(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('uid') uid: string) {
        return new Promise((resolveFunc: (ret:string) => void, rejectFunc: (err: any) => void) =>
            workerReportsService.delete({ company_uid: userAccount.company_uid, worker_uids: [uid] },userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }
}