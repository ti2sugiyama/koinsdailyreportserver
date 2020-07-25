import { WorkerFactory, groupByWorkerYM } from "../../models/worker-factory";
import { EntityManager, Brackets } from "typeorm";
import { WorkerFactoryEntity } from "../../entities/worker-factory.entity";
import { getDBConnection } from "../database/database-connection";

class WorkerFactoriesService{
    /**
     * 従業員勤務場所一覧取得
     * @param condition 検索条件
     *          company_uid  : 企業id
     *          worker_uids? : 対象従業員id配列
     *          yms?         : 対象年月  yyyymmの文字列配列
     *          allflg?      : 削除済み従業員も表示するか
     */
    getWorkerFactories(condition:{
        company_uid :string,
        worker_uids?:string[],
        yms?         :string[],
        allflg?     :false
    }): Promise<WorkerFactory[]>{
        return new Promise<WorkerFactory[]>((resolveFunc: (workerFactories: WorkerFactory[]) => void, rejectFunc: (err: any) => void) =>
            getDBConnection().then(
                (connection) => {
                    /*----検索条件----*/
                    var qb = connection.manager
                        .createQueryBuilder(WorkerFactoryEntity, "worker_factory")
                        .where("worker_factory.company_uid= :company_uid", { "company_uid": condition.company_uid });
                    if (!condition.allflg) {
                        qb.andWhere("deleteflg=:deleteflg", { "deleteflg": false })
                    }
                    //検索する従業員
                    if (condition.worker_uids && condition.worker_uids.length>0) {
                        var worker_uids = condition.worker_uids;
                        qb.andWhere(new Brackets(iqb => {
                            worker_uids.forEach((worker_uid, idx) => iqb.orWhere("worker_uid=:worker_uid" + idx, { ["worker_uid" + idx]: worker_uid }))
                        }))
                    };
                    //検索する年月
                    if (condition.yms && condition.yms.length>0) {
                        var yms = condition.yms;
                        qb.andWhere(new Brackets(iqb => {
                            yms.forEach((ym, idx) => iqb.orWhere("ym=:ym" + idx, { ["ym" + idx]: ym }))
                        }))
                    };
                    qb.addOrderBy("worker_factory.worker_uid", "ASC")
                        .addOrderBy("worker_factory.ym", "ASC")
                        .addOrderBy("worker_factory.seq", "ASC")
                        .getMany()
                        .then(
                            (entities: WorkerFactoryEntity[]) => resolveFunc(groupByWorkerYM(entities)),
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
     *          worker_uids 削除対象従業員
     *          yms         削除対象年月
     * @param workerFactories 保存データ
     * @param regist_uid:登録・更新ユーザー
     */
    deleteinsert(delete_condition:{
        company_uid: string,
        worker_uids?: string[],
        yms?: string[]
    },workerFactories: WorkerFactory[], registuser: string): Promise<WorkerFactoryEntity[]> {
        return new Promise<WorkerFactoryEntity[]>((resolveFunc: (workerFactoryEntities: WorkerFactoryEntity[]) => void, rejectFunc: (err: any) => void) =>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        this.deleteinsertWithTransactionManager(delete_condition, workerFactories, registuser, entityManager)
                    ).then(
                        (workerFactories) => resolveFunc(workerFactories),
                        (error) => rejectFunc(error)
                    )
                ,
                (error) => rejectFunc(error)
            )
        );
    }
    /**
     * 削除後挿入 内部で呼ばれる(transaction)
     * @param delete_condition
     *          company_uid 削除対象会社id
     *          worker_uids 削除対象従業員
     *          yms         削除対象年月
     * @param workerFactories 保存データ
     * @param regist_uid:登録・更新ユーザー
     * @param entityManager EntityManager
     */
    deleteinsertWithTransactionManager(delete_condition: {
        company_uid: string,
        worker_uids?: string[],
        yms?: string[]
    },workerFactories: WorkerFactory[], registuser: string, entityManager: EntityManager): Promise<WorkerFactoryEntity[]> {
        return new Promise<WorkerFactoryEntity[]>((resolveFunc: (workerFactoryEntities: WorkerFactoryEntity[]) => void, rejectFunc: (err: any) => void) =>
            this.deleteWithTransactionManager(delete_condition,entityManager).then(
                () => this.saveWithTransactionManager(workerFactories, delete_condition.company_uid,registuser, entityManager).then(
                    (workerFactories) => resolveFunc(workerFactories),
                    (error) => rejectFunc(error)
                ),
                (error)=>rejectFunc(error)
            )
        );
    }


    /**
     * 保存
     * @param workerFactories 保存データ
     * @param company_uid : WorkerFactoryにcopmany_uidがない場合に使用する
     * @param regist_uid:登録・更新ユーザー
     */
    save(workerFactories: WorkerFactory[], company_uid:string,registuser: string): Promise<WorkerFactoryEntity[]> {
        return new Promise<WorkerFactoryEntity[]>((resolveFunc: (workerFactoryEntities: WorkerFactoryEntity[]) => void, rejectFunc: (err: any) => void) =>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        this.saveWithTransactionManager(workerFactories, company_uid,registuser, entityManager)
                    ).then(
                        (workerFactories) => resolveFunc(workerFactories),
                        (error) => rejectFunc(error)
                    )
                ,
                (error) => rejectFunc(error)
            )
        );
    }

    /**
     * 保存　内部で呼ばれる(transaction)
     * @param workerFactories 保存データ
     * @param company_uid : WorkerFactoryにcopmany_uidがない場合に使用する
     * @param regist_uid:登録・更新ユーザー
     * @param entityManager EntityManager
     */
    private saveWithTransactionManager(workerFactories: WorkerFactory[], company_uid:string,registuser: string,entityManager: EntityManager): Promise<WorkerFactoryEntity[]> {
        var workerFactoryEntities: WorkerFactoryEntity[] = 
            //flatmapはES2019からなので reduce+concatで対応
            workerFactories.reduce <WorkerFactoryEntity[]>((retArray, workerFactory) =>{
                if (!workerFactory.company_uid) workerFactory.company_uid = company_uid;
                return retArray.concat(
                    workerFactory.factory_uids.map((factory_uid,index)=>
                        new WorkerFactoryEntity({
                            company_uid : workerFactory.company_uid,
                            worker_uid  : workerFactory.worker_uid,
                            ym          : workerFactory.ym,
                            seq         : index,
                            factory_uid : factory_uid,
                            registuser  : registuser
                        })
                    )
                )},
            []);
        return entityManager.save(workerFactoryEntities);
    }


    /**
     * 削除 (物理削除)
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          worker_uids? : 対象従業員id配列
     *          yms?         : 対象年月  yyyymmの文字列配列
     *          factory_uids?:[],
     */
    delete(condition: {
        company_uid: string,
        worker_uids?: string[],
        yms?: string[],
        factory_uids?: string[],
    }): Promise<void>{
        return new Promise<void>((resolveFunc: () => void, rejectFunc: (error: any) => void) =>
            getDBConnection().then(
                (connection) => 
                    connection.transaction(entityManager =>
                        this.deleteWithTransactionManager(condition,entityManager)
                    ).then(
                        () => resolveFunc(),
                        (error: any) => rejectFunc(error)
                    )
                ,
                (error) => rejectFunc(error)
            )
        );
    }


    /**
     * 削除 (物理削除)
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          worker_uids? : 対象従業員id配列
     *          yms?         : 対象年月  yyyymmの文字列配列
     *          factory_uids?: 現場id配列,
     * @param manager
     */
    deleteWithTransactionManager(condition:{
        company_uid:string,
        worker_uids?: string[],
        yms?: string[],
        factory_uids?: string[],
    }, entityManager: EntityManager): Promise<void>{
        var qb = entityManager.createQueryBuilder()
        .delete()
        .from(WorkerFactoryEntity)
        .where("company_uid = :company_uid", { company_uid: condition.company_uid});

        //削除する現場の従業員
        if (condition.worker_uids && condition.worker_uids.length>0){
            var worker_uids = condition.worker_uids;
            qb.andWhere(new Brackets(iqb =>
                worker_uids.forEach((worker_uid, idx) => iqb.orWhere("worker_uid=:worker_uid" + idx, { ["worker_uid" + idx]: worker_uid }))
            ))
        };
        //削除する年月
        if (condition.yms && condition.yms.length>0) {
            var yms = condition.yms;
            qb.andWhere(new Brackets(iqb => {
                yms.forEach((ym, idx) => iqb.orWhere("ym=:ym" + idx, { ["ym" + idx]: ym }))
            }))
        };

        //削除する場所
        if (condition.factory_uids && condition.factory_uids.length>0) {
            var factory_uids = condition.factory_uids;
            qb.andWhere(new Brackets(iqb =>
                factory_uids.forEach((factory_uid, idx) => iqb.orWhere("factory_uid=:factory_uid" + idx, { ["factory_uid" + idx]: factory_uid }))
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



export default new WorkerFactoriesService();