import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { floatTo16BitPCM, base64ToFloat32, arrayBufferToBase64 } from '../lib/audio-utils';

interface LiveAPIOptions {
  model?: string;
  systemInstruction?: string;
  tools?: any[];
  onToolCall?: (calls: any[]) => void;
  onMessage?: (text: string) => void;
  onTurnComplete?: () => void;
}

export function useLiveAPI({ 
  model = "gemini-3.1-flash-live-preview",
  systemInstruction = "You are Nyra, a sassy and witty AI tutor.",
  tools = [],
  onToolCall,
  onMessage,
  onTurnComplete
}: LiveAPIOptions = {}) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const activeSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlaybackTimeRef = useRef<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const audioNodesRef = useRef<AudioBufferSourceNode[]>([]);

  const stop = useCallback(() => {
    setIsActive(false);
    setIsConnecting(false);
    setError(null);
    
    // Stop all audio nodes
    audioNodesRef.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    audioNodesRef.current = [];

    if (activeSessionRef.current) {
      activeSessionRef.current.close();
      activeSessionRef.current = null;
    }
    
    if (sessionRef.current) {
      sessionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }
    
    nextPlaybackTimeRef.current = 0;
  }, []);

  const sendVideoFrame = useCallback((base64Data: string) => {
    if (activeSessionRef.current) {
      activeSessionRef.current.sendRealtimeInput({
        video: { data: base64Data, mimeType: 'image/jpeg' }
      });
    }
  }, []);

  const handleInterruption = useCallback(() => {
    console.log("Processing Interruption: Clearing playback queue...");
    
    // 1. Stop all pending audio nodes IMMEDIATELY
    audioNodesRef.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    audioNodesRef.current = [];

    // 2. Reset playback clock
    nextPlaybackTimeRef.current = 0;

    // 3. Optional: Re-initialize context if needed for hardware-level flush
    if (playbackContextRef.current) {
      const oldContext = playbackContextRef.current;
      oldContext.close().then(() => {
        const newContext = new AudioContext({ sampleRate: 24000 });
        playbackContextRef.current = newContext;
      }).catch(err => {
        console.warn("Error during audio context re-init on interruption:", err);
      });
    }
  }, []);

  const start = useCallback(async () => {
    if (isActive || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      if (!activeSessionRef.current) {
        console.error("Connection timed out after 30s");
        setError("Connection timed out. Gemini is sleeping or the network is being difficult.");
        setIsConnecting(false);
        stop();
      }
    }, 30000);

    try {
      console.log("Starting Nyra connection to model:", model);
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error("GEMINI_API_KEY is missing from process.env");
        setError("API Key missing. Please ensure GEMINI_API_KEY is configured in the environment.");
        setIsConnecting(false);
        return;
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        apiVersion: 'v1beta'
      });
      
      const modelName = model; 
      const fullModelName = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
      console.log("Full model name for Live connect:", fullModelName);
      
      // 1. Setup Microphone
      console.log("Starting Nyra Live session...");
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser doesn't support audio recording in this environment.");
      }

      // Diagnostic: Check available devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("Available Media Devices:", devices.map(d => ({ kind: d.kind, label: d.label, id: d.deviceId })));
      } catch (e) {
        console.warn("Device enumeration failed:", e);
      }

      let stream: MediaStream;
      try {
        // Attempt 1: Standard constraints
        console.log("Attempting mic access with standard constraints...");
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (firstErr) {
        console.warn("First mic access attempt failed, trying basic fallback...", firstErr);
        // Attempt 2: Basic fallback
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (secondErr: any) {
          console.error("All mic access attempts failed.");
          // If both fail, we rethrow with a more descriptive error if it's the specific NotFoundError
          if (secondErr.name === 'NotFoundError' || secondErr.name === 'DevicesNotFoundError') {
            throw new Error("No physical microphone detected. Please plug in a mic or headset.");
          }
          throw secondErr;
        }
      }
      
      micStreamRef.current = stream;
      console.log("Microphone access granted.");

      const audioContext = new AudioContext({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') await audioContext.resume();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      // 2. Setup Playback
      const playbackContext = new AudioContext({ sampleRate: 24000 });
      if (playbackContext.state === 'suspended') await playbackContext.resume();
      playbackContextRef.current = playbackContext;

      // 3. Connect to Gemini Live
      console.log("Connecting to Gemini Live WebSocket with model:", fullModelName);
      // @ts-ignore - live is a experimental feature
      const sessionPromise = ai.live.connect({
        model: fullModelName,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }, // Nyra-like voice
          },
          outputAudioTranscription: {},
          systemInstruction,
          tools: tools.length ? [{ functionDeclarations: tools }] : undefined,
        },
        callbacks: {
          onopen: () => {
            clearTimeout(timeoutId);
            console.log("Nyra is live (onopen)!");
            setIsActive(true);
            setIsConnecting(false);
            
            // Start streaming audio
            processor.onaudioprocess = (e) => {
              if (!activeSessionRef.current) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = floatTo16BitPCM(inputData);
              const base64Data = arrayBufferToBase64(pcmData.buffer);
              
              activeSessionRef.current.sendRealtimeInput({
                audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            };
            
            source.connect(processor);
            processor.connect(audioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Log for debugging
            console.log("Nyra received Live Message:", message);

            if (message.toolCall) {
              console.log("Live Tool Call detected (top-level):", message.toolCall);
            }

            // Handle User Transcription (if enabled in config)
            // @ts-ignore - some versions of the SDK might have this field
            const userParts = (message.serverContent as any)?.userTurn?.parts;
            if (userParts) {
              const userText = userParts.filter((p: any) => p.text).map((p: any) => p.text).join("");
              if (userText && onMessage) {
                // We use a specific prefix or handle differently if needed, 
                // but usually, we just want to save it as a 'user' message.
                // In this app, we'll notify the component.
                console.log("Detected user transcription:", userText);
                // We could pass a role to onMessage, but for now we'll just log and see.
              }
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log("Nyra was interrupted!");
              handleInterruption();
              return;
            }

            // Handle Turn Complete
            if (message.serverContent?.turnComplete) {
              if (onTurnComplete) onTurnComplete();
            }

            // Handle Audio/Text Output
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              const base64Audio = parts.find(p => p.inlineData)?.inlineData?.data;
              if (base64Audio && playbackContextRef.current) {
                const float32Data = base64ToFloat32(base64Audio);
                const buffer = playbackContextRef.current.createBuffer(1, float32Data.length, 24000);
                buffer.getChannelData(0).set(float32Data);
                
                const sourceNode = playbackContextRef.current.createBufferSource();
                sourceNode.buffer = buffer;
                sourceNode.connect(playbackContextRef.current.destination);
                
                const startTime = Math.max(playbackContextRef.current.currentTime, nextPlaybackTimeRef.current);
                sourceNode.start(startTime);
                nextPlaybackTimeRef.current = startTime + buffer.duration;

                // Add to tracker for interruption
                audioNodesRef.current.push(sourceNode);
                sourceNode.onended = () => {
                  audioNodesRef.current = audioNodesRef.current.filter(n => n !== sourceNode);
                };
              }

              // Handle Text Output (from modalities or transcription)
              const combinedText = parts.filter(p => p.text).map(p => p.text).join("");

              if (combinedText && onMessage) {
                onMessage(combinedText);
              }

              // Handle Tool Calls in parts
              const calls = parts.filter(p => p.functionCall).map(p => p.functionCall);
              if (calls.length && onToolCall) {
                console.log("Nyra is calling tools via parts:", calls);
                onToolCall(calls);
                
                if (activeSessionRef.current) {
                  const functionResponses = calls.map(c => ({
                    name: c.name,
                    id: c.id,
                    response: { output: { success: true } }
                  }));

                  if (typeof activeSessionRef.current.sendToolResponse === 'function') {
                    activeSessionRef.current.sendToolResponse({ functionResponses });
                  } else {
                    activeSessionRef.current.sendRealtimeInput(functionResponses.map(r => ({ functionResponse: r })));
                  }
                }
              }
            }

            // Handle top-level toolCall if present
            // @ts-ignore
            if (message.toolCall && onToolCall) {
               // @ts-ignore
               const calls = message.toolCall.functionCalls;
               if (calls && calls.length) {
                 onToolCall(calls);
                 if (activeSessionRef.current) {
                    if (typeof activeSessionRef.current.sendToolResponse === 'function') {
                        activeSessionRef.current.sendToolResponse({
                          functionResponses: calls.map((c: any) => ({
                            name: c.name,
                            id: c.id,
                            response: { output: { success: true } }
                          }))
                        });
                    }
                 }
               }
            }
          },
          onerror: (err: any) => {
            clearTimeout(timeoutId);
            console.error("Nyra encountered a WebSocket error:", err);
            
            let msg = "Connection lost. Nyra is taking a nap.";
            const errMsg = err?.message || String(err);

            if (errMsg.includes("service is currently unavailable") || errMsg.includes("503")) {
              msg = "Gemini Live is currently overloaded or unavailable in your region. 🌐 Please try again in 1 minute, or click the 'NEW TAB' icon at the top right to open the app outside the framing—this often fixes WebSocket connection issues!";
            } else if (errMsg === "Network error" || !navigator.onLine) {
              msg = "Network Error! 🌐 Please check your internet connection and ensure your browser allows WebSockets. (Hint: Try opening the app in a NEW TAB using the icon at the top right)";
            }
            
            setError(msg);
            stop();
          },
          onclose: (e) => {
            clearTimeout(timeoutId);
            console.log("Nyra connection closed:", e);
            stop();
          }
        }
      });

      sessionRef.current = sessionPromise;
      const session = await sessionPromise;
      clearTimeout(timeoutId);
      activeSessionRef.current = session;
      console.log("Session promise resolved.");

    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Connection setup failed:", err);
      
      let friendlyMessage = err.message || "Failed to go live.";
      
      if (err.name === 'NotFoundError' || err.message?.includes('device not found')) {
        friendlyMessage = "Microphone nahi mil raha! 🎤 Physical Check karein: 1. Kya Mic plugged in hai? 2. Kya aapne browser address bar mein LOCK icon par click karke Mic ALLOW kiya hai? 3. Kya koi aur app (Zoom/Meet) mic use kar raha hai?";
      } else if (err.name === 'NotAllowedError') {
        friendlyMessage = "Microphone permission denied! 🚫 Please allow microphone access in your browser settings to talk to Nyra.";
      } else if (err.name === 'NotReadableError') {
        friendlyMessage = "Microphone is already in use by another app. 🎧 Please close other apps using the mic.";
      }
      
      setError(friendlyMessage);
      setIsConnecting(false);
      stop();
    }
  }, [isActive, isConnecting, model, systemInstruction, stop, handleInterruption, tools, onToolCall]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isActive,
    isConnecting,
    error,
    start,
    stop,
    sendVideoFrame
  };
}
