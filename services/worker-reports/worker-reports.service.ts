import { WorkerReport, extractWorkerReports, extractWorkerReport } from "../../models/worker-report";
import { WorkerReportEntity } from "../../entities/worker-report.entity";
import { EntityManager, Brackets } from "typeorm";
import { getDBConnection } from "../database/database-connection";
class WorkerReportsService{
    /**
     * 月報一覧取得
     * @param condition 検索条件
     *          company_uid  : 企業id
     *          worker_uids?  : 対象従業員id配列
     *          yms?:削除対象年月
     *          ymds?        : 対象年月日  date型配列
     *          start_ymd?: 検索対象開始年月日,
     *          end_ymd?: 検索対象終了年月日（この日を含む),
     *          factoriy_uids? : 現場id配列
     *          allflg?      : 削除済みも表示するか
     */
    getWorkerReports(condition: {
        company_uid: string,
        worker_uids?: string[],
        yms?:string[],
        start_ymd?: Date,
        end_ymd?: Date,
        ymds?: Date[],
        factory_uids?: string[],
        allflg?: boolean
    }): Promise<WorkerReport[]> {
        return new Promise<WorkerReport[]>((resolveFunc: (workerReports: WorkerReport[]) => void, rejectFunc: (err: any) => void) =>
            getDBConnection().then(
                (connection) => {
                    /*----検索条件----*/
                    var qb = connection.manager
                    .createQueryBuilder(WorkerReportEntity, "worker_report")
                        .where("worker_report.company_uid= :company_uid", { "company_uid": condition.company_uid });
                    if (!condition.allflg) {
                        qb.andWhere("deleteflg=:deleteflg", { "deleteflg": false })
                    }
                    //検索する従業員
                    if (condition.worker_uids && condition.worker_uids.length > 0) {
                        var worker_uids = condition.worker_uids;
                        qb.andWhere(new Brackets(iqb => 
                            worker_uids.forEach((worker_uid, idx) => iqb.orWhere("worker_uid=:worker_uid" + idx, { ["worker_uid" + idx]: worker_uid }))
                        ))
                    };
                    //検索する年月
                    if (condition.yms) {
                        var yms = condition.yms;
                        qb.andWhere(new Brackets(iqa =>
                            yms.forEach((ym, idx) => {
                                var year = Number(ym.slice(0, 4));
                                var month = Number(ym.slice(4, 6));
                                var start_ymd = new Date(year, month - 1, 1);
                                var end_ymd = new Date(year, month, 1);
                                iqa.orWhere(new Brackets(iqb => {
                                    iqb.andWhere("ymd>=:ym_start_ymd" + idx, { ["ym_start_ymd" + idx]: start_ymd })
                                    iqb.andWhere("ymd<:ym_end_ymd" + idx, { ["ym_end_ymd" + idx]: end_ymd })
                                }));
                            })
                        ));
                    }
                    //検索開始年月日
                    if (condition.start_ymd){
                        var start_ymd = condition.start_ymd;
                        qb.andWhere(new Brackets(iqb=>
                            iqb.andWhere("ymd>=:start_ymd", { start_ymd : start_ymd })
                        ));
                    }
                    //検索終了年月日
                    if (condition.end_ymd) {
                        var end_ymd = new Date(condition.end_ymd);
                        end_ymd.setDate(end_ymd.getDate()+1);
                        qb.andWhere(new Brackets(iqb =>
                            iqb.andWhere("ymd<:end_ymd", { end_ymd: end_ymd })
                        ));
                    }

                    //検索する年月日
                    if (condition.ymds && condition.ymds.length>0) {
                        var ymds = condition.ymds;
                        qb.andWhere(new Brackets(iqb => 
                            ymds.forEach((ymd, idx) => iqb.orWhere("ymd=:ymd" + idx, { ["ymd" + idx]: ymd }))
                        ))
                    };
                    //検索する現場
                    if (condition.factory_uids && condition.factory_uids.length>0) {
                        var factory_uids = condition.factory_uids;
                        qb.andWhere(new Brackets(iqb =>
                            factory_uids.forEach((factory_uid, idx) => iqb.orWhere("factory_uid=:factory_uid" + idx, { ["factory_uid" + idx]: factory_uid }))
                        ))
                    };
                    qb.addOrderBy("worker_report.worker_uid", "ASC")
                        .addOrderBy("worker_report.ymd", "ASC")
                        .addOrderBy("worker_report.factory_uid", "ASC")
                        .getMany()
                        .then(
                            (workerReports => resolveFunc(extractWorkerReports(workerReports)))
                            , (error) => rejectFunc(error)
                        );
                },
                (error)=>rejectFunc(error)
            )
        );
    }



    /**
    * 月報取得
    * @param condition 検索条件
    *          company_uid  : 企業id
    *          uid          : 従業員id
    *          allflg?      : 削除済み従業員も表示するか
    */
    getWorkerReport(data: {
        company_uid: string,
        uid: string,
        allflg?: boolean
    }): Promise<WorkerReport> {
        /*----検索条件----*/
        var search: {
            company_uid: string,
            uid: string,
            deleteflg?: boolean
        } = {
            company_uid: data.company_uid,
            uid: data.uid
        };
        if (!data.allflg) {     //allflgがundefinedもしくはfalseの時は deleteflgがfalseのみ表示
            search['deleteflg'] = false
        }

        /*----DBアクセス----*/
        return new Promise<WorkerReport>((resolveFunc, rejectFunc) =>
            getDBConnection().then(
                (connection)=>connection.getRepository(WorkerReportEntity).findOne(search)
                    .then(
                        (workerReport => {
                            if (workerReport) {
                                resolveFunc(extractWorkerReport(workerReport));
                            } else {
                                rejectFunc();
                            }
                        }),
                        (error) => rejectFunc(error))
                ,
                (error)=>rejectFunc(error)
            )
        );
    }



    /**
     * 削除後挿入
     * @param delete_condition
     *          company_uid 削除対象会社id
     *          worker_uids 削除対象従業員
     *          yms?:削除対象年月
     *          start_ymd?: 削除対象開始年月日,
     *          end_ymd?: 削除対象終了年月日（この日を含む),
     *          ymds?        : 対象年月日  date型配列
     *          factoriy_uids? : 現場id配列
     * @param workerFactories 保存データ
     * @param regist_uid:登録・更新ユーザー
     */
    deleteinsert(delete_condition: {
        company_uid: string,
        worker_uids?: string[],
        yms?:string[],
        start_ymd?: Date,
        end_ymd?: Date,
        ymds?: Date[],
        factory_uids?: string[],
    }, workerReports: WorkerReport[], registuser: string): Promise<WorkerReportEntity[]> {
        return new Promise<WorkerReportEntity[]>((resolveFunc: (workerReportEntities: WorkerReportEntity[]) => void, rejectFunc: (err: any) => void) =>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        this.deleteinsertWithTransactionManager(delete_condition, workerReports, registuser, entityManager)
                    ).then(
                        (workerReports) => resolveFunc(workerReports),
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
     *          worker_uids 削除対象従業員
     *          yms?:削除対象年月
     *          start_ymd?: 検索対象開始年月日,
     *          end_ymd?: 検索対象終了年月日（この日を含む),
     *          ymds?        : 対象年月日  date型配列
     *          factoriy_uids? : 現場id配列
     * @param workerReports 保存データ
     * @param regist_uid:登録・更新ユーザー
     * @param entityManager EntityManager
     */
    deleteinsertWithTransactionManager(delete_condition: {
        company_uid: string,
        worker_uids?: string[],
        yms?:string[],
        start_ymd?: Date,
        end_ymd?: Date,
        ymds?: Date[],
        factory_uids?: string[],
    }, workerReports: WorkerReport[], registuser: string, entityManager: EntityManager): Promise<WorkerReportEntity[]> {
        return new Promise<WorkerReportEntity[]>((resolveFunc: (workerReportEntities: WorkerReportEntity[]) => void, rejectFunc: (err: any) => void) =>
            this.deleteWithTransactionManager(delete_condition, registuser,entityManager).then(
                () => this.saveWithTransactionManager(workerReports, delete_condition.company_uid, registuser, entityManager).then(
                    (workerReports) => resolveFunc(workerReports),
                    (error) => rejectFunc(error)
                ),
                (error) => rejectFunc(error)
            )
        );
    }


    /**
     * 保存
     * @param workerReports 保存データ
     * @param company_uid : WorkerReportにcopmany_uidがない場合に使用する
     * @param regist_uid:登録・更新ユーザー
     */
    save(workerReports: WorkerReport[], company_uid: string,registuser:string): Promise<WorkerReportEntity[]> {
        return new Promise((resolveFunc: (workerReportEntities: WorkerReportEntity[]) => void, rejectFunc: (err: any) => void) =>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        this.saveWithTransactionManager(workerReports, company_uid,registuser, entityManager)
                    ).then(
                        (workerReports) => resolveFunc(workerReports), 
                        (error) => rejectFunc(error)
                    )
                ,
                (err) => rejectFunc(err)
            )
        );
    }

    /**
     * 保存　内部で呼ばれる(transaction)
     * @param workerReports 保存データ
     * @param company_uid : WorkerReportにcopmany_uidがない場合に使用する
     * @param regist_uid:登録・更新ユーザー
     * @param entityManager EntityManager
     */
    saveWithTransactionManager(workerReports: WorkerReport[], company_uid:string, registuser:string,entityManager: EntityManager): Promise<WorkerReportEntity[]> {
        var workerReportEntities: WorkerReportEntity[] = workerReports.map((workerReport) =>{
            if (!workerReport.company_uid) workerReport.company_uid = company_uid;
            return  new WorkerReportEntity({
                ...workerReport,
                registuser: registuser
            });  
        });
        return entityManager.save(workerReportEntities);
    }





    /**
     * 削除
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          worker_uids 削除対象従業員
     *          yms?:削除対象年月
     *          start_ymd?: 検索対象開始年月日,
     *          end_ymd?: 検索対象終了年月日（この日を含む),
     *          ymds?        : 対象年月日  date型配列
     *          factoriy_uids? : 現場id配列
     * @param registuser:削除ユーザー
     */
    delete(condition: {
        company_uid: string,
        worker_uids?: string[],
        yms?:string[],
        start_ymd?: Date,
        end_ymd?: Date,
        ymds?: Date[],
        factory_uids?: string[],
    }, registuser: string): Promise<void> {
        return new Promise<void>((resolveFunc:()=>void,rejectFunc:(error:any)=>void)=>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        this.deleteWithTransactionManager(condition, registuser,entityManager)
                    ).then(
                        () => resolveFunc()
                        , (error) => rejectFunc(error)
                    )
                ,
                (err) => rejectFunc(err)
            )
        );
    }


    /**
     * 削除(deleteflgをtrueに)
     *          company_uid     : 企業id
     *          worker_uids 削除対象従業員
     *          yms?:削除対象年月
     *          start_ymd?: 検索対象開始年月日,
     *          end_ymd?: 検索対象終了年月日（この日を含む),
     *          ymds?        : 対象年月日  date型配列
     *          factoriy_uids? : 現場id配列
     * @param regist_uid:削除ユーザー
     * @param entityManager
     */
    deleteWithTransactionManager(condition: {
        company_uid: string,
        worker_uids?: string[],
        yms?:string[],
        start_ymd?: Date,
        end_ymd?: Date,
        ymds?: Date[],
        factory_uids?: string[],
    },registuser:string, entityManager: EntityManager): Promise<void> {
        var qb = entityManager.createQueryBuilder()
            .update(WorkerReportEntity)
            .set({deleteflg:true, registuser:registuser})
            .where("company_uid = :company_uid", { company_uid: condition.company_uid });

        //削除する月報の従業員
        if (condition.worker_uids && condition.worker_uids.length>0) {
            var worker_uids = condition.worker_uids;
            qb.andWhere(new Brackets(iqb =>
                worker_uids.forEach((worker_uid, idx) => iqb.orWhere("worker_uid=:worker_uid" + idx, { ["worker_uid" + idx]: worker_uid }))
            ))
        };
        //削除する月報の年月
        if (condition.yms) {
            var yms = condition.yms;
            qb.andWhere(new Brackets(iqa=>
                yms.forEach((ym, idx) => {
                    var year = Number(ym.slice(0, 4));
                    var month = Number(ym.slice(4, 6));
                    var start_ymd = new Date(year, month - 1, 1);
                    var end_ymd = new Date(year, month, 1);
                    iqa.orWhere(new Brackets(iqb => {
                        iqb.andWhere("ymd>=:ym_start_ymd" + idx, { ["ym_start_ymd" + idx]: start_ymd })
                        iqb.andWhere("ymd<:ym_end_ymd" + idx, { ["ym_end_ymd" + idx]: end_ymd })
                    }));
                })
            ));
        }

        //削除する範囲（開始年月日)
        if (condition.start_ymd) {
            var start_ymd = condition.start_ymd;
            qb.andWhere(new Brackets(iqb =>
                iqb.andWhere("ymd>=:start_ymd", { start_ymd: start_ymd })
            ));
        }
        //削除する範囲（終了年月日)
        if (condition.end_ymd) {
            var end_ymd = new Date(condition.end_ymd);
            end_ymd.setDate(end_ymd.getDate() + 1);
            qb.andWhere(new Brackets(iqb =>
                iqb.andWhere("ymd<:end_ymd", { end_ymd: end_ymd })
            ));
        }

        //削除する年月日
        if (condition.ymds && condition.ymds.length > 0) {
            var ymd = condition.ymds;
            qb.andWhere(new Brackets(iqb =>
                ymd.forEach((ymd, idx) => iqb.orWhere("ymd=:ymd" + idx, { ["ymd" + idx]: ymd }))
            ))
        };


        //削除する現場
        if (condition.factory_uids && condition.factory_uids.length > 0) {
            var factory_uids = condition.factory_uids;
            qb.andWhere(new Brackets(iqb =>
                factory_uids.forEach((factory_uid, idx) => iqb.orWhere("factory_uid=:factory_uid" + idx, { ["factory_uid" + idx]: factory_uid }))
            ))
        };

        return new Promise((resolveFunc, rejectFunc) =>
            qb.execute().then(
                () =>resolveFunc(),
                (error) => rejectFunc(error)
            )
        );
    }

    
}


export default new WorkerReportsService();