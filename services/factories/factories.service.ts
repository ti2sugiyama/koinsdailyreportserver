import { Factory, extractFactories, extractFactory } from "../../models/factory";
import { FactoryEntity } from "../../entities/factory.entity";
import { EntityManager, Brackets } from "typeorm";
import { getDBConnection } from "../database/database-connection";
import workerFactoriesService from "../workers/worker-factories.service";
import workerReportsService from "../worker-reports/worker-reports.service";

class FactorysService{

    /**
     * 現場一覧取得
     * @param condition 検索条件
     *          company_uid  : 企業id
     *          allflg?      : 削除済みも表示するか
     */
    getFactories(condition:{
        company_uid :string,
        allflg?     :boolean
    }): Promise<Factory[]>{

        /*----検索条件----*/
        var search: { 
            company_uid :string,
            deleteflg?  :boolean
        } = {
            company_uid: condition.company_uid
        };

        if (!condition.allflg) {//allflgがundefinedもしくはfalseの時は deleteflgがfalseのみ表示
            search['deleteflg'] = false
        }

        /*----DBアクセス----*/
        return new Promise<Factory[]>((resolveFunc, rejectFunc) =>
            getDBConnection().then(
                (connection)=>connection.getRepository(FactoryEntity).find(search).then(
                    (factories)=> resolveFunc(extractFactories(factories)),
                    (error) => rejectFunc(error))
                ,
                (error:any)=>rejectFunc(error)
            )
        );
    }

    /**
     * 現場取得
     * @param condition 検索条件
     *          company_uid  : 企業id
     *          uid          : 現場id
     *          allflg?      : 削除済みも表示するか
     */
    getFactory(condition:{
        company_uid :string,
        uid         :string,
        allflg?     :boolean
    }): Promise<Factory> {

        /*----検索条件----*/
        var search: {
            company_uid :string,
            uid         :string,
            deleteflg?  :boolean
        } = {
            company_uid :condition.company_uid,
            uid         :condition.uid
        };
        if (!condition.allflg) {//allflgがundefinedもしくはfalseの時は deleteflgがfalseのみ表示
            search['deleteflg'] = false
        }

        /*----DBアクセス----*/
        return new Promise<Factory>((resolveFunc, rejectFunc) =>
            getDBConnection().then(
                (connection)=>connection.getRepository(FactoryEntity).findOne(search).then(
                    (factory) => {
                        if (factory) {
                            resolveFunc(extractFactory(factory));
                        } else {
                            rejectFunc(undefined);
                        }
                    }
                    ,
                    (error) => rejectFunc(error)
                )
                ,
                (error)=>rejectFunc(error)
            )
        );
    }


    /**
     * 保存
     * @param factories 保存データ
     * @param company_uid:factoryのcompany_uidに値がない場合に使用する
     * @param regist_uid:登録・更新ユーザー
     */
    save(factories: Factory[], company_uid:string,registuser:string): Promise<FactoryEntity[]> {
        return new Promise <FactoryEntity[]>((resolveFunc:(factoryEntities:FactoryEntity[])=>void,rejectFunc:(err:any)=>void)=>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        this.saveWithTransactionManager(factories, company_uid,registuser, entityManager)
                    ).then(
                        (factories) => resolveFunc(factories),
                        (error) => rejectFunc(error)
                    )
                ,
                (error)=>rejectFunc(error)
            )
        );
    }

    /**
     * 保存　内部で呼ばれる(transaction)
     * @param factories
     * @param entityManager EntityManager
     * @param company_uid:factoryのcompany_uidに値がない場合に使用する
     * @param regist_uid:登録・更新ユーザー
     * @param entityManager EntityManager
     */    
    saveWithTransactionManager(factories: Factory[], company_uid:string,registuser:string, entityManager: EntityManager): Promise<FactoryEntity[]> {
        var factoryEntities: FactoryEntity[] = factories.map(factory => {
            if(!factory.company_uid) factory.company_uid = company_uid;
            return new FactoryEntity({
                ...factory,
                registuser
            })
        });
        return entityManager.save(factoryEntities);
    }


    /**
     * 削除
     * workerFactory,workerReportの対象データも削除する
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          factory_uids? : 現場id配列
     * @param regist_uid:削除ユーザー
     */
    delete(condition: {
        company_uid: string,
        factory_uids?: string[],
    }, registuser: string): Promise<void> {
        return new Promise<void>((resovleFunc:()=>void,rejectFunc:(error:any)=>void)=>
            getDBConnection().then(
                (connection) =>
                    connection.transaction(entityManager =>
                        Promise.all([
                            this.deleteWithTransactionManager(condition, registuser, entityManager),
                            workerFactoriesService.deleteWithTransactionManager(condition,entityManager),
                            workerReportsService.deleteWithTransactionManager(condition,registuser,entityManager)
                        ])
                    ).then(
                        () => resovleFunc(),
                        (error) => rejectFunc(error)
                    )
                ,
                (error)=>rejectFunc(error)
            )
        )
    }


    /**
     * 削除(deleteflgをtrueに)
     * @param condition 削除条件
     *          company_uid  : 企業id
     *          factory_uids? : 現場id配列
     * @param regist_uid:登録・更新ユーザー
     * @param entityManager EntityManager
     */
    deleteWithTransactionManager(condition: {
        company_uid: string,
        factory_uids?: string[]
    }, registuser: string, entityMmanager: EntityManager): Promise<void> {
        var qb = entityMmanager.createQueryBuilder()
            .update(FactoryEntity)
            .set({ "deleteflg": true, registuser: registuser})
            .where("company_uid = :company_uid", { company_uid: condition.company_uid });

        //削除する現場
        if (condition.factory_uids) {
            var factory_uids = condition.factory_uids;
            qb.andWhere(new Brackets(iqb =>
                factory_uids.forEach((factory_uid, idx) => iqb.orWhere("uid=:uid" + idx, { ["uid" + idx]: factory_uid }))
            ))
        };


        return new Promise((resolveFunc, rejectFunc) =>
            qb.execute().then(
                () => {
                    resolveFunc();
                },
                (error) => rejectFunc(error)
            )
        );
    }
}

export default new FactorysService();