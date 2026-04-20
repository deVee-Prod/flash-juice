"use client"

import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { Upload, Play, Pause } from 'lucide-react';
import Image from 'next/image';

export default function FlashJuice() {
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [value, setValue] = useState(0); 
  const [isExaggerated, setIsExaggerated] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const player = useRef<Tone.Player | null>(null);
  const pitchShift = useRef<Tone.PitchShift | null>(null);

  useEffect(() => {
    const limiter = new Tone.Limiter(-1).toDestination();
    pitchShift.current = new Tone.PitchShift({
      pitch: 0,
      windowSize: 0.1
    }).connect(limiter);
    
    return () => {
      player.current?.dispose();
      pitchShift.current?.dispose();
      limiter.dispose();
    };
  }, []);

  // FIX 1: Mobile file upload — dispose old player, use onload callback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setIsLoaded(false);
    setIsPlaying(false);
    setFile(uploadedFile);

    if (player.current) {
      player.current.stop();
      player.current.dispose();
      player.current = null;
    }

    const url = URL.createObjectURL(uploadedFile);
    player.current = new Tone.Player({
      url,
      onload: () => setIsLoaded(true),
      onerror: (e) => console.error('Load error:', e),
    }).connect(pitchShift.current!);
  };

  const updateEffect = (val: number) => {
    setValue(val);
    if (!player.current || !pitchShift.current) return;
    
    if (val === 0) {
      player.current.playbackRate = 1;
      pitchShift.current.pitch = 0;
      return;
    }

    const factor = isExaggerated ? 1.5 : 1.0;
    player.current.playbackRate = 1 + (val / 100) * 0.15 * factor;
    pitchShift.current.pitch = (val / 100) * 2.5 * factor;
    pitchShift.current.windowSize = 0.1;
  };

  const togglePlay = async () => {
    if (!isLoaded) return;
    await Tone.start();
    if (isPlaying) {
      player.current?.stop();
    } else {
      player.current?.start();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    // FIX 2: Replace justify-between + py-12 with gap-8 + py-8 for mobile spacing
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 py-8 px-4 font-sans selection:bg-[#FF8800] relative overflow-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FF8800]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#FF8800]/5 blur-[180px] rounded-full pointer-events-none" />

      <div className="flex flex-col items-center text-center z-10">
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-[#FF8800]/15 blur-3xl rounded-full" />
          <Image src="/logo.png" alt="Logo" width={120} height={120} style={{ height: 'auto' }} className="relative z-10" priority />
        </div>
        <h1 className="text-[11px] font-bold tracking-[0.5em] text-gray-500 uppercase">Flash Juice</h1>
      </div>

      <div className="w-full max-w-[400px] bg-[#0E0E0E] border border-white/[0.04] rounded-[2rem] p-9 shadow-2xl z-10 relative">
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-[#FF8800]/40 hover:bg-[#FF8800]/5 transition-all mb-10 group/upload">
          <div className="bg-[#151515] p-3 rounded-full mb-3 group-hover/upload:scale-105 transition-transform">
            <Upload className="text-[#FF8800]" size={20} />
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-8 text-center line-clamp-1">
            {file ? file.name : "Upload Track To Juice"}
          </span>
          <input type="file" className="hidden" onChange={handleFileUpload} accept="audio/*" />
        </label>

        <div className="mb-10">
          <div className="flex justify-between text-[8px] font-bold uppercase tracking-[0.2em] mb-5 px-1">
            <span className={value === 0 ? "text-white" : "text-gray-600 transition-colors"}>Normal</span>
            <span className={value > 0 ? "text-[#FF8800] transition-colors" : "text-gray-800"}>Sped-Up</span>
          </div>
          
          <input type="range" min="0" max="100" value={value} onChange={(e) => updateEffect(parseInt(e.target.value))} className="w-full h-[1.5px] bg-gray-900 rounded-lg appearance-none cursor-pointer accent-[#FF8800]" />
          <div className="mt-6 text-center">
            <span className="text-3xl font-bold text-white tracking-tighter">{value}%</span>
          </div>
        </div>

        <div className="flex flex-col space-y-5">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <input type="checkbox" id="exaggerate" checked={isExaggerated} onChange={() => setIsExaggerated(!isExaggerated)} className="w-4 h-4 rounded bg-black border-white/10 text-[#FF8800] focus:ring-0" />
            <label htmlFor="exaggerate" className="text-[9px] font-bold text-gray-600 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Exaggerate Effect</label>
          </div>

          <button onClick={togglePlay} disabled={!isLoaded} className="w-full bg-[#1A1A1A] border border-white/[0.03] hover:bg-white hover:text-black text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] disabled:opacity-10 uppercase tracking-[0.2em] text-[10px]">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            <span>Preview</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center z-10">
        <p className="text-[9px] font-medium tracking-[0.1em] text-gray-600 mb-4">Powered by deVee Boutique Label</p>
        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/[0.05]">
          <Image src="/label_logo.jpg" alt="deVee" width={48} height={48} style={{ height: 'auto' }} />
        </div>
      </div>
    </main>
  );
}
