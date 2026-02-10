export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    graphql_public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            graphql: {
                Args: {
                    operationName?: string
                    query?: string
                    variables?: Json
                    extensions?: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
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
            chat_messages: {
                Row: {
                    chat_id: string
                    content: string
                    created_at: string
                    id: string
                    sender_id: string
                }
                Insert: {
                    chat_id: string
                    content: string
                    created_at?: string
                    id?: string
                    sender_id: string
                }
                Update: {
                    chat_id?: string
                    content?: string
                    created_at?: string
                    id?: string
                    sender_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_messages_chat_id_fkey"
                        columns: ["chat_id"]
                        isOneToOne: false
                        referencedRelation: "chats"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "chat_messages_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            chat_participants: {
                Row: {
                    chat_id: string
                    joined_at: string
                    user_id: string
                }
                Insert: {
                    chat_id: string
                    joined_at?: string
                    user_id: string
                }
                Update: {
                    chat_id?: string
                    joined_at?: string
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
                    created_at: string
                    id: string
                    is_group: boolean | null
                    name: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    is_group?: boolean | null
                    name?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    is_group?: boolean | null
                    name?: string | null
                }
                Relationships: []
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
                    location: string | null
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
                    location?: string | null
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
                    location?: string | null
                    start_time?: string | null
                    time_text?: string | null
                    title?: string
                }
                Relationships: []
            }
            help_offers: {
                Row: {
                    created_at: string
                    helper_id: string
                    id: string
                    message: string | null
                    request_id: string
                    status: string
                }
                Insert: {
                    created_at?: string
                    helper_id: string
                    id?: string
                    message?: string | null
                    request_id: string
                    status?: string
                }
                Update: {
                    created_at?: string
                    helper_id?: string
                    id?: string
                    message?: string | null
                    request_id?: string
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "help_offers_helper_id_fkey"
                        columns: ["helper_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
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
                    created_at: string
                    description: string
                    id: string
                    is_active: boolean | null
                    latitude: number
                    location_name: string | null
                    longitude: number
                    resolved_at: string | null
                    status: string
                    title: string
                    user_id: string
                    urgency: string | null
                }
                Insert: {
                    created_at?: string
                    description: string
                    id?: string
                    is_active?: boolean | null
                    latitude: number
                    location_name?: string | null
                    longitude: number
                    resolved_at?: string | null
                    status?: string
                    title: string
                    user_id: string
                    urgency?: string | null
                }
                Update: {
                    created_at?: string
                    description?: string
                    id?: string
                    is_active?: boolean | null
                    latitude?: number
                    location_name?: string | null
                    longitude?: number
                    resolved_at?: string | null
                    status?: string
                    title?: string
                    user_id?: string
                    urgency?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "help_requests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    full_name: string | null
                    id: string
                    route_end: string | null
                    route_start: string | null
                    updated_at: string
                    username: string | null
                    vehicle_type: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id: string
                    route_end?: string | null
                    route_start?: string | null
                    updated_at?: string
                    username?: string | null
                    vehicle_type?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id?: string
                    route_end?: string | null
                    route_start?: string | null
                    updated_at?: string
                    username?: string | null
                    vehicle_type?: string | null
                }
                Relationships: []
            }
            swipes: {
                Row: {
                    created_at: string
                    direction: string
                    id: string
                    swiped_id: string
                    swiper_id: string
                }
                Insert: {
                    created_at?: string
                    direction: string
                    id?: string
                    swiped_id: string
                    swiper_id: string
                }
                Update: {
                    created_at?: string
                    direction?: string
                    id?: string
                    swiped_id?: string
                    swiper_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "swipes_swiped_id_fkey"
                        columns: ["swiped_id"]
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
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
