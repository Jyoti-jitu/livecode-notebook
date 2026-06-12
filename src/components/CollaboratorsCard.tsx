'use client';

import React, { useState } from 'react';
import { useLoveStudyStore } from '@/store/useLoveStudyStore';
import { Heart, Users } from 'lucide-react';
import { HeartExplosion } from './FloatingHearts';

function getAvatarForUser(username: string, isCurrentUser: boolean, ownerAvatar: string): string {
  if (isCurrentUser) return ownerAvatar;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=ff5c93,f43f5e,e11d48&textColor=ffffff&radius=50&fontSize=38`;
}

export default function CollaboratorsCard() {
  const store = useLoveStudyStore();
  const [explosion, setExplosion] = useState<{ show: boolean; x: number; y: number } | null>(null);

  const handleHeartClick = (e: React.MouseEvent) => {
    store.incrementHearts(1);
    setExplosion({ show: true, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="bg-white/50 dark:bg-love-dark/30 border border-rose-100/40 dark:border-rose-950/20 p-4 rounded-2xl space-y-4 shadow-sm relative">
      <h3 className="text-xs font-bold text-rose-400 dark:text-rose-300/40 uppercase tracking-wider flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-love-primary" /><span>Collaborators</span>
      </h3>
      <div className="space-y-2.5">
        {store.onlineUsers.length === 0 ? (
          <div className="text-center py-2 text-[11px] text-rose-300 italic">{store.currentUser ? 'Waiting for others to join...' : 'Join the room to see collaborators'}</div>
        ) : (
          store.onlineUsers.map((username) => {
            const isLocal = username === store.currentUser;
            const avatar = getAvatarForUser(username, isLocal, store.collaborators.jitu.avatar);
            const role = isLocal ? 'Owner' : 'Partner';
            const tagColor = isLocal ? 'text-purple-500 bg-purple-500/10' : 'text-love-primary bg-love-primary/10';
            return (
              <div key={username} className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-love-dark-bg/40 border border-rose-100/20">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt={username} className="w-9 h-9 rounded-full object-cover border border-love-primary/20 bg-rose-100" />
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-200">{username} {isLocal && <span className="text-emerald-500 font-normal">(You)</span>}</span>
                    <span className={`text-[10px] ${tagColor} px-1.5 py-0.5 rounded-md font-semibold self-start mt-0.5`}>{role}</span>
                  </div>
                </div>
                <button onClick={handleHeartClick} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-300 hover:text-love-primary active:scale-95 cursor-pointer">
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className="pt-3 border-t border-rose-100/30">
        <label className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1.5">My Active Identity</label>
        <input type="text" value={store.currentUser} onChange={(e) => store.setCurrentUser(e.target.value)} placeholder="Rename yourself..." className="w-full text-xs bg-white/80 dark:bg-love-dark border border-rose-100/40 px-2.5 py-2 rounded-xl font-bold text-rose-800 dark:text-rose-200 outline-none focus:ring-1 focus:ring-love-primary" />
      </div>
      {explosion?.show && <HeartExplosion x={explosion.x} y={explosion.y} onComplete={() => setExplosion(null)} />}
    </div>
  );
}
