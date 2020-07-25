
export interface Team {
    company_uid: string,
    uid: string,
    name: string,
    deleteflg: boolean,
    version: number
}

export function extractTeam(team: Team): Team{
    return {
        company_uid: team.company_uid,
        uid: team.uid,
        name:team.name,
        deleteflg: team.deleteflg,
        version: team.version
    }
}

export function extractTeams(teams: Team[]): Team[]{
    return teams.map(team => extractTeam(team));
}