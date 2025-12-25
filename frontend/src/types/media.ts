export interface Media {
  uuid: string;
  team: string; // Team UUID
  content_type: string;
  file_name: string;
  size: number;
  related_object_type_name?: string;
  related_object_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  download_url?: string;
}



