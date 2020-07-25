import { Entity, PrimaryColumn, Column, BaseEntity, AfterLoad } from 'typeorm';
import { WorkerFactoryFlat } from '../models/worker-factory';
const DB_INFO = require('config').get("DB");

@Entity({ name: "worker_factory" })
export class WorkerFactoryEntity extends BaseEntity implements WorkerFactoryFlat{
  constructor(data?:{
    company_uid:string,
    worker_uid:string,
    ym: string,
    factory_uid:string,
    seq : number,
    registuser:string
  }){
    super();
    if(data){
      this.company_uid = data.company_uid;
      this.worker_uid = data.worker_uid;
      this.ym = data.ym;
      this.factory_uid = data.factory_uid;
      this.seq = data.seq;
      this.registuser = data.registuser;
    }else{
      this.company_uid='';
      this.worker_uid = '';
      this.ym = '';
      this.factory_uid = '';
      this.seq = 0;
      this.registuser = DB_INFO.registuser;
    }
    this.deleteflg = false;
    this.version = 0;
  }

  @Column()
  public company_uid: string;

  @PrimaryColumn()
  public worker_uid: string;

  @PrimaryColumn()
  public ym: string;

  @PrimaryColumn()
  public factory_uid: string;

  @Column()
  public seq: number;


  @Column()
  public deleteflg: boolean;

  @Column()
  public version: number;

  @Column()
  public registuser: string;

  @Column()
  public registdatetime: Date = new Date();


  @AfterLoad()
  converter() {
    //    this.birthday = new Date(this.birthday);

  }
}
