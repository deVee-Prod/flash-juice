"use client"

import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Download } from 'lucide-react';
import Image from 'next/image';

export default function FlashJuice() {
 const [file, setFile] = useState<File | null>(null);
 const [isPlaying, setIsPlaying] = useState(false);
 const [value, setValue] = useState(0);
 const [isExaggerated] = useState(false);
 const [isLoaded, setIsLoaded] = useState(false);
 const [isExporting, setIsExporting] = useState(false);

 const playerRef = useRef<any>(null);
 const pitchShiftRef = useRef<any>(null);
 const ToneRef = useRef<any>(null);

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const uploadedFile = e.target.files?.[0];
 if (!uploadedFile) return;

 setIsLoaded(false);
 setFile(uploadedFile);

 if (!ToneRef.current) {
 ToneRef.current = await import('tone');
 }
 const Tone = ToneRef.current;

 await Tone.start();

 if (!pitchShiftRef.current) {
 const limiter = new Tone.Limiter(-1).toDestination();
 pitchShiftRef.current = new Tone.PitchShift({ pitch: 0, windowSize: 0.03 }).connect(limiter);
 }

 const url = URL.createObjectURL(uploadedFile);
 if (playerRef.current) playerRef.current.dispose();
 playerRef.current = new Tone.Player(url).connect(pitchShiftRef.current);
 await playerRef.current.load(url);
 setIsLoaded(true);
 };

 const updateEffect = (val: number) => {
 setValue(val);
 if (!playerRef.current || !pitchShiftRef.current) return;

 const factor = isExaggerated ? 1.5 : 1.0;
 const speed = 1 + (val / 100) * 0.15 * factor;

 playerRef.current.playbackRate = speed;
 pitchShiftRef.current.pitch = (val / 100) * 2.5 * factor;
 pitchShiftRef.current.windowSize = Math.max(0.01, 0.03 - (val / 100) * 0.02);
 };

 const downloadJuicedFile = async () => {
 if (!file || !isLoaded || !ToneRef.current) return;
 setIsExporting(true);

 const Tone = ToneRef.current;

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
 channels = [], i, sample, pos = 0;

 const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
 const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };

 setUint32(0x46464952); setUint32(36 + buffer.length * numOfChan * 2);
 setUint32(0x45564157); setUint32(0x20746d66); setUint32(16);
 setUint16(1); setUint16(numOfChan);
 setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
 setUint16(numOfChan * 2); setUint16(16);
 setUint32(0x61746164); setUint32(buffer.length * numOfChan * 2);

 for (i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
 while (pos < length) {
 for (i = 0; i < numOfChan; i++) {
 const sampleIndex = Math.floor((pos - 44) / (numOfChan * 2));
 sample = Math.max(-1, Math.min(1, channels[i][sampleIndex]));
 view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
 pos += 2;
 }
 }
 return bufferArr;
 }

 const togglePlay = async () => {
 if (!isLoaded || !ToneRef.current) return;
 await ToneRef.current.start();
 if (isPlaying) {
 playerRef.current?.stop();
 } else {
 playerRef.current?.start();
 }
 setIsPlaying(!isPlaying);
 };

 return (
 <main className="relative min-h-[100dvh] w-full flex flex-col items-center overflow-hidden text-white px-6 pb-10 md:pb-16 selection:bg-[#FF8800]">
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FF8800]/10 blur-[150px] rounded-full pointer-events-none" />

 <header className="w-full relative z-20 flex flex-col items-center shrink-0 mt-8 mb-6">
 <img src="/logo.png" alt="Logo" className="w-[100px] h-[100px] mb-2 object-contain" />
 <h1 className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/60">Flash Juice</h1>
 </header>

      <div className="relative z-10 w-full max-w-xl my-auto py-8">
        <div className="w-full bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] p-10 space-y-8 border border-white/5 shadow-2xl">
          <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-white/10 rounded-2xl p-12 cursor-pointer hover:border-[#FF8800]/40 transition-all group/upload">
            <div className="bg-[#151515] p-3 rounded-full mb-3 group-hover/upload:scale-105 transition-transform">
 <Upload className="text-[#FF8800]" size={20} />
 </div>
 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-8 text-center line-clamp-1">
 {file ? file.name : "Upload Track"}
 </span>
 <input type="file" className="hidden" onChange={handleFileUpload} accept=".mp3,.wav,.m4a" />
 </label>

          <div className="">
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


 </main>
 );
}
