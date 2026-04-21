'use client';

import { useEffect, useState } from 'react';
import { RealtimeEvent } from '@/types';

export function useRealtimeFeed(enabled = true) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const token = localStorage.getItem('rv_token');
    if (!token) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const url = `${baseUrl.replace(/\/api$/, '')}/api/stream`;
    const source = new EventSource(`${url}?token=${token}`);

    source.onmessage = event => {
      try {
        const parsed = JSON.parse(event.data) as RealtimeEvent;
        setEvents(current => [parsed, ...current].slice(0, 20));
      } catch {
        // ignore malformed payloads
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [enabled]);

  return events;
}
