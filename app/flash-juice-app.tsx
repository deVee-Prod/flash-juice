"use client"

import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { Upload, Play, Pause, Download } from 'lucide-react';
import Image from 'next/image';

export default function FlashJuice() {
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [value, setValue] = useState(0); 
  const [isExaggerated, setIsExaggerated] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const player = useRef<Tone.Player | null>(null);
  const pitchShift = useRef<Tone.PitchShift | null>(null);

  useEffect(() => {
    const limiter = new Tone.Limiter(-1).toDestination();
    pitchShift.current = new Tone.PitchShift({ pitch: 0, windowSize: 0.03 }).connect(limiter);
    
    return () => {
      player.current?.dispose();
      pitchShift.current?.dispose();
      limiter.dispose();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await Tone.start();
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setIsLoaded(false);
      setFile(uploadedFile);
      const url = URL.createObjectURL(uploadedFile);
      if (player.current) player.current.dispose();
      player.current = new Tone.Player(url).connect(pitchShift.current!);
      await player.current.load(url);
      setIsLoaded(true);
    }
  };

  const updateEffect = (val: number) => {
    setValue(val);
    if (!player.current || !pitchShift.current) return;
    
    const factor = isExaggerated ? 1.5 : 1.0;
    const speed = 1 + (val / 100) * 0.15 * factor;
    
    player.current.playbackRate = speed;
    pitchShift.current.pitch = (val / 100) * 2.5 * factor;
    
    // סוד ה-windowSize: מונע את הדיליי בקיקים
    pitchShift.current.windowSize = Math.max(0.01, 0.03 - (val / 100) * 0.02);
  };

  const downloadJuicedFile = async () => {
    if (!file || !isLoaded) return;
    setIsExporting(true);

    try {
      const buffer = await file.arrayBuffer();
      const audioBuffer = await Tone.getContext().decodeAudioData(buffer);
      
      const factor = isExaggerated ? 1.5 : 1.0;
      const currentPlaybackRate = 1 + (value / 100) * 0.15 * factor;
      const currentPitch = (value / 100) * 2.5 * factor;
      const currentWindowSize = Math.max(0.01, 0.03 - (value / 100) * 0.02);
      
      const duration = audioBuffer.duration / currentPlaybackRate;
      
      const output = await Tone.Offline(async () => {
        const offlinePitch = new Tone.PitchShift({
          pitch: currentPitch,
          windowSize: currentWindowSize 
        }).toDestination();
        
        const offlinePlayer = new Tone.Player(audioBuffer).connect(offlinePitch);
        offlinePlayer.playbackRate = currentPlaybackRate;
        offlinePlayer.start(0);
      }, duration);

      const wav = audioBufferToWav((output as any)._buffer || output);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.download = `Juiced_${file.name.split('.')[0]}.wav`;
      anchor.href = url;
      anchor.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
    
    setIsExporting(false);
  };

  function audioBufferToWav(buffer: any) {
    let numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArr = new ArrayBuffer(length),
        view = new DataView(bufferArr),
        channels = [], i, sample, offset = 0, pos = 0;
    
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };

    setUint32(0x46464952); setUint32(36 + buffer.length * numOfChan * 2);
    setUint32(0x45564157); setUint32(0x20746d66); setUint32(16);
    setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16);
    setUint32(0x61746164); setUint32(buffer.length * numOfChan * 2);

    for(i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
    while(pos < length) {
      for(i = 0; i < numOfChan; i++) {
        const sampleIndex = Math.floor((pos - 44) / (numOfChan * 2));
        sample = Math.max(-1, Math.min(1, channels[i][sampleIndex]));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
    }
    return bufferArr;
  }

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
    <main className="relative min-h-[100dvh] w-full flex flex-col items-center justify-between overflow-hidden bg-black text-white px-6 py-10 md:py-16 font-sans selection:bg-[#FF8800]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FF8800]/10 blur-[150px] rounded-full pointer-events-none" />
      
      <header className="relative z-10 w-full flex flex-col items-center gap-4 shrink-0">
        <Image src="/logo.png" alt="Logo" width={80} height={80} priority />
        <h1 className="text-[11px] font-bold tracking-[0.5em] text-gray-500 uppercase">Flash Juice</h1>
      </header>

      <div className="relative z-10 w-full max-w-[400px] my-auto py-8">
        <div className="w-full bg-[#0E0E0E] border border-white/[0.04] rounded-[2rem] p-9 shadow-2xl">
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-[#FF8800]/40 transition-all mb-8 group/upload">
            <div className="bg-[#151515] p-3 rounded-full mb-3 group-hover/upload:scale-105 transition-transform">
              <Upload className="text-[#FF8800]" size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-8 text-center line-clamp-1">
              {file ? file.name : "Upload Track"}
            </span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".mp3,.wav,.m4a" />
          </label>

          <div className="mb-10">
            <input type="range" min="0" max="100" value={value} onChange={(e) => updateEffect(parseInt(e.target.value))} className="w-full h-[1.5px] bg-gray-900 rounded-lg appearance-none cursor-pointer accent-[#FF8800]" />
            <div className="mt-6 text-center text-3xl font-bold font-mono tracking-tighter">{value}%</div>
          </div>

          <div className="flex flex-col space-y-4">
            <button onClick={togglePlay} disabled={!isLoaded} className="w-full bg-[#1A1A1A] border border-white/[0.03] hover:bg-white hover:text-black py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all uppercase tracking-[0.2em] text-[10px]">
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              <span>Preview</span>
            </button>

            <button 
              onClick={downloadJuicedFile} 
              disabled={!isLoaded || isExporting} 
              className="w-full bg-[#101010] border border-[#FF8800]/10 hover:border-[#FF8800]/50 text-[#FF8800] py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] disabled:opacity-30 uppercase tracking-[0.2em] text-[10px] shadow-[0_0_15px_rgba(255,136,0,0.05)] hover:shadow-[0_0_20px_rgba(255,136,0,0.15)]"
            >
              {isExporting ? <div className="animate-spin h-4 w-4 border-2 border-[#FF8800] border-t-transparent rounded-full" /> : <Download size={18} />}
              <span>{isExporting ? "Juicing..." : "Juice & Download"}</span>
            </button>
          </div>
        </div>
      </div>

      <footer className="relative z-10 w-full flex flex-col items-center gap-4 shrink-0">
        <p className="text-[9px] font-medium tracking-[0.1em] text-gray-600">Powered by deVee Boutique Label</p>
        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/[0.05]">
          <Image src="/label_logo.jpg" alt="deVee" width={48} height={48} />
        </div>
      </footer>
    </main>
  );
}