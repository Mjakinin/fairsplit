'use client';

import { useState, useEffect } from 'react';
import { Group } from '@/lib/types';
import { BottomSheet } from '../ui/BottomSheet';
import { generateQrDataUrl } from '@/lib/epcQr';
import { QrCode, Copy, Check, Share2, Users } from 'lucide-react';

interface GroupInviteModalProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupInviteModal({ group, isOpen, onClose }: GroupInviteModalProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${group.invite_token}`
    : `/join/${group.invite_token}`;

  useEffect(() => {
    if (isOpen) {
      generateQrDataUrl(inviteUrl).then(setQrUrl);
    }
  }, [isOpen, inviteUrl]);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FairSplit: Beitritt zu "${group.name}"`,
          text: `Tritt unserer Gruppe "${group.name}" bei FairSplit bei, um Ausgaben & Belege einfach zu teilen:`,
          url: inviteUrl,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Gruppe teilen & einladen"
      subtitle={`Freunde zu "${group.name}" einladen`}
    >
      <div className="space-y-6 py-2 text-center">
        {/* QR Code Container */}
        <div className="p-6 bg-white rounded-3xl space-y-3 shadow-xl inline-block mx-auto">
          {qrUrl ? (
            <img src={qrUrl} alt="Group Invite QR Code" className="w-56 h-56 object-contain mx-auto" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-gray-400">
              <QrCode className="w-12 h-12 animate-pulse" />
            </div>
          )}
          <p className="text-xs text-gray-600 font-medium">
            Scanne diesen QR-Code mit der Smartphone-Kamera zum sofortigen Beitritt.
          </p>
        </div>

        {/* Link Input & Copy */}
        <div className="p-3 bg-dark-elevated rounded-2xl border border-dark-border flex items-center justify-between gap-2 text-left">
          <span className="text-xs font-mono text-gray-300 truncate pl-2">{inviteUrl}</span>
          <button
            type="button"
            onClick={copyLink}
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 flex-shrink-0 transition-all active:scale-95 shadow-md shadow-emerald-950/40"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
          </button>
        </div>

        {/* Web Share API */}
        <button
          type="button"
          onClick={handleShare}
          className="w-full py-4 px-6 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Share2 className="w-5 h-5" />
          <span>Einladungslink teilen</span>
        </button>
      </div>
    </BottomSheet>
  );
}
