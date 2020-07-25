import { Worker, extractWorkers, extractWorker } from "../../models/worker";
import { WorkerEntity } from "../../entities/worker.entity";
import { EntityManager, Brackets } from "typeorm";
import { getDBConnection } from "../database/database-connection";
import workerReportsService from "../worker-reports/worker-reports.service";
import teamWorkersService from "../teams/team-workers.service";
import workerFactoriesService from "./worker-factories.service";
class WorkersService{
    /**
     * 従業員一覧取得
     * @param condition 検索条件
     *          company_uid  : 企業id
     *          allflg?      : 削除済み従業員も表示するか
     */
    getWorkers(condition:{
        company_uid  :string,
        allflg?      :boolean
    }):Promise<Worker[]>{
        /*----検索条件----*/
        var search: { 
            company_uid :string,
            deleteflg?  :boolean
        } = {
            company_uid: condition.company_uid
        };
        if (!condition.allflg) { //allflgがundefinedもしくはfalseの時は deleteflgがfalseのみ表示
            search['deleteflg'] = false;   
        };

        /*----DBアクセス----*/
        return new Promise<Worker[]>((resolveFunc, rejectFunc) => {
            getDBConnection().then(
                (connection)=>
                    connection.getRepository(WorkerEntity).find(search).then(
                        (workers) => resolveFunc(extractWorkers(workers)),
                        (error) => rejectFunc(error)
                    )
                ,
                (err:any) => rejectFunc(err)
            )
        });
    }

    /**
    * 従業員取得
    * @param condition 検索条件
    *          company_uid  : 企業id
    *          uid          : 従業員id
    *          allflg?      : 削除済み従業員も表示するか
    */
    getWorker(data: {
        company_uid :string,
        uid         :string,
        allflg?     : boolean
    }): Promise<Worker> {
        /*----検索条件----*/
        var search: {
            company_uid :string,
            uid         :string,
            deleteflg?  : boolean 
        } = {
            company_uid   : data.company_uid,
            uid           : data.uid
        };
        if (!data.allflg) {     //allflgがundefinedもしくはfalseの時は deleteflgがfalseのみ表示
            search['deleteflg'] = false
        }

        /*----DBアクセス----*/
        return new Promise<Worker>((resolveFunc, rejectFunc) => {
            getDBConnection().then(
                (connection)=>
                    connection.getRepository(WorkerEntity).findOne(search).then(
                        (worker => {
                            if (worker) {
                                resolveFunc(extractWorker(worker));
                            } else {
                                rejectFunc(undefined);
                            }
                        }),
                        (error) => rejectFunc(error)
                    )
                ,
                (err:any)=>rejectFunc(err)
            )
        });
    }
 
    /**
     * 保存
     * @param workers 保存データ
     * @param company_uid : workerにcompany_uidがない場合に使用する
     * @param registuser : 登録・更新ユーザー
     */
    save(workers: Worker[], company_uid:string,registuser: string): Promise<WorkerEntity[]> {
        return new Promise((resolveFunc:(workerEntities:WorkerEntity[])=>void,rejectFunc:(err:any)=>void )=>{
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        this.saveWithTransactionManager(workers, company_uid,registuser, entityManager)
                    ).then(
                        (result) => resolveFunc(result),
                        (err: any) => rejectFunc(err)
                    )
                ,
                (err)=>rejectFunc(err)
            )
        });
    }

    /**
     * 保存　内部で呼ばれる(transaction)
     * @param workers 
     * @param company_uid : workerにcompany_uidがない場合に使用する
     * @param registuser:登録・更新ユーザー
     * @param entityManager EntityManager
     */
    saveWithTransactionManager(workers: Worker[],company_uid:string,registuser:string, entityManager: EntityManager): Promise<WorkerEntity[]> {
        var workerEntities:WorkerEntity[] = workers.map(worker=>{
            if(!worker.company_uid) worker.company_uid = company_uid;
            var entity = new WorkerEntity({
                ...worker,
                registuser : registuser
            })
            return entity;
        });
        return entityManager.save(workerEntities);
    }


    /**
     * 削除
     * teamWorker,workerFactory,workerReportの対象データも削除する
     * 
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          worker_uids? : 対象従業員id配列
     * @param regist_uid:登録・更新ユーザー
     */
    delete(condition: {
        company_uid: string,
        worker_uids?: string[],
    },registuser:string): Promise<void> {
        return new Promise((resolveFunc:() => void, rejectFunc: (err: any) => void) =>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        Promise.all([
                            //業務レポート情報と従業員グループと現場から消す
                            this.deleteWithTransactionManager(condition, registuser, entityManager),
                            workerReportsService.deleteWithTransactionManager(condition,registuser,entityManager),
                            teamWorkersService.deleteWithTransactionManager(condition,entityManager),
                            workerFactoriesService.deleteWithTransactionManager(condition,entityManager)
                        ])
                    ).then(
                        () => resolveFunc(),
                        (err: any) => rejectFunc(err)
                    )
                ,
                (err) => rejectFunc(err)
            )
        );
    }


    /**
     * 削除(deleteflgをtrueに)
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          worker_uids? : 対象従業員id配列
     * @param regist_uid:登録・更新ユーザー
     * @param entityManager
     */
    deleteWithTransactionManager(condition: {
        company_uid: string, 
        worker_uids?: string[]
    },registuser:string, entityManager: EntityManager): Promise<void> {
        var qb = entityManager.createQueryBuilder()
            .update(WorkerEntity)
            .set({"deleteflg":true,
                "registuser": registuser})
            .where("company_uid = :company_uid", { company_uid: condition.company_uid });

        //削除する現場の従業員
        if (condition.worker_uids) {
            var worker_uids = condition.worker_uids;
            qb.andWhere(new Brackets(iqb =>
                worker_uids.forEach((worker_uid, idx) => iqb.orWhere("uid=:uid" + idx, { ["uid" + idx]: worker_uid }))
            ))
        };

        return new Promise((resolveFunc, rejectFunc) => {
            qb.execute().then(
                (updateResult) => {
                    resolveFunc();
                },
                (error) => rejectFunc(error)
            )
        });
    }
}


export default new WorkersService();