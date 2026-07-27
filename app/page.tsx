"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const FlashJuiceApp = dynamic(() => import('./flash-juice-app'), { ssr: false });

export default function Page() {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return (
      <main style={{
        minHeight: '100dvh', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '24px'
      }}>
        <Image src="/logo.png" alt="Flash Juice" width={72} height={72} priority />
        <h1 className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/60">
          Flash Juice
        </h1>
        <button
          onClick={() => setEntered(true)}
          style={{
            marginTop: '8px',
            padding: '14px 48px',
            background: 'transparent',
            border: '1px solid rgba(255,136,0,0.3)',
            color: '#FF8800',
            borderRadius: '16px',
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Enter
        </button>
      </main>
    );
  }

  return <FlashJuiceApp />;
}
