import { useEffect, useRef, useState, useCallback } from 'react';
import { EQUALIZER_FREQUENCIES, EQUALIZER_PRESETS } from '../utils/playerUtils.ts';

export function useWebAudio(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [bandGains, setBandGains] = useState<number[]>(new Array(10).fill(0));
  const [preampGain, setPreampGain] = useState<number>(1.0); // 1.0 = 100%, 2.0 = 200% boost
  const [activePresetId, setActivePresetId] = useState<string>('flat');

  // Initialize Web Audio graph
  const initAudio = useCallback(() => {
    if (audioContextRef.current || !videoRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Create Source Node from video
      const source = ctx.createMediaElementSource(videoRef.current);
      sourceNodeRef.current = source;

      // Create Preamp/Volume Gain Node
      const gainNode = ctx.createGain();
      gainNode.gain.value = preampGain;
      gainNodeRef.current = gainNode;

      // Create 10-Band Biquad Filters
      const filters: BiquadFilterNode[] = EQUALIZER_FREQUENCIES.map((freq, idx) => {
        const filter = ctx.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === EQUALIZER_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = bandGains[idx] || 0;
        return filter;
      });
      filterNodesRef.current = filters;

      // Create Analyser Node for Visualizer
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserNodeRef.current = analyser;

      // Chain: Source -> Filter 0 -> Filter 1 -> ... -> Filter 9 -> Gain -> Analyser -> Destination
      let lastNode: AudioNode = source;
      filters.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });

      lastNode.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);

      setIsAudioInitialized(true);
    } catch {
      // Browsers may block before interaction or if already connected
    }
  }, [videoRef, preampGain, bandGains]);

  // Resume context on play
  const ensureAudioPlaying = useCallback(() => {
    if (!audioContextRef.current) {
      initAudio();
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [initAudio]);

  // Update specific EQ band
  const setBandGain = useCallback((bandIndex: number, gainValue: number) => {
    setBandGains((prev) => {
      const updated = [...prev];
      updated[bandIndex] = gainValue;
      return updated;
    });

    if (filterNodesRef.current[bandIndex]) {
      filterNodesRef.current[bandIndex].gain.setTargetAtTime(
        gainValue,
        audioContextRef.current ? audioContextRef.current.currentTime : 0,
        0.05
      );
    }
    setActivePresetId('custom');
  }, []);

  // Set Preamp multiplier (e.g. 1.0 to 2.0 for 200% VLC boost)
  const setPreamp = useCallback((multiplier: number) => {
    setPreampGain(multiplier);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        multiplier,
        audioContextRef.current ? audioContextRef.current.currentTime : 0,
        0.05
      );
    }
  }, []);

  // Apply a preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = EQUALIZER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePresetId(presetId);
    setBandGains([...preset.gains]);

    preset.gains.forEach((gainVal, idx) => {
      if (filterNodesRef.current[idx]) {
        filterNodesRef.current[idx].gain.setTargetAtTime(
          gainVal,
          audioContextRef.current ? audioContextRef.current.currentTime : 0,
          0.05
        );
      }
    });
  }, []);

  // Reset EQ to Flat
  const resetEqualizer = useCallback(() => {
    applyPreset('flat');
  }, [applyPreset]);

  // Get frequency data array for visualizer
  const getFrequencyData = useCallback((): Uint8Array => {
    if (!analyserNodeRef.current) {
      return new Uint8Array(32);
    }
    const data = new Uint8Array(analyserNodeRef.current.frequencyBinCount);
    analyserNodeRef.current.getByteFrequencyData(data);
    return data;
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isAudioInitialized,
    initAudio,
    ensureAudioPlaying,
    bandGains,
    setBandGain,
    preampGain,
    setPreamp,
    activePresetId,
    applyPreset,
    resetEqualizer,
    getFrequencyData,
  };
}
