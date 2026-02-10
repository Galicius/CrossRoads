import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define the Event type based on what we're using in SocialFeedScreen
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
            const mappedEvents: Event[] = (eventsData || []).map(e => ({
                id: e.id,
                title: e.title,
                description: e.description || '',
                time: e.time_text || 'TBD', // Use the new column
                location: e.location || '',
                image_url: e.image_url || '',
                category: e.activity_type || '',
                isCustom: user ? e.created_by === user.id : false,
                joined: joinedEventIds.includes(e.id)
            }));

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
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const createdParams = {
                    id: data.id,
                    title: data.title,
                    description: data.description || '',
                    time: data.time_text || 'TBD',
                    location: data.location || '',
                    image_url: data.image_url || '',
                    category: data.activity_type || '',
                    isCustom: true,
                    joined: true
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
