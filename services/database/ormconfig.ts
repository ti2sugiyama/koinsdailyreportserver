import { TypeOrmSQlLogger } from "./type-orm-sql-logger";

const TypeOrmNamingStrategy = require('./type-orm-naming-strategy');

const DB_INFO = require('config').get("DB");

export const ormconfig = {
    type: DB_INFO.TYPE,
    host: DB_INFO.HOST,
    port: DB_INFO.PORT,
    username: DB_INFO.USERNAME,
    password: DB_INFO.PASSWORD,
    database: DB_INFO.DATABASE,

    //Repositoryで使用するEntityクラスを列挙
    entities: [__dirname + '/../../entities/*.entity.{js,ts}'],
    //Entityを作る際 変数名のCamelCaseを自動でSnakeCaseのフィールドに変更する
    //@Column({name:'hoge_hoge'})と記述するなら不要
    namingStrategy: new TypeOrmNamingStrategy(),

    //log
    logger: new TypeOrmSQlLogger()

    //rootfolderのormlogs.log に出力される
//    logger: "file" as any,
      
}
