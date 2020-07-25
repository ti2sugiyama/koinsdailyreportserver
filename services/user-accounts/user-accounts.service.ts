import { getDBConnection } from "../database/database-connection";
import { UserAccount } from "../../models/user-account";
import { UserAccountEntity } from "../../entities/user-account.entity";
import { NotFoundUserAccountError } from "../../error/not-found-user-account.error";

class UserAccountsService{
    getUserAccountByAuthID(
        auth_id     :string
    ): Promise<UserAccount>{

        /*----検索条件----*/
        var search: { 
            auth_id:string
        } = {
            auth_id: auth_id,
        };

        /*----DBアクセス----*/
        return new Promise<UserAccount>((resolveFunc, rejectFunc) =>
            getDBConnection().then(
                (connection)=>connection.getRepository(UserAccountEntity).find(search).then(
                    (userAccounts) => {
                        if (userAccounts.length){
                            resolveFunc(userAccounts[0]);
                        }else{
                            rejectFunc(new NotFoundUserAccountError(search.auth_id));
                        }
                    },
                    (error) => rejectFunc(error))
                ,
                (error:any)=>rejectFunc(error)
            )
        );
    }
}

export default new UserAccountsService();