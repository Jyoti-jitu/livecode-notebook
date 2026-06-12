'use client';

import React from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Flame, Clock, Heart, Award, ArrowRight, Play, BookOpen, Star, Calendar, MessageSquare, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardView() {
  const store = useLoveStudyStore();

  const [activities, setActivities] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/collaboration');
        if (res.ok) {
          const data = await res.json();
          if (data && data.activities) {
            setActivities(data.activities);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch dashboard activities:', e);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: 'Study Streak',
      value: `${store.streak.days} Days`,
      sub: 'Daily target achieved 🔥',
      color: 'from-orange-500 to-rose-500',
      icon: Flame,
    },
    {
      title: 'Hours Studied',
      value: `${(store.studyTimeElapsed / 3600).toFixed(2)} Hrs`,
      sub: 'Together since last month ⏰',
      color: 'from-purple-500 to-love-lavender',
      icon: Clock,
    },
    {
      title: 'Love Reactor',
      value: `${store.heartReactionCount} Hearts`,
      sub: 'Room reaction multiplier 💗',
      color: 'from-rose-500 to-love-secondary',
      icon: Heart,
    },
    {
      title: 'Goal Progress',
      value: `${store.streak.goalProgress}%`,
      sub: 'Weekly progress index 🎯',
      color: 'from-emerald-500 to-teal-500',
      icon: Award,
    }
  ];

  const getIconComponent = (iconName: string) => {
    if (iconName === 'Play') return Play;
    if (iconName === 'BookOpen') return BookOpen;
    return Award;
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
      {/* Title block */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-rose-800 dark:text-rose-100 flex items-center gap-1.5">
          <span>Room Dashboard</span>
          <span className="text-xl">📊</span>
        </h2>
        <p className="text-xs text-rose-400 dark:text-rose-300/60 font-semibold mt-1">
          Welcome back Jitu & Ananya! Here is a summary of your study stats and progress.
        </p>
      </div>

      {/* Grid statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-white/60 dark:bg-love-dark/20 border border-rose-100/40 dark:border-rose-950/20 p-5 rounded-2xl shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-rose-400 dark:text-rose-500 uppercase tracking-widest block">
                  {stat.title}
                </span>
                <span className="text-2xl font-extrabold text-rose-800 dark:text-rose-100 block leading-tight">
                  {stat.value}
                </span>
                <span className="text-[10px] text-rose-500/80 dark:text-rose-400 font-semibold block">
                  {stat.sub}
                </span>
              </div>
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-md`}>
                <Icon className="w-5 h-5 fill-current" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Grid columns: Left: streak calendar tracker / Notebook launches, Right: Timeline activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Streak targets calendar card */}
          <div className="bg-white/50 dark:bg-love-dark/30 border border-rose-100/40 dark:border-rose-950/20 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-rose-400 dark:text-rose-300/40 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-love-primary" />
              <span>Study Streak Calendar</span>
            </h3>
            
            <div className="flex justify-between items-center bg-rose-50/50 dark:bg-love-dark-bg/20 p-4 rounded-xl border border-rose-100/20 dark:border-rose-950/10">
              <div className="space-y-1">
                <div className="text-sm font-bold text-rose-800 dark:text-rose-100">Jitu & Ananya Streak Goals</div>
                <p className="text-[10px] text-rose-500/70 dark:text-rose-400/55 font-semibold mt-1">
                  Study together for at least 15 minutes every day to secure your streak multiplier badge!
                </p>
              </div>
              <span className="text-3xl font-extrabold text-love-primary">{store.streak.days}🔥</span>
            </div>

            {/* Streak grid representation (last 2 weeks) */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 14 }).map((_, i) => {
                const dayNum = i + 1;
                const completed = dayNum <= store.streak.days;
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 relative ${
                      completed
                        ? 'bg-love-light/60 dark:bg-love-primary/30 text-love-primary border-love-primary/35 shadow-sm'
                        : 'bg-white/60 dark:bg-love-dark border-rose-100/35 dark:border-rose-950/20 text-rose-300 dark:text-rose-700'
                    }`}
                  >
                    <span className="text-[9px] font-bold">Day {dayNum}</span>
                    {completed ? (
                      <Heart className="w-3.5 h-3.5 fill-current text-love-primary animate-pulse mt-0.5" />
                    ) : (
                      <span className="text-xs mt-0.5">💤</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Access Notebooks List */}
          <div className="bg-white/50 dark:bg-love-dark/30 border border-rose-100/40 dark:border-rose-950/20 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-rose-400 dark:text-rose-300/40 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-love-primary" />
              <span>Favorite & Active Notebooks</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {store.notebooks.slice(0, 4).map((notebook) => (
                <div
                  key={notebook.id}
                  className="p-4 rounded-xl border border-rose-100/30 dark:border-rose-950/25 bg-white/70 dark:bg-love-dark-bg/30 hover:border-love-primary/45 transition-colors group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{notebook.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-rose-800 dark:text-rose-200 truncate max-w-[130px]">
                          {notebook.title}
                        </h4>
                        <span className="text-[8px] text-rose-400 dark:text-rose-500 block">
                          Updated {notebook.lastUpdated}
                        </span>
                      </div>
                    </div>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-rose-50/50 dark:border-rose-900/10 pt-2.5">
                    <span className="text-[9px] font-bold text-rose-500">
                      {notebook.cells.length} Cells inside
                    </span>
                    <button
                      onClick={() => store.setActiveNotebook(notebook.id)}
                      className="flex items-center gap-1 text-[9px] font-bold text-love-primary hover:text-love-secondary cursor-pointer"
                    >
                      <span>Launch</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) - Live Timeline Activity */}
        <div className="lg:col-span-4">
          <div className="bg-white/50 dark:bg-love-dark/30 border border-rose-100/40 dark:border-rose-950/20 p-5 rounded-2xl space-y-4 shadow-sm h-full flex flex-col">
            <h3 className="text-xs font-bold text-rose-400 dark:text-rose-300/40 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
              <Award className="w-4 h-4 text-love-primary" />
              <span>Activity Timeline</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {activities.map((activity, idx) => {
                const Icon = getIconComponent(activity.icon);
                return (
                  <div key={idx} className="flex gap-3 relative">
                    {/* Connecting vertical line */}
                    {idx !== activities.length - 1 && (
                      <div className="absolute top-7 left-3.5 -bottom-5 w-px border-l border-dashed border-rose-200 dark:border-rose-900/30" />
                    )}

                    {/* Left side circular icon status */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
                          {activity.user}
                        </span>
                        <span className="text-[9px] text-rose-300 dark:text-rose-400/40 font-medium">
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-rose-600 dark:text-rose-300/60 leading-normal">
                        {activity.action}
                      </p>
                      <span className="inline-block text-[8px] bg-rose-50/50 dark:bg-love-dark px-1.5 py-0.5 rounded text-rose-500 font-bold uppercase tracking-wider mt-1">
                        {activity.notebook}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-rose-100/30 dark:border-rose-950/10 pt-3 flex flex-col items-center justify-center flex-shrink-0">
              <p className="text-[9px] text-rose-400 text-center font-medium">
                Keep the study fire burning! ❤️
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
