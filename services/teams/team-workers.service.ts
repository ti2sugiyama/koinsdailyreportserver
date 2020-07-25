import { TeamWorker, groupByTeam } from "../../models/team-worker";
import { Transaction,TransactionManager, EntityManager, Brackets } from "typeorm";
import { TeamWorkerEntity } from "../../entities/team-worker.entity";
import { getDBConnection } from "../database/database-connection";
import { resolve } from "dns";

class TeamWorkersService{
    /**
     * group従業員一覧取得
     * @param condition 検索条件
     *          company_uid  : 企業id
     *          team_uids?   : groupid
     *          allflg?      : 削除済み従業員も表示するか
     */
    getTeamWorkers(condition:{
        company_uid :string,
        team_uids?:string[],
        allflg?     :false
    }): Promise<TeamWorker[]>{
        return new Promise<TeamWorker[]>((resolveFunc: (teamworkers: TeamWorker[])=>void, rejectFunc:(err:any)=>void) =>
            getDBConnection().then(
                (connection)=>{
                    /*----検索条件----*/
                    var qb = connection.manager
                        .createQueryBuilder(TeamWorkerEntity, "team_worker")
                        .where("team_worker.company_uid= :company_uid", { "company_uid": condition.company_uid });
                    if (!condition.allflg) {
                        qb.andWhere("deleteflg=:deleteflg", { "deleteflg": false })
                    }
                    //検索するgroup
                    if (condition.team_uids && condition.team_uids.length > 0) {
                        var team_uids = condition.team_uids;
                        qb.andWhere(new Brackets(iqb =>
                            team_uids.forEach((team_uid, idx) => iqb.orWhere("team_uid=:team_uid" + idx, { ["team_uid" + idx]: team_uid }))
                        ))
                    };
                    qb.addOrderBy("team_worker.team_uid", "ASC")
                        .addOrderBy("team_worker.seq", "ASC")
                        .getMany()
                        .then(
                            (entities: TeamWorkerEntity[]) => resolveFunc(groupByTeam(entities)),
                            (error) => rejectFunc(error)
                        );
                },
                (error: any) => rejectFunc(error)
            )
        );
    }


    /**
     * 削除後挿入
     * @param delete_condition 
     *          company_uid 削除対象会社id    
     *          team_uids?  削除対象groupid配列
     * @param teamWorkers 保存データ
     */
    deleteinsert(delete_condition: {
        company_uid: string,
        team_uids?: string[],
    }, teamWorkers: TeamWorker[], registuser: string): Promise<TeamWorkerEntity[]> {
        return new Promise<TeamWorkerEntity[]>((resolveFunc: (teamWorkerEntities: TeamWorkerEntity[]) => void, rejectFunc: (err: any) => void) => {
            getDBConnection().then(
                (connection)=>
                    connection.transaction(entityManager =>
                        this.deleteinsertWithTransactionManager(delete_condition, teamWorkers, registuser, entityManager)
                    ).then(
                        (teamWorkers) => resolveFunc(teamWorkers),
                        (error) => rejectFunc(error)
                    )
                ,
                (error) => rejectFunc(error)
            )
        })
    }
    /**
     * 削除後挿入 内部で呼ばれる(transaction)
     * @param delete_condition
     *          company_uid 削除対象会社id
     *          team_uids?  削除対象groupid配列
     * @param teamWorkers 保存データ
     */
    deleteinsertWithTransactionManager(delete_condition: {
        company_uid: string,
        team_uids?: string[],
    }, teamWorkers: TeamWorker[], registuser: string, entityManager: EntityManager): Promise<TeamWorkerEntity[]> {
        return new Promise<TeamWorkerEntity[]>((resolveFunc: (teamWorkerEntities: TeamWorkerEntity[]) => void, rejectFunc: (err: any) => void) =>
            this.deleteWithTransactionManager(delete_condition, entityManager).then(
                () => this.saveWithTransactionManager(teamWorkers, delete_condition.company_uid,registuser, entityManager).then(
                    (teamWorkers) => resolveFunc(teamWorkers),
                    (error) => rejectFunc(error)
                ),
                (error) => rejectFunc(error)
            )
        );
    }

    /**
     * 保存
     * @param teamWorkers 保存データ
     * @param company_uid : TeamWorkerにcopmany_uidがない場合に使用する
     * @param regist_uid:登録・更新ユーザー
     */
    save(teamWorkers: TeamWorker[], company_uid:string,registuser:string): Promise<TeamWorkerEntity[]> {
        return new Promise<TeamWorkerEntity[]>((resolveFunc: (teamworkerEntities:TeamWorkerEntity[])=>void, rejectFunc:(err:any)=>void)=>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        this.saveWithTransactionManager(teamWorkers, company_uid,registuser, entityManager)
                    ).then(
                        (teamworkerEntities) => resolveFunc(teamworkerEntities),
                        (error) => rejectFunc(error)
                    )
                ,
                (error)=>rejectFunc(error)
            )
        );
    }

    /**
     * 保存　内部で呼ばれる
     * @param teamWorkers 保存データ
     * @param company_uid : TeamWorkerにcopmany_uidがない場合に使用する
     * @param regist_uid:登録・更新ユーザー
     * @param entityManager EntityManager
     */
    saveWithTransactionManager(teamWorkers: TeamWorker[],company_uid:string,registuser:string, entityManager: EntityManager): Promise<TeamWorkerEntity[]> {
        var teamWorkerEntities: TeamWorkerEntity[] = 
            //flatmapはES2019からなので reduce+concatで対応
            teamWorkers.reduce < TeamWorkerEntity[]>((retArray: TeamWorkerEntity[],teamWorker) =>{
                if(!teamWorker.company_uid) teamWorker.company_uid = company_uid;
                return retArray.concat(
                    teamWorker.worker_uids.map((worker_uid,index)=>
                        new TeamWorkerEntity({
                            company_uid: teamWorker.company_uid,
                            team_uid: teamWorker.team_uid,
                            seq         : index,
                            worker_uid: worker_uid,
                            registuser: registuser
                        })
                    )
                )},
            []);
        return entityManager.save(teamWorkerEntities);
    }


    /**
     * 削除(物理削除)
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          team_uids?    : groupid配列
     *          worker_uids? : 対象従業員id配列
     */
    delete(condition: {
        company_uid: string,
        team_uids?: string[],
        worker_uids?: string[],
    }): Promise<void>{

        return new Promise<void>((resolveFunc:()=>void,rejectFunc:(error:any)=>void)=>
            getDBConnection().then(
                (connection)=>
                    connection.transaction(entityManager=>
                        this.deleteWithTransactionManager(condition, entityManager)
                    ).then(
                        () => { resolveFunc()},
                        (error: any) => rejectFunc(error)
                    )
                ,
                (error)=>rejectFunc(error)
            )
        );
    }


    /**
     * 削除(物理削除)
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          team_uids?    : groupid配列
     *          worker_uids? : 対象従業員id配列
     * @param entityManager
     */
    deleteWithTransactionManager(condition: {
        company_uid: string,
        team_uids?: string[],
        worker_uids?: string[],
    },  entityManager: EntityManager): Promise<void>{
        var qb = entityManager.createQueryBuilder()
        .delete()
        .from(TeamWorkerEntity)
        .where("company_uid = :company_uid", { company_uid: condition.company_uid});

        //削除するgroup
        if (condition.team_uids && condition.team_uids.length>0) {
            var team_uids = condition.team_uids;
            qb.andWhere(new Brackets(iqb =>
                team_uids.forEach((team_uid, idx) => iqb.orWhere("team_uid=:team_uid" + idx, { ["team_uid" + idx]: team_uid }))
            ))
        };
        //削除する現場の従業員
        if (condition.worker_uids && condition.worker_uids.length>0){
            var worker_uids = condition.worker_uids;
            qb.andWhere(new Brackets(iqb =>
                worker_uids.forEach((worker_uid, idx) => iqb.orWhere("worker_uid=:worker_uid" + idx, { ["worker_uid" + idx]: worker_uid }))
            ))
        };

        return new Promise((resolveFunc,rejectFunc)=>
            qb.execute().then(
                ()=>resolveFunc(),
                (error) => rejectFunc(error)
            )
        );
    }
}



export default new TeamWorkersService();