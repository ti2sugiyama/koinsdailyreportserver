import { JsonController, Param, Body, Get, Post, Delete, CurrentUser, NotFoundError, QueryParam, Req } from 'routing-controllers'
import { UserAccount } from '../models/user-account';
import { Factory } from '../models/factory';
import factoriesService from '../services/factories/factories.service';
import { SeparateError } from './error-separator';
import { Request } from 'express';
import { getQueryStringArray } from '../services/utils/utils.service';

@JsonController('/factories')
export class FactoriesController {
    @Get('/')
    getAll(@CurrentUser({ required: true }) userAccount: UserAccount, @QueryParam("allflg") allflg: boolean) {
        return new Promise((resolveFunc: (factories: Factory[]) => void, rejectFunc: (err: any) => void) =>
            factoriesService.getFactories({ company_uid: userAccount.company_uid, allflg: allflg}).then(
                (factories) => resolveFunc(factories)
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            )
        )
    }

    @Get('/:uid')
    getOne(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('uid') uid: string, @QueryParam("allflg") allflg: boolean) {
        return new Promise((resolveFunc: (factory:Factory)=>void,rejectFunc:(err:any)=>void)=>
            factoriesService.getFactory({ company_uid: userAccount.company_uid, uid:uid,allflg:allflg}).then(
                (factory) => resolveFunc(factory)
                , (error: any) => {
                    if (error === undefined) {
                        rejectFunc(new NotFoundError(uid + " is not found"));
                    } else {
                        rejectFunc(SeparateError(error));
                    }
                }
            ));
    }

    @Post('/')
    post(@CurrentUser({ required: true }) userAccount: UserAccount, @Body() factories:Factory[]) {
        return new Promise((resolveFunc: (ret: string) => void, rejectFunc: (err: any) => void) =>
            factoriesService.save(factories,userAccount.company_uid,userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }

    @Delete('/')
    remove(@CurrentUser({ required: true }) userAccount: UserAccount, @Req() request: Request) {
        return new Promise((resolveFunc: (ret: string) => void, rejectFunc: (err: any) => void) =>
            factoriesService.delete({ company_uid: userAccount.company_uid, factory_uids: getQueryStringArray(request, "uids") }, userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }

    @Delete('/:uid')
    removeOne(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('uid') uid: string) {
        return new Promise((resolveFunc: (ret: string) => void, rejectFunc: (err: any) => void) =>
            factoriesService.delete({ company_uid: userAccount.company_uid, factory_uids: [uid] }, userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }
}