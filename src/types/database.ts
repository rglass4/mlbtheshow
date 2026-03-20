export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: number;
          played_at: string;
          platform: string | null;
          user_username: string;
          opponent_username: string;
          user_team: string;
          opponent_team: string;
          user_score: number;
          opponent_score: number;
          result: 'W' | 'L' | 'T';
          stadium: string | null;
          stadium_elevation_ft: number | null;
          hitting_difficulty: string | null;
          pitching_difficulty: string | null;
          weather: string | null;
          temperature_f: number | null;
          wind: string | null;
          attendance: number | null;
          attendance_capacity_pct: number | null;
          scheduled_first_pitch: string | null;
          winning_pitcher: string | null;
          losing_pitcher: string | null;
          winning_pitcher_record: string | null;
          losing_pitcher_record: string | null;
          user_game_score: number | null;
          opponent_game_score: number | null;
          raw_html_filename: string | null;
          created_by: string | null;
          created_at: string | null;
          is_public: boolean;
          coop_players: string[] | null;
        };
        Insert: Partial<Database['public']['Tables']['games']['Row']> & {
          id: number;
          played_at: string;
          user_username: string;
          opponent_username: string;
          user_team: string;
          opponent_team: string;
          user_score: number;
          opponent_score: number;
          result: 'W' | 'L' | 'T';
        };
        Update: Partial<Database['public']['Tables']['games']['Row']>;
      };
      batting_lines: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      pitching_lines: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      inning_lines: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      play_events: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      perfect_perfect_events: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      import_logs: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
      profiles: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> };
    };
    Views: {
      v_game_summary: { Row: Record<string, Json> };
      v_batting_leaders: { Row: Record<string, Json> };
      v_pitching_leaders: { Row: Record<string, Json> };
      v_player_game_log: { Row: Record<string, Json> };
      v_recent_games: { Row: Record<string, Json> };
    };
  };
}
