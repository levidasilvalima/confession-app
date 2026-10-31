import { useEffect, useState, type ReactNode } from 'react';

/**
 * Proteção visual para multitarefa: quando o app vai para segundo plano
 * (document.hidden === true), o conteúdo é desfocado para não aparecer
 * legível no carrossel de apps do celular.
 */
export function PrivacyBlur({ children }: { children: ReactNode }) {
  const [oculto, setOculto] = useState(() => typeof document !== 'undefined' && document.hidden);

  useEffect(() => {
    const atualizar = () => setOculto(document.hidden);
    const esconder = () => setOculto(true);
    document.addEventListener('visibilitychange', atualizar);
    // `pagehide` cobre navegadores que tiram a "foto" da tela antes do visibilitychange.
    window.addEventListener('pagehide', esconder);
    window.addEventListener('pageshow', atualizar);
    return () => {
      document.removeEventListener('visibilitychange', atualizar);
      window.removeEventListener('pagehide', esconder);
      window.removeEventListener('pageshow', atualizar);
    };
  }, []);

  return (
    <div
      className="min-h-dvh"
      aria-hidden={oculto || undefined}
      style={{
        filter: oculto ? 'blur(10px)' : 'none',
        // Desfoca instantaneamente ao sair; volta suavemente ao retornar.
        transition: oculto ? 'none' : 'filter 200ms ease-out',
      }}
    >
      {children}
    </div>
  );
}
