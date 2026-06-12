'use client';

import { useEffect } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';

export default function CollaborationSimulator() {
  const store = useLoveStudyStore();
  useEffect(() => {
    const pomodoroInterval = setInterval(() => {
      if (store.pomodoro.isRunning) store.tickPomodoro();
    }, 1000);
    return () => clearInterval(pomodoroInterval);
  }, [store]);
  return null;
}
