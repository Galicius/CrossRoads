import React, { createContext, useState, useContext, ReactNode } from 'react';

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
    joinEvent: (eventId: string) => void;
    leaveEvent: (eventId: string) => void;
    createEvent: (newEvent: Event) => void;
    deleteEvent: (eventId: string) => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_EVENTS: Event[] = [
    {
        id: '1',
        title: 'Sunrise Yoga',
        description: 'Relax with me at sunrise yoga this Saturday! We\'ll have a great time.',
        time: '5.45 - 7.10 AM',
        location: 'Paris, France',
        image_url: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Sports'
    },
    {
        id: '2',
        title: 'City Cycling',
        description: 'Join us for a 20km ride around the city center.',
        time: '9.00 - 11.00 AM',
        location: 'Central Park',
        image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Sports'
    },
    {
        id: '3',
        title: 'Tech Meetup',
        description: 'Discussing the latest in AI and React Native.',
        time: '6.00 - 9.00 PM',
        location: 'TechHub Downtown',
        image_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Tech'
    }
];

export const EventsProvider = ({ children }: { children: ReactNode }) => {
    const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);

    const userEvents = events.filter(e => e.joined || e.isCustom);

    const joinEvent = (eventId: string) => {
        setEvents(prevEvents => prevEvents.map(event =>
            event.id === eventId ? { ...event, joined: true } : event
        ));
    };

    const leaveEvent = (eventId: string) => {
        setEvents(prevEvents => prevEvents.map(event =>
            event.id === eventId ? { ...event, joined: false } : event
        ));
    };

    const createEvent = (newEvent: Event) => {
        // When creating an event, the user is automatically a participant/owner.
        // We mark it as 'isCustom' and 'joined' (or just imply joined if custom).
        // Let's set joined=true for consistency in filtering userEvents.
        setEvents(prev => [{ ...newEvent, joined: true }, ...prev]);
    };

    const deleteEvent = (eventId: string) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
    };

    return (
        <EventsContext.Provider value={{
            allEvents: events,
            userEvents,
            joinEvent,
            leaveEvent,
            createEvent,
            deleteEvent
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
