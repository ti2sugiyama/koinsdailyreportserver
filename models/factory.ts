
export interface Factory{
    company_uid: string,
    uid: string,
    name: string,
    deleteflg: boolean,
    version: number
}

export function extractFactory(factory: Factory): Factory{
    return {
        company_uid: factory.company_uid,
        uid: factory.uid,
        name: factory.name,
        deleteflg: factory.deleteflg,
        version: factory.version
    }
}

export function extractFactories(factorys: Factory[]): Factory[]{
    return factorys.map(factory => extractFactory(factory));
}