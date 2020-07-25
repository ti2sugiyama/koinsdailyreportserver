import { Entity, PrimaryColumn, Column, BaseEntity } from 'typeorm';
import { UserAccount } from '../models/user-account';
const DB_INFO = require('config').get("DB");

@Entity({ name: "usr_account" })
export class UserAccountEntity extends BaseEntity implements UserAccount {
    constructor(data?: {
        company_uid: string,
        auth_id: string
    }) {
        super();
        if (data) {
            this.company_uid = data.company_uid;
            this.auth_id = data.auth_id;
        } else {
            this.company_uid = '';
            this.auth_id = '';
        }
    }
    @PrimaryColumn()
    public uid:string = '';

    @Column()
    public company_uid: string = '';

    @Column()
    public auth_id: string = '';

}