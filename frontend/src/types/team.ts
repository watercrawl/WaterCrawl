export interface TeamProfile {
  uuid: string;
  email: string;
  full_name: string;
}

export interface TeamMember {
  uuid: string;
  user: TeamProfile;
  is_owner: boolean;
}

export interface Team {
  uuid: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamInvitation {
  uuid: string;
  email: string;
  created_at: string;
}

export interface TeamInvitationURL {
  url: string;
  code: string;
}
