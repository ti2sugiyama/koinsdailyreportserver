import { JsonController, Param, Body, Get, Post, Delete, CurrentUser } from 'routing-controllers'
import { UserAccount } from '../models/user-account';
import { TeamWorker } from '../models/team-worker';
import teamWorkersService from '../services/teams/team-workers.service';
import { SeparateError } from './error-separator';

@JsonController('/teams/:team_uid/workers')
export class TeamWorkersInTeamController {
    @Get('/')
    getAll(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('team_uid') team_uid: string) {
        return new Promise((resolveFunc: (teamWorkers:TeamWorker[]) => void, rejectFunc: (err: any) => void) =>
            teamWorkersService.getTeamWorkers({ company_uid: userAccount.company_uid, team_uids: [team_uid]}).then(
                (teamWorkers) => resolveFunc(teamWorkers)
                ,(error:any)=>{
                    rejectFunc(SeparateError(error));
                 }
            )
        )
    }
    @Post('/')
    post(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('team_uid') team_uid: string,@Body() teamWorkers:TeamWorker[]) {
        return new Promise((resolveFunc: (value:string) => void, rejectFunc: (err: any) => void) =>
            teamWorkersService.deleteinsert(
                {
                    company_uid: userAccount.company_uid,
                    team_uids: [team_uid]
                }, teamWorkers,userAccount.uid).then(
                () => resolveFunc("OK")
                , (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }

    @Delete('/')
    remove(@CurrentUser({ required: true }) userAccount: UserAccount, @Param('team_uid') team_uid: string) {
        return new Promise((resolveFunc: (ret:string) => void, rejectFunc: (err: any) => void) =>
            teamWorkersService.delete({ company_uid: userAccount.company_uid, team_uids: [team_uid]}).then(
                () => resolveFunc("OK"),
                (error: any) => {
                    rejectFunc(SeparateError(error));
                 }
            ));
    }
}