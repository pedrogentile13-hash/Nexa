'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * QR do ingresso — encoda uma URL, não dado cru, de propósito: quem organiza
 * escaneia com a câmera NATIVA do celular (sem scanner dentro do app) e ela
 * já abre a página de confirmação de check-in sozinha.
 */
export function EventTicketQr({ eventId, code }: { eventId: string; code: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/comunidade/eventos/${eventId}/checkin/${code}`;
    QRCode.toDataURL(url, { margin: 1, width: 220 }).then(setDataUrl).catch(() => setDataUrl(null));
  }, [eventId, code]);

  if (!dataUrl) {
    return <div className="bg-surface-2 mx-auto size-[220px] animate-pulse rounded-lg" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URI gerado no cliente, next/image não se aplica
    <img src={dataUrl} alt="QR code do ingresso — mostre para quem está organizando o evento" className="mx-auto rounded-lg" />
  );
}
