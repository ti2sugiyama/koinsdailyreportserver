import { Team, extractTeam, extractTeams } from "../../models/team";
import { TeamEntity } from "../../entities/team.entity";
import { EntityManager, Brackets } from "typeorm";
import { getDBConnection } from "../database/database-connection";
import teamWorkersService from "./team-workers.service";

class TeamsService {
    /**
     * グループ一覧取得
     * @param condition 検索条件
     *          company_uid  : 企業id
     *          allflg?      : 削除済みも表示するか
     */
    getTeams(condition:{
        company_uid :string,
        allflg?     :boolean
    }): Promise < Team[] > {
        /*----検索条件----*/
        var search: {
            company_uid :string,
            deleteflg?  :boolean
        } = {
            company_uid: condition.company_uid
        };
        if (!condition.allflg) { //allflgがundefinedもしくはfalseの時は deleteflgがfalseのみ表示
            search['deleteflg'] = false;
        }
        
        /*----DBアクセス----*/


        return new Promise<Team[]>((resolveFunc:(teams:Team[])=>void, rejectFunc:(err:any)=>void) =>
            getDBConnection().then(
                (connection)=>connection.getRepository(TeamEntity).find(search).then(
                    (teams) => resolveFunc(extractTeams(teams)),
                    (error) => rejectFunc(error)
                ),
                (error)=>rejectFunc(error)
            )
        );
    }


    /**
     * グループ一覧取得
     * @param condition 検索条件
     *          company_uid  : 企業id
     *          uid          : グループid
     *          allflg?      : 削除済みも表示するか
     */
    getTeam(condition:{
        company_uid :string,
        uid         :string,
        allflg?     :boolean
    }): Promise<Team> {
        /*----検索条件----*/
        var search: {
            company_uid :string,
            uid         :string,
            deleteflg?  :boolean 
        } = {
            company_uid :condition.company_uid,
            uid         :condition.uid
        };
        if (!condition.allflg) { //allflgがundefinedもしくはfalseの時は deleteflgがfalseのみ表示
            search['deleteflg'] = false
        }

        /*----DBアクセス----*/
        return new Promise<Team>((resolveFunc, rejectFunc) => 
            getDBConnection().then(
                (connection)=>connection.getRepository(TeamEntity).findOne(search).then(
                    (team) =>{
                        if (team) {
                            resolveFunc(extractTeam(team));
                        } else {
                            rejectFunc(undefined);
                       }
                    },
                    (error) => rejectFunc(error)
                ),
                (error:any)=>rejectFunc(error)
            )
        );
    }


    /**
     * 保存
     * @param teams : 保存データ
     * @param company_uid : Teamにcompany_uidがない場合に使用する
     * @param registuser:登録・更新ユーザー
     */
    save(teams: Team[], company_uid:string,registuser: string): Promise<TeamEntity[]> {
        return new Promise<TeamEntity[]>((resolveFunc: (teamEntity: TeamEntity[])=>void,rejectFunc:(err:any)=>void)=>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        this.saveWithTransactionManager(teams, company_uid, registuser, entityManager)
                    ).then(
                        (teams) => resolveFunc(teams),
                        (err) => rejectFunc(err)
                    )
                ,
                (err) => rejectFunc(err)
            )
        );
    }

    /**
     * 保存　内部で呼ばれる(transaction)
     * @param teams :保存データ
     * @param company_uid : Teamにcompany_uidがない場合に使用する
     * @param registuser:登録・更新ユーザー
     * @param entityManager EntityManager
     */
    saveWithTransactionManager(teams: Team[],company_uid:string,registuser:string, entityManager: EntityManager): Promise<TeamEntity[]> {
        var teamEntities: TeamEntity[] = teams.map(team => {
            if(!team.company_uid) team.company_uid = company_uid;
            return new TeamEntity({
            ...team,
            registuser:registuser
            })
        });
        return entityManager.save(teamEntities);
    }

    /**
     * 削除
     * teamWorkersの対象データも削除する
     * 
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          team_uids? : グループid配列
     */
    delete(condition: {
        company_uid: string,
        team_uids?: string[],
    },registuser:string): Promise<void> {
        return new Promise<void>((resolveFunc:()=>void,rejectFunc:(err:any)=>void)=>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        Promise.all([
                            this.deleteWithTransactionManager(condition, registuser,  entityManager),
                            teamWorkersService.deleteWithTransactionManager(condition,entityManager)
                        ])
                    ).then(
                        () => resolveFunc(),
                        (err) => rejectFunc(err)
                    )
                ,
                (error) => rejectFunc(error)
            )
        );
    }


    /**
     * 削除(deleteflgをtrueに)
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          team_uids? : グループid配列
     * @param manager
     */
    deleteWithTransactionManager(condition: {
        company_uid: string,
        team_uids?: string[]
    },registuser: string,entityManager: EntityManager): Promise<void> {
        var qb = entityManager.createQueryBuilder()
            .update(TeamEntity)
            .set({ "deleteflg": true, registuser: registuser})
            .where("company_uid = :company_uid", { company_uid: condition.company_uid });

        //削除するteam
        if (condition.team_uids) {
            var team_uids = condition.team_uids;
            qb.andWhere(new Brackets(iqb =>
                team_uids.forEach((team_uid, idx) => iqb.orWhere("uid=:uid" + idx, { ["uid" + idx]: team_uid }))
            ));
        }
        return new Promise((resolveFunc, rejectFunc) =>
            qb.execute().then(
                () => resolveFunc(),
                (error) => rejectFunc(error)
            )
        );
    }
}



export default new TeamsService();