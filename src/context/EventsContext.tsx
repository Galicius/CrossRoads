import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define the Event type based on what we're using in SocialFeedScreen
// Format a Date into a readable string like "Feb 11, 2026 at 10:30 AM"
function formatEventDateTime(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month} ${day}, ${year} at ${hours}:${mins} ${ampm}`;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    time: string;
    location: string;
    image_url: string;
    category: string;
    isCustom?: boolean; // True if created by the user
    joined?: boolean; // True if the user has joined this event
    latitude?: number;
    longitude?: number;
    distanceKm?: number; // Distance from user's route, computed client-side
    startDate?: Date; // Actual date/time of the event
}

interface EventsContextType {
    allEvents: Event[];
    userEvents: Event[];
    joinEvent: (eventId: string) => Promise<void>;
    leaveEvent: (eventId: string) => Promise<void>;
    createEvent: (newEvent: Event) => Promise<void>;
    deleteEvent: (eventId: string) => Promise<void>;
    loading: boolean;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            fetchEvents();
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Fetch all events
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            if (eventsError) throw eventsError;

            // 2. If user is logged in, fetch their participations
            let joinedEventIds: string[] = [];
            if (user) {
                const { data: participations, error: partError } = await supabase
                    .from('event_participants')
                    .select('event_id')
                    .eq('user_id', user.id);

                if (partError) throw partError;
                joinedEventIds = participations.map(p => p.event_id);
            }

            // 3. Map to Event interface
            const mappedEvents: Event[] = (eventsData || []).map(e => {
                const parsedDate = e.start_time ? new Date(e.start_time) : undefined;
                const timeStr = parsedDate && !isNaN(parsedDate.getTime())
                    ? formatEventDateTime(parsedDate)
                    : (e.time_text || 'TBD');
                return {
                    id: e.id,
                    title: e.title,
                    description: e.description || '',
                    time: timeStr,
                    location: e.location || '',
                    image_url: e.image_url || '',
                    category: e.activity_type || '',
                    isCustom: user ? e.created_by === user.id : false,
                    joined: joinedEventIds.includes(e.id),
                    latitude: e.latitude ?? undefined,
                    longitude: e.longitude ?? undefined,
                    startDate: parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined,
                };
            });

            setEvents(mappedEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const joinEvent = async (eventId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Should prompt login in real app

            // Optimistic Update
            setEvents(prev => prev.map(e => e.id === eventId ? { ...e, joined: true } : e));

            const { error } = await supabase
                .from('event_participants')
                .insert({
                    event_id: eventId,
                    user_id: user.id,
                    status: 'going'
                });

            if (error) {
                console.error('Error joining event:', error);
                // Revert optimistic update
                setEvents(prev => prev.map(e => e.id === eventId ? { ...e, joined: false } : e));
            }
        } catch (error) {
            console.error('Error joining event:', error);
        }
    };

    const leaveEvent = async (eventId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Optimistic Update
            setEvents(prev => prev.map(e => e.id === eventId ? { ...e, joined: false } : e));

            const { error } = await supabase
                .from('event_participants')
                .delete()
                .eq('event_id', eventId)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error leaving event:', error);
                // Revert
                setEvents(prev => prev.map(e => e.id === eventId ? { ...e, joined: true } : e));
            }
        } catch (error) {
            console.error('Error leaving event:', error);
        }
    };

    const createEvent = async (newEvent: Event) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('events')
                .insert({
                    title: newEvent.title,
                    description: newEvent.description,
                    time_text: newEvent.time,
                    location: newEvent.location,
                    image_url: newEvent.image_url,
                    activity_type: newEvent.category,
                    created_by: user.id,
                    latitude: newEvent.latitude ?? null,
                    longitude: newEvent.longitude ?? null,
                    start_time: newEvent.startDate ? newEvent.startDate.toISOString() : null,
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const createdDate = data.start_time ? new Date(data.start_time) : undefined;
                const createdTimeStr = createdDate && !isNaN(createdDate.getTime())
                    ? formatEventDateTime(createdDate)
                    : (data.time_text || 'TBD');
                const createdParams: Event = {
                    id: data.id,
                    title: data.title,
                    description: data.description || '',
                    time: createdTimeStr,
                    location: data.location || '',
                    image_url: data.image_url || '',
                    category: data.activity_type || '',
                    isCustom: true,
                    joined: true,
                    latitude: data.latitude ?? undefined,
                    longitude: data.longitude ?? undefined,
                    startDate: createdDate && !isNaN(createdDate.getTime()) ? createdDate : undefined,
                };

                // Add to local state (optimistic-ish, since we got DB confirmation)
                setEvents(prev => [createdParams, ...prev]);

                // Auto-join the creator
                await supabase.from('event_participants').insert({
                    event_id: data.id,
                    user_id: user.id,
                    status: 'going'
                });
            }

        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    const deleteEvent = async (eventId: string) => {
        try {
            // Optimistic update
            setEvents(prev => prev.filter(e => e.id !== eventId));

            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) {
                console.error('Error deleting event:', error);
                // Re-fetch to restore state if needed, or handle error better
                fetchEvents();
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const userEvents = events.filter(e => e.joined || e.isCustom);

    return (
        <EventsContext.Provider value={{
            allEvents: events,
            userEvents,
            joinEvent,
            leaveEvent,
            createEvent,
            deleteEvent,
            loading
        }}>
            {children}
        </EventsContext.Provider>
    );
};

export const useEvents = () => {
    const context = useContext(EventsContext);
    if (!context) {
        throw new Error('useEvents must be used within an EventsProvider');
    }
    return context;
};
