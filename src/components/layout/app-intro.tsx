'use client';

import { useEffect, useState } from 'react';

/**
 * Abertura animada do app Android (só aparece dentro do app — o layout só a monta quando o pedido vem dele).
 *
 * É HTML + CSS, sem arquivo de vídeo: pinta no primeiro quadro, não pesa no app e fica nítida em qualquer tela.
 * Dura ~2,6 s e toca uma vez por abertura (sessionStorage). Sai sozinha por animação CSS — se o JavaScript
 * falhar ela não fica presa na frente do app — e um toque na tela encerra antes.
 */
export function AppIntro() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('nx_intro')) setGone(true);
      else sessionStorage.setItem('nx_intro', '1');
    } catch {
      // sem sessionStorage: toca normalmente
    }
  }, []);

  if (gone) return null;
  return (
    <div id="nexa-intro" aria-hidden onClick={() => setGone(true)}>
      <span className="nexa-intro-orb nexa-intro-orb-a" />
      <span className="nexa-intro-orb nexa-intro-orb-b" />
      <div className="nexa-intro-center">
        <span className="nexa-intro-logo">
          {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve */}
          <img src="/brand/logo-mark.webp" alt="" width={96} height={96} />
        </span>
        <span className="nexa-intro-word">
          {'NEXA'.split('').map((l, i) => (
            <span key={i} style={{ animationDelay: `${0.55 + i * 0.08}s` }}>
              {l}
            </span>
          ))}
        </span>
        <span className="nexa-intro-sub">STUDY</span>
        <span className="nexa-intro-tag">Estude com mais foco.</span>
      </div>
    </div>
  );
}
