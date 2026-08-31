import QRCode from 'qrcode';

export interface EpcPaymentDetails {
  recipientName: string;
  iban: string;
  bic?: string;
  amount: number;
  currency?: string;
  remittanceText?: string;
}

/**
 * Generates the EPC-QR-Code (GiroCode) standard payload string.
 * Standard format defined by European Payments Council (EPC069-08).
 */
export function generateEpcQrPayload({
  recipientName,
  iban,
  bic = '',
  amount,
  remittanceText = 'FairSplit Ausgleich',
}: EpcPaymentDetails): string {
  const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
  const cleanBic = bic ? bic.replace(/\s+/g, '').toUpperCase() : '';
  const formattedAmount = `EUR${amount.toFixed(2)}`;

  // EPC069-08 Quick Response Code Guidelines
  const lines = [
    'BCD',                      // Service Tag
    '002',                      // Version
    '1',                        // Character set (1 = UTF-8)
    'SCT',                      // Identification code (SEPA Credit Transfer)
    cleanBic,                   // BIC
    recipientName.trim().slice(0, 70), // Beneficiary Name
    cleanIban,                  // Beneficiary IBAN
    formattedAmount,            // Amount
    '',                         // Purpose Code
    '',                         // Remittance Reference (Structured)
    remittanceText.trim().slice(0, 140), // Remittance Information (Unstructured)
    '',                         // Beneficiary to originator information
  ];

  return lines.join('\n');
}

/**
 * Generates a QR Code as Data URL (image/png)
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return '';
  }
}

/**
 * Generates PayPal deep link supporting PayPal.Me handle or PayPal email
 */
export function generatePayPalMeUrl(handleOrEmail: string, amount: number, currency = 'EUR'): string {
  const input = handleOrEmail.trim();
  if (!input) return '';

  // If user entered a full PayPal.me URL
  const strippedUrl = input.replace(/^https?:\/\/(www\.)?paypal\.me\//i, '');

  // If it's a PayPal email address
  if (strippedUrl.includes('@') && strippedUrl.includes('.')) {
    return `https://www.paypal.com/myaccount/transfer/homepage/send`;
  }

  // Otherwise it's a PayPal.Me handle
  const cleanHandle = strippedUrl.replace(/^@/, '').trim();
  if (!cleanHandle) return '';
  return `https://paypal.me/${cleanHandle}/${amount.toFixed(2)}${currency}`;
}
