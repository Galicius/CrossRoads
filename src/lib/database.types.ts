export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            builder_profiles: {
                Row: {
                    bio: string | null
                    business_name: string | null
                    created_at: string
                    expertise: string[] | null
                    hourly_rate: number | null
                    id: string
                    is_active: boolean | null
                    is_verified: boolean | null
                    travel_radius_km: number | null
                }
                Insert: {
                    bio?: string | null
                    business_name?: string | null
                    created_at?: string
                    expertise?: string[] | null
                    hourly_rate?: number | null
                    id: string
                    is_active?: boolean | null
                    is_verified?: boolean | null
                    travel_radius_km?: number | null
                }
                Update: {
                    bio?: string | null
                    business_name?: string | null
                    created_at?: string
                    expertise?: string[] | null
                    hourly_rate?: number | null
                    id?: string
                    is_active?: boolean | null
                    is_verified?: boolean | null
                    travel_radius_km?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "builder_profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            builders: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    location: string | null
                    logo_url: string | null
                    name: string
                    owner_id: string | null
                    website: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    location?: string | null
                    logo_url?: string | null
                    name: string
                    owner_id?: string | null
                    website?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    location?: string | null
                    logo_url?: string | null
                    name?: string
                    owner_id?: string | null
                    website?: string | null
                }
                Relationships: []
            }
            chat_participants: {
                Row: {
                    chat_id: string
                    joined_at: string | null
                    user_id: string
                }
                Insert: {
                    chat_id: string
                    joined_at?: string | null
                    user_id: string
                }
                Update: {
                    chat_id?: string
                    joined_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_participants_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "chats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "chat_participants_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            chats: {
                Row: {
                    created_at: string | null
                    id: string
                    is_group: boolean | null
                    last_message_at: string | null
                    name: string | null
                    type: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_group?: boolean | null
                    last_message_at?: string | null
                    name?: string | null
                    type?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_group?: boolean | null
                    last_message_at?: string | null
                    name?: string | null
                    type?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            daily_activities: {
                Row: {
                    category: string
                    content: string
                    created_at: string
                    id: string
                    user_id: string
                }
                Insert: {
                    category: string
                    content: string
                    created_at?: string
                    id?: string
                    user_id: string
                }
                Update: {
                    category?: string
                    content?: string
                    created_at?: string
                    id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_activities_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            event_participants: {
                Row: {
                    event_id: string
                    joined_at: string | null
                    status: string | null
                    user_id: string
                }
                Insert: {
                    event_id: string
                    joined_at?: string | null
                    status?: string | null
                    user_id: string
                }
                Update: {
                    event_id?: string
                    joined_at?: string | null
                    status?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "event_participants_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    },
                ]
            }
            events: {
                Row: {
                    activity_type: string | null
                    created_at: string | null
                    created_by: string | null
                    description: string | null
                    end_time: string | null
                    id: string
                    image_url: string | null
                    latitude: number | null
                    location: string | null
                    longitude: number | null
                    start_time: string | null
                    time_text: string | null
                    title: string
                }
                Insert: {
                    activity_type?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    end_time?: string | null
                    id?: string
                    image_url?: string | null
                    latitude?: number | null
                    location?: string | null
                    longitude?: number | null
                    start_time?: string | null
                    time_text?: string | null
                    title: string
                }
                Update: {
                    activity_type?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    end_time?: string | null
                    id?: string
                    image_url?: string | null
                    latitude?: number | null
                    location?: string | null
                    longitude?: number | null
                    start_time?: string | null
                    time_text?: string | null
                    title?: string
                }
                Relationships: []
            }
            help_offers: {
                Row: {
                    builder_id: string
                    created_at: string
                    id: string
                    message: string | null
                    request_id: string
                    status: string | null
                }
                Insert: {
                    builder_id: string
                    created_at?: string
                    id?: string
                    message?: string | null
                    request_id: string
                    status?: string | null
                }
                Update: {
                    builder_id?: string
                    created_at?: string
                    id?: string
                    message?: string | null
                    request_id?: string
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "help_offers_builder_id_fkey"
                        columns: ["builder_id"]
                        isOneToOne: false
                        referencedRelation: "builder_profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "help_offers_request_id_fkey"
                        columns: ["request_id"]
                        isOneToOne: false
                        referencedRelation: "help_requests"
                        referencedColumns: ["id"]
                    },
                ]
            }
            help_requests: {
                Row: {
                    category: string
                    created_at: string
                    description: string
                    id: string
                    latitude: number | null
                    longitude: number | null
                    selected_builder_id: string | null
                    status: string | null
                    user_id: string
                }
                Insert: {
                    category: string
                    created_at?: string
                    description: string
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    selected_builder_id?: string | null
                    status?: string | null
                    user_id: string
                }
                Update: {
                    category?: string
                    created_at?: string
                    description?: string
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    selected_builder_id?: string | null
                    status?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "help_requests_selected_builder_id_fkey"
                        columns: ["selected_builder_id"]
                        isOneToOne: false
                        referencedRelation: "builder_profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "help_requests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            message_reactions: {
                Row: {
                    created_at: string | null
                    id: string
                    message_id: string | null
                    reaction: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    message_id?: string | null
                    reaction: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    message_id?: string | null
                    reaction?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "message_reactions_message_id_fkey"
                        columns: ["message_id"]
                        isOneToOne: false
                        referencedRelation: "messages"
                        referencedColumns: ["id"]
                    },
                ]
            }
            messages: {
                Row: {
                    chat_id: string | null
                    content: string
                    created_at: string | null
                    id: string
                    read_at: string | null
                    sender_id: string | null
                    type: string | null
                }
                Insert: {
                    chat_id?: string | null
                    content: string
                    created_at?: string | null
                    id?: string
                    read_at?: string | null
                    sender_id?: string | null
                    type?: string | null
                }
                Update: {
                    chat_id?: string | null
                    content?: string
                    created_at?: string | null
                    id?: string
                    read_at?: string | null
                    sender_id?: string | null
                    type?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "chats"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    age: number | null
                    avatar_url: string | null
                    bio: string | null
                    full_name: string | null
                    id: string
                    images: string[] | null
                    invite_code: string | null
                    invited_by: string | null
                    is_verified: boolean | null
                    latitude: number | null
                    longitude: number | null
                    route_data: Json | null
                    route_end: string | null
                    route_start: string | null
                    updated_at: string | null
                    username: string | null
                    website: string | null
                }
                Insert: {
                    age?: number | null
                    avatar_url?: string | null
                    bio?: string | null
                    full_name?: string | null
                    id: string
                    images?: string[] | null
                    invite_code?: string | null
                    invited_by?: string | null
                    is_verified?: boolean | null
                    latitude?: number | null
                    longitude?: number | null
                    route_data?: Json | null
                    route_end?: string | null
                    route_start?: string | null
                    updated_at?: string | null
                    username?: string | null
                    website?: string | null
                }
                Update: {
                    age?: number | null
                    avatar_url?: string | null
                    bio?: string | null
                    full_name?: string | null
                    id?: string
                    images?: string[] | null
                    invite_code?: string | null
                    invited_by?: string | null
                    is_verified?: boolean | null
                    latitude?: number | null
                    longitude?: number | null
                    route_data?: Json | null
                    route_end?: string | null
                    route_start?: string | null
                    updated_at?: string | null
                    username?: string | null
                    website?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_invited_by_fkey"
                        columns: ["invited_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            swipes: {
                Row: {
                    created_at: string
                    id: string
                    liked: boolean
                    swipee_id: string
                    swiper_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    liked: boolean
                    swipee_id: string
                    swiper_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    liked?: boolean
                    swipee_id?: string
                    swiper_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "swipes_swipee_id_fkey"
                        columns: ["swipee_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "swipes_swiper_id_fkey"
                        columns: ["swiper_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            travel_paths: {
                Row: {
                    id: number
                    latitude: number
                    longitude: number
                    user_id: string
                    visited_at: string
                }
                Insert: {
                    id?: number
                    latitude: number
                    longitude: number
                    user_id: string
                    visited_at?: string
                }
                Update: {
                    id?: number
                    latitude?: number
                    longitude?: number
                    user_id?: string
                    visited_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "travel_paths_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            create_builder_chat: {
                Args: { p_builder_id: string; p_user_id: string }
                Returns: string
            }
            create_social_chat: {
                Args: { p_user_id: string; p_target_user_id: string }
                Returns: string
            }
            get_nearby_builders: {
                Args: { lat: number; long: number }
                Returns: {
                    bio: string
                    business_name: string
                    created_at: string
                    distance_km: number
                    expertise: string[]
                    hourly_rate: number
                    id: string
                    is_active: boolean
                    travel_radius_km: number
                }[]
            }
            handle_swipe: {
                Args: { p_liked: boolean; p_swipee_id: string; p_swiper_id: string }
                Returns: Json
            }
            is_chat_member: { Args: { _chat_id: string }; Returns: boolean }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const

