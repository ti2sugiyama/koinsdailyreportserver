import { JsonController,  Get, Post, Delete, CurrentUser, BodyParam, Req } from 'routing-controllers'
import { UserAccount } from '../models/user-account';
import { TeamWorker } from '../models/team-worker';
import teamWorkersService from '../services/teams/team-workers.service';
import { SeparateError } from './error-separator';
import { Request } from 'express';
import { getQueryStringArray } from '../services/utils/utils.service';

@JsonController('/teamworkers')
export class TeamWorkersController {
    @Get('/')
    getAll(@CurrentUser({ required: true }) userAccount: UserAccount, @Req() request:Request) {
        return new Promise((resolveFunc: (teamWorkers:TeamWorker[]) => void, rejectFunc: (err: any) => void) =>
            teamWorkersService.getTeamWorkers({ 
                company_uid: userAccount.company_uid, 
                team_uids: getQueryStringArray(request, "team_uids")
            }).then(
                (teamWorkers) => resolveFunc(teamWorkers)
                ,(error:any)=>{
                    rejectFunc(SeparateError(error));
                 }
            )
        )
    }
    @Post('/')
    post(@CurrentUser({ required: true }) userAccount: UserAccount, @BodyParam("team_uids") team_uids: string[], @BodyParam("teamWorkers") teamWorkers:TeamWorker[]) {
        return new Promise((resolveFunc: (value:string) => void, rejectFunc: (err: any) => void) =>
            teamWorkersService.deleteinsert(
                {
                    company_uid: userAccount.company_uid,
                    team_uids: team_uids
                }, teamWorkers,userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                }
            ));
    }

    @Delete('/')
    remove(@CurrentUser({ required: true }) userAccount: UserAccount, @Req() request: Request) {
        return new Promise((resolveFunc: (ret:string) => void, rejectFunc: (err: any) => void) =>
            teamWorkersService.delete({
                company_uid: userAccount.company_uid,
                team_uids: getQueryStringArray(request, "team_uids")
            }).then(
                () => resolveFunc("OK"),
                (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }
}