'use client';

import { getInitials, getAvatarColor } from '@/lib/utils/format';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ name, avatarUrl, avatarEmoji, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-xl font-bold',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover border border-white/10 ${sizeClasses[size]} ${className}`}
      />
    );
  }

  if (avatarEmoji) {
    return (
      <div
        className={`rounded-full flex items-center justify-center bg-dark-elevated border border-white/10 select-none shadow-sm ${sizeClasses[size]} ${className}`}
        title={name}
      >
        <span>{avatarEmoji}</span>
      </div>
    );
  }

  const colorClass = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium shadow-sm select-none border border-white/10 ${colorClass} ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}
