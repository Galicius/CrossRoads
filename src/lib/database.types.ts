export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
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
                    }
                ]
            }
            builders: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    location: string | null
                    logo_url: string | null
                    name: string
                    owner_id: string | null
                    website: string | null
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    location?: string | null
                    logo_url?: string | null
                    name: string
                    owner_id?: string | null
                    website?: string | null
                }
                Update: {
                    created_at?: string
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
                    is_read: boolean | null
                    sender_id: string
                }
                Insert: {
                    chat_id: string
                    content: string
                    created_at?: string
                    id?: string
                    is_read?: boolean | null
                    sender_id: string
                }
                Update: {
                    chat_id?: string
                    content?: string
                    created_at?: string
                    id?: string
                    is_read?: boolean | null
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
                    }
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
                    }
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
                    joined_at: string
                    status: string | null
                    user_id: string
                }
                Insert: {
                    event_id: string
                    joined_at?: string
                    status?: string | null
                    user_id: string
                }
                Update: {
                    event_id?: string
                    joined_at?: string
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
                    }
                ]
            }
            events: {
                Row: {
                    activity_type: string | null
                    created_at: string
                    created_by: string | null
                    description: string | null
                    end_time: string | null
                    id: string
                    image_url: string | null
                    location: string | null
                    start_time: string | null
                    title: string
                }
                Insert: {
                    activity_type?: string | null
                    created_at?: string
                    created_by?: string | null
                    description?: string | null
                    end_time?: string | null
                    id?: string
                    image_url?: string | null
                    location?: string | null
                    start_time?: string | null
                    title: string
                }
                Update: {
                    activity_type?: string | null
                    created_at?: string
                    created_by?: string | null
                    description?: string | null
                    end_time?: string | null
                    id?: string
                    image_url?: string | null
                    location?: string | null
                    start_time?: string | null
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
                    }
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
                    }
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
                    latitude: number | null
                    longitude: number | null
                    route_data: Json | null
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
                    latitude?: number | null
                    longitude?: number | null
                    route_data?: Json | null
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
                    latitude?: number | null
                    longitude?: number | null
                    route_data?: Json | null
                    updated_at?: string | null
                    username?: string | null
                    website?: string | null
                }
                Relationships: []
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
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_nearby_builders: {
                Args: {
                    lat: number
                    long: number
                    radius_km?: number
                }
                Returns: {
                    id: string
                    business_name: string
                    bio: string
                    expertise: string[]
                    hourly_rate: number
                    travel_radius_km: number
                    is_active: boolean
                    created_at: string
                    distance_km: number
                }[]
            }
            handle_swipe: {
                Args: {
                    p_swiper_id: string
                    p_swipee_id: string
                    p_liked: boolean
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
}
