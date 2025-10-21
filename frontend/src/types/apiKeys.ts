export interface ApiKey {
  uuid: string;
  created_at: string | number | Date;
  name: string;
  key: string;
  last_used_at: string | number | Date;
}
