'use client';

import { useState, useEffect } from 'react';
import { Profile, CurrencyCode } from '@/lib/types';
import { BottomSheet } from '../ui/BottomSheet';
import { generateEpcQrPayload, generateQrDataUrl, generatePayPalMeUrl } from '@/lib/epcQr';
import { formatCurrency } from '@/lib/utils/format';
import { Avatar } from '../ui/Avatar';
import { QrCode, ExternalLink, Copy, Check, ShieldCheck, CreditCard } from 'lucide-react';

interface GiroCodeModalProps {
  fromUser: Profile;
  toUser: Profile;
  amount: number;
  currency?: CurrencyCode;
  groupName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GiroCodeModal({
  fromUser,
  toUser,
  amount,
  currency = 'EUR',
  groupName = 'FairSplit',
  isOpen,
  onClose,
}: GiroCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedIban, setCopiedIban] = useState(false);

  const hasIban = Boolean(toUser.iban && toUser.iban.trim().length > 10);
  const paypalUrl = toUser.paypal_me_handle
    ? generatePayPalMeUrl(toUser.paypal_me_handle, amount, currency)
    : '';

  useEffect(() => {
    if (isOpen && hasIban) {
      const payload = generateEpcQrPayload({
        recipientName: toUser.display_name,
        iban: toUser.iban!,
        bic: toUser.bic || '',
        amount,
        currency,
        remittanceText: `${groupName} Ausgleich`,
      });

      generateQrDataUrl(payload).then(setQrDataUrl);
    }
  }, [isOpen, hasIban, toUser, amount, currency, groupName]);

  const copyIban = () => {
    if (toUser.iban) {
      navigator.clipboard.writeText(toUser.iban.replace(/\s+/g, ''));
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Schulden direkt begleichen"
      subtitle={`An ${toUser.display_name} überweisen`}
    >
      <div className="space-y-6 py-2 text-center">
        {/* Payment Summary Header */}
        <div className="p-5 bg-dark-elevated rounded-2xl border border-dark-border flex flex-col items-center justify-center">
          <Avatar name={toUser.display_name} size="xl" className="mb-3" />
          <div className="text-sm text-gray-400 font-medium">Überweisungsbetrag</div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-0.5">
            {formatCurrency(amount, currency)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Empfänger: {toUser.display_name}</div>
        </div>

        {/* 1. SEPA GiroCode (EPC-QR) */}
        {hasIban && qrDataUrl ? (
          <div className="p-5 bg-white rounded-3xl space-y-3 text-dark-bg shadow-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Offizieller SEPA GiroCode</span>
            </div>
            <div className="flex justify-center p-2 bg-white rounded-2xl">
              <img src={qrDataUrl} alt="SEPA EPC GiroCode QR" className="w-52 h-52 object-contain" />
            </div>
            <p className="text-xs text-gray-600 font-medium">
              Öffne deine Banking-App (Sparkasse, DKB, N26, ING, etc.) und scanne diesen QR-Code für eine vorausgefüllte Überweisung.
            </p>

            <div className="pt-2 border-t border-gray-200 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-700 font-semibold">{toUser.iban}</span>
                <button
                  type="button"
                  onClick={copyIban}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-1 font-sans text-xs font-bold"
                >
                  {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIban ? 'Kopiert' : 'IBAN'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-dark-card rounded-2xl border border-dark-border text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <CreditCard className="w-4 h-4" />
              <span>Keine Bank-IBAN hinterlegt</span>
            </div>
            <p className="text-xs text-gray-400">
              {toUser.display_name} hat noch keine IBAN im Profil hinterlegt. Du kannst PayPal oder Barausgleich nutzen.
            </p>
          </div>
        )}

        {/* 2. PayPal.me 1-Click Link */}
        {paypalUrl && (
          <a
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold flex items-center justify-center gap-2.5 shadow-xl shadow-blue-950/40 transition-all active:scale-[0.98]"
          >
            <span>Mit PayPal.me senden ({formatCurrency(amount, currency)})</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl border border-dark-border text-gray-300 font-medium hover:bg-white/5 text-sm"
          >
            Fertig
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
