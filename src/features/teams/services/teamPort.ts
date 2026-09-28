import type {
  TeamMember,
  Roster,
  Invitation,
  CreateRosterInput,
  CreateInvitationInput,
  TeamRole,
  ManagerSubrole,
  StaffSubrole,
  RosterMemberAssignment,
} from '../types';

export interface ITeamPort {
  getMembers(teamId: string): Promise<TeamMember[]>;
  updateMemberRole(memberId: string, newRole: TeamRole): Promise<void>;
  updateMemberRosterAssignments(
    memberId: string,
    assignments: RosterMemberAssignment[]
  ): Promise<void>;
  updateMemberGlobalSubrole(
    memberId: string,
    subrole?: ManagerSubrole | StaffSubrole | string
  ): Promise<void>;
  removeMemberFromTeam(memberId: string): Promise<void>;

  getRosters(teamId: string): Promise<Roster[]>;
  createRoster(teamId: string, input: CreateRosterInput): Promise<Roster>;
  deleteRoster(rosterId: string): Promise<void>;

  createInvitation(teamId: string, input: CreateInvitationInput): Promise<Invitation>;
  getInvitationByCode(code: string): Promise<Invitation | null>;
  consumeInvitation(code: string): Promise<void>;
}
