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
    pitchShift.current = new Tone.PitchShift({ pitch: 0, windowSize: 0.1 }).connect(limiter);
    
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
    player.current.playbackRate = 1 + (val / 100) * 0.15 * factor;
    pitchShift.current.pitch = (val / 100) * 2.5 * factor;
  };

  const downloadJuicedFile = async () => {
    if (!file || !isLoaded) return;
    setIsExporting(true);

    const buffer = await file.arrayBuffer();
    const audioBuffer = await Tone.getContext().decodeAudioData(buffer);
    const duration = audioBuffer.duration / (player.current?.playbackRate || 1);
    
    const output = await Tone.Offline(async () => {
      const offlinePlayer = new Tone.Player(audioBuffer).toDestination();
      const offlinePitch = new Tone.PitchShift({
        pitch: pitchShift.current?.pitch || 0,
        windowSize: 0.1
      }).toDestination();
      offlinePlayer.connect(offlinePitch);
      offlinePlayer.playbackRate = player.current?.playbackRate || 1;
      offlinePlayer.start(0);
    }, duration);

    const wav = audioBufferToWav(output);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = `Juiced_${file.name.split('.')[0]}.wav`;
    anchor.href = url;
    anchor.click();
    setIsExporting(false);
  };

  function audioBufferToWav(buffer: AudioBuffer) {
    let numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArr = new ArrayBuffer(length),
        view = new DataView(bufferArr),
        channels = [], i, sample,
        offset = 0,
        pos = 0;
    setUint32(0x46464952); view.setUint32(4, 36 + buffer.length * numOfChan * 2, true);
    setUint32(0x45564157); setUint32(0x20746d66); view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true); view.setUint16(34, 16, true);
    setUint32(0x61746164); view.setUint32(40, buffer.length * numOfChan * 2, true);
    for(i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
    while(pos < buffer.length) {
      for(i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][pos]));
        view.setInt16(44 + offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
      pos++;
    }
    return bufferArr;
    function setUint32(data: any) { view.setUint32(4 + pos, data, true); pos += 4; }
  }

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

            {/* כפתור ה-Download החדש - נקי, יוקרתי, ללא ג'ונגל */}
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