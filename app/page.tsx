"use client";
import dynamic from 'next/dynamic';

const FlashJuiceApp = dynamic(() => import('./flash-juice-app'), { ssr: false });

export default function Page() {
  return <FlashJuiceApp />;
}
