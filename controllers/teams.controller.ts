import { JsonController, Param, Body, Get, Post, Delete, CurrentUser, NotFoundError, QueryParam, Req } from 'routing-controllers'
import { UserAccount } from '../models/user-account';
import teamsService from '../services/teams/teams.service';
import { Team } from '../models/team';
import { SeparateError } from './error-separator';
import { Request } from 'express';
import { getQueryStringArray } from '../services/utils/utils.service';

@JsonController('/teams')
export class TeamsController {
    @Get('/')
    getAll(@CurrentUser({ required: true }) userAccount: UserAccount, @QueryParam("allflg") allflg: boolean) {
        return new Promise((resolveFunc: (teams: Team[]) => void, rejectFunc: (err: any) => void) =>
            teamsService.getTeams({ company_uid: userAccount.company_uid, allflg:allflg}).then(
                (teams) => resolveFunc(teams)
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            )
        )
    }

    @Get('/:uid')
    getOne(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('uid') uid: string, @QueryParam("allflg") allflg: boolean) {
        return new Promise((resolveFunc: (team:Team)=>void,rejectFunc:(err:any)=>void)=>
            teamsService.getTeam({ company_uid: userAccount.company_uid, uid:uid,allflg:allflg}).then(
                (team) => resolveFunc(team)
                , (error: any) => {
                    if (error === undefined) {
                        rejectFunc(new NotFoundError(uid + " is not found"));
                    } else{
                        rejectFunc(SeparateError(error));
                    }
                }
            ));
    }

    @Post('/')
    post(@CurrentUser({ required: true }) userAccount: UserAccount, @Body() teams:Team[]) {
        return new Promise((resolveFunc: (ret:string) => void, rejectFunc: (err: any) => void) =>
            teamsService.save(teams,userAccount.company_uid,userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                }
            ));
    }

    @Delete('/')
    remove(@CurrentUser({ required: true }) userAccount: UserAccount, @Req() request: Request) {
        return new Promise((resolveFunc: (ret: string) => void, rejectFunc: (err: any) => void) =>
            teamsService.delete({ company_uid: userAccount.company_uid, team_uids: getQueryStringArray(request, "uids") }, userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }

    @Delete('/:uid')
    removeOne(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('uid') uid: string) {
        return new Promise((resolveFunc: (ret: string) => void, rejectFunc: (err: any) => void) =>
            teamsService.delete({ company_uid: userAccount.company_uid, team_uids: [uid] }, userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }
}