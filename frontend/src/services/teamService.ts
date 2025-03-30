import { Team } from '../types/team';

export class TeamService {
  private static instance: TeamService;
  private readonly TEAM_KEY = 'current_team';

  private constructor() {}

  public static getInstance(): TeamService {
    if (!TeamService.instance) {
      TeamService.instance = new TeamService();
    }
    return TeamService.instance;
  }

  public getCurrentTeam(): Team | null {
    const teamStr = localStorage.getItem(this.TEAM_KEY);
    if (!teamStr) return null;
    try {
      return JSON.parse(teamStr) as Team;
    } catch (_e) {
      this.removeCurrentTeam();
      return null;
    }
  }

  public setCurrentTeam(team: Team): void {
    localStorage.setItem(this.TEAM_KEY, JSON.stringify(team));
  }

  public removeCurrentTeam(): void {
    localStorage.removeItem(this.TEAM_KEY);
  }

  public getCurrentTeamId(): string | null {
    const team = this.getCurrentTeam();
    return team?.uuid || null;
  }
}
