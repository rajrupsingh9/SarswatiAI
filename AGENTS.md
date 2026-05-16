# Nyra - Core Live Voice Interaction Technical Specification

This document contains critical technical details for Nyra's real-time voice capability. **DO NOT MODIFY** the implementation of the `useLiveAPI` hook or related audio utilities without ensuring these specifications are maintained.

## 1. Core Architecture
- **Hook**: `src/hooks/useLiveAPI.ts` handles the WebSocket lifecycle with Gemini 2.0 Live.
- **Library**: `@google/genai` (Experimental Live API).
- **Model**: `gemini-3.1-flash-live-preview`.
- **Modality**: Purely `AUDIO` (Bi-directional).
- **Voice**: `Zephyr` (Sassy/Witty personality).

## 2. Audio Specifications (MANDATORY)
Maintaining these sample rates is critical for the AI to understand input and for playback to sound natural.

### Input (Microphone to Gemini)
- **Sample Rate**: 16000 Hz.
- **Format**: PCM 16-bit (Little Endian).
- **MimeType**: `audio/pcm;rate=16000`.
- **Processor**: `ScriptProcessorNode` (size: 2048) in `AudioContext`.

### Output (Gemini to Speaker)
- **Sample Rate**: 24000 Hz.
- **Format**: PCM 16-bit.
- **Voice Output**: Base64 encoded chunks converted to `Float32Array`.
- **Playback**: Manual buffer scheduling using `nextPlaybackTimeRef` for seamless low-latency streaming.

## 3. Critical Flow & Logic
- **Interruption Handling**: The hook must listen for `message.serverContent.interrupted`. On interruption, it **MUST** close the current `playbackContext` and re-initialize it to immediately clear the audio queue.
- **Permission**: The `microphone` permission must remain in `metadata.json`.
- **Network Constraints**: `experimentalForceLongPolling` is enabled in Firestore, but Live API uses pure WebSockets. If connection fails, suggest "Open in New Tab" to bypass iframe restrictions.

## 4. Key Utilities
- `src/lib/audio-utils.ts`:
  - `floatTo16BitPCM`: Crucial for preparing mic data for Gemini.
  - `base64ToFloat32`: Crucial for decoding Gemini's voice chunks.
  - `arrayBufferToBase64`: Encodes binary PCM for WebSocket transmission.

## 5. Deployment Constraints
- **API Key**: `GEMINI_API_KEY` must be provided server-side but is accessed via `process.env` in this specific setup (ensure environment proxying works).
- **Frame Permissions**: Microphone access is mandatory.

## 6. Chat Persistence & History
- **Firestore Integration**: All interactions (User Chat, AI Voice response, AI Tool outputs like diagrams/problems) MUST be persisted to Firestore under `users/{userId}/documents/{docId}/messages`.
- **Syncing**: The `Classroom` component must sync with this collection to provide a persistent "Inbox" experience across sessions.
- **Tool Outputs**: Tools like `post_to_chat` and `generate_practice_problem` must explicitly trigger a Firestore write to ensure visibility in the persistent history.

---
**CRITICAL**: If modifications are required for the `Classroom` component or UI, ensure the `useLiveAPI` lifecycle (especially `stop()` on unmount) is strictly followed to prevent memory leaks and orphaned microphone/audio workers.
