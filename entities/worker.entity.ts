import { Entity, PrimaryColumn, Column, BaseEntity, AfterLoad } from 'typeorm';
import { Worker } from '../models/worker';
const DB_INFO = require('config').get("DB");

@Entity({ name: "worker" })
export class WorkerEntity extends BaseEntity implements Worker {
  constructor(data?:{
    uid:string,
    id:string,
    company_uid:string,
    seikanji:string,
    meikanji:string,
    subcontractor:boolean,
    deleteflg:boolean,
    version:number,
    registuser:string,
  }){
    super();
    if(data){
      this.uid = data.uid;
      this.id = data.id;
      this.company_uid = data.company_uid;
      this.seikanji = data.seikanji;
      this.meikanji =data.meikanji;
      this.subcontractor = data.subcontractor;
      this.deleteflg = data.deleteflg;
      this.version = data.version;
      this.registuser=data.registuser;
    }else{
      this.uid = '';
      this.id = '';
      this.company_uid='';
      this.seikanji= '';
      this.meikanji='';
      this.subcontractor=false;
      this.registuser = DB_INFO.registuser;
      this.deleteflg=false;
      this.version=0;
    }
  }

  @PrimaryColumn()
  public uid: string;

  @Column()
  public company_uid: string;

  @Column()
  public id: string;

  @Column()
  public seikanji: string;

  @Column()
  public meikanji: string;

  @Column()
  public subcontractor: boolean;

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
