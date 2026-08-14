export interface ArchivedRoomSummary {
  id: string;
  room_code: string;
  room_name: string;
  archived_at: string;
  message_count: number;
  participant_count: number;
}

export interface DashboardRoomsResponse {
  rooms: ArchivedRoomSummary[];
  total: number;
}

export interface ArchivedMessage {
  nickname: string;
  content: string;
  sent_at: string;
}

export interface ArchivedRoomDetail {
  id: string;
  room_code: string;
  room_name: string;
  created_at: string;
  archived_at: string;
  messages: ArchivedMessage[];
}
