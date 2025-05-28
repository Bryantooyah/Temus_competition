'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { ConversationProps, AvatarWebsocketMessage } from "./types";
import PixelStreamingVideo from "../PixelStreamingVideo";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { transcribeAudioTrack } from '../Transcription';

const rtcConfig = process.env.NEXT_PUBLIC_USE_TURN_SERVER === 'true' ? {
  iceServers: [
    { urls: `stun:${process.env.NEXT_PUBLIC_STUN_SERVER}` },
    {
      urls: `turn:${process.env.NEXT_PUBLIC_TURN_SERVER}`,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    },
  ]
} : undefined;

function Conversation(props: ConversationProps) {
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const {
    muted = false,
    conversationId,
    startMessage,
    prompt,
    avatar,
    backgroundImageUrl,
    voice,
    conversationSetupParams,
    children,
    onVideoReady,
    setThinkingState,
    onConversationEnd,
    onWebsocketMessage,
  } = props;
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [outputAudioTrack, setOutputAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [avatarId, setAvatarId] = useState('');
  const [avatarName, setAvatarName] = useState('');
  const [text, setText] = useState<string | null>(null);


  useEffect(() => {
    if (!outputAudioTrack) return;
    let stopped = false;
    const apiKey = process.env.NEXT_GMAPS_API_KEY; 

    const stream = new MediaStream([outputAudioTrack]);

    const recordAndTranscribe = async () => {
      while (!stopped) {
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };

        mediaRecorder.start();
        await new Promise(res => setTimeout(res, 15000)); 
        mediaRecorder.stop();

        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = async () => {
            try {
              
              const tempTrack = outputAudioTrack;
             
              const blob = new Blob(chunks, { type: "audio/webm" });
             
              const AssemblyAI = (await import("assemblyai")).AssemblyAI;
              const client = new AssemblyAI({ apiKey });
              const uploadUrl = await client.files.upload(blob);
              const transcript = await client.transcripts.transcribe({
                audio_url: uploadUrl,
                speech_model: "universal"
              });
              if (transcript.text) setText(prev => prev ? prev + " " + transcript.text : transcript.text);
             
            } catch (err) {
              console.error("Transcription failed:", err);
            }
            resolve();
          };
        });
      }
    };

    recordAndTranscribe();

    return () => { stopped = true; };
  }, [outputAudioTrack]);

  const {
    sendJsonMessage,
    lastJsonMessage,
    readyState,
  } = useWebSocket<AvatarWebsocketMessage | null>(
    `${process.env.NEXT_PUBLIC_WSS_SERVER_URL}/api/conversation/webrtc/${conversationId}`
  );

  const cleanupMedia = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setAudioTrack(null);
    setOutputAudioTrack(null);
  }, []);

  const createPeerConnection = useCallback(async () => {
    cleanupMedia();

    const peer = new RTCPeerConnection(rtcConfig);
    peerRef.current = peer;

    peer.ontrack = (event) => {
      event.streams.forEach((stream) => {
        if (remoteAudioRef.current && stream.getAudioTracks().length) {
          remoteAudioRef.current.srcObject = stream;
        }
      });
    };

    try {
      const stream = await navigator.mediaDevices?.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;
      stream.getTracks().forEach((track) => {
        if (peerRef.current && peerRef.current.signalingState !== 'closed') {
          peerRef.current.addTrack(track, stream);
        }
      });

      const [mainAudioTrack] = stream.getAudioTracks();
      setAudioTrack(mainAudioTrack);

      const offer = await peer.createOffer();
      await peer.setLocalDescription(new RTCSessionDescription(offer));

      return peer;
    } catch (error) {
      console.error('Error setting up peer connection:', error);
      cleanupMedia();
      return null;
    }
  }, [cleanupMedia]);

  useEffect(() => {
    if (!lastJsonMessage) return;

    const { type } = lastJsonMessage;

    if (type === 'status' && lastJsonMessage.avatar_uuid) {
      setAvatarId(lastJsonMessage.avatar_uuid);
      onVideoReady?.();
    }
    
    if (type === 'answer' && peerRef.current) {
      try {
        peerRef.current.setRemoteDescription(new RTCSessionDescription(lastJsonMessage.answer))
          .then(() => {
            // Get the output audio track
            peerRef.current?.getReceivers().forEach(receiver => {
              if (receiver.track.kind === 'audio') {
                setOutputAudioTrack(receiver.track);
              }
            });
          })
          .catch((error) => {
            console.error('Error setting remote description:', error);
          });
      } catch (error) {
        console.error('Error creating or setting remote description:', error);
      }
    }

    if (type === 'thinkingState') {
      setThinkingState?.(lastJsonMessage.thinking);
      setText(lastJsonMessage.thinking ? null : text);
    }

    // Display error toast
    if (type === 'error') {
      toastRef.current?.show({
        severity: 'error',
        summary: lastJsonMessage.message,
        life: 5000
      });
    }

    onWebsocketMessage?.(lastJsonMessage);
  }, [lastJsonMessage, onConversationEnd, onVideoReady, onWebsocketMessage, setThinkingState, cleanupMedia]);

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) {
      return;
    }

    sendJsonMessage({
      type: "setup",
      param: {
        apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
        startMessage,
        prompt,
        temperature: 0.0,
        topP: 0.9,
        avatar,
        backgroundImageUrl,
        voice,
        ...conversationSetupParams,
      }
    });

    createPeerConnection().then(peer => {
      if (peer) {
        sendJsonMessage({
          type: "offer",
          offer: peer.localDescription,
        });
      }
    });

    return () => {
      cleanupMedia();
    };
  }, [readyState, sendJsonMessage, conversationSetupParams, prompt, createPeerConnection, cleanupMedia]);

  useEffect(() => {
    if (!audioTrack) {
      return;
    }
    audioTrack.enabled = !muted;
  }, [muted]);

  return (
    <div className="h-full w-full relative overflow-hidden">
      <Toast ref={toastRef} position="top-center" />
      <PixelStreamingVideo avatarId={avatarId} />
      <h1>{text}</h1>
      <div
        style={{
          position: "absolute",
          bottom: 150,
          right: 16,
          zIndex: 10,
          width: 250,
          height: 150,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          background: "#fff"
        }}
      >
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyAKrNJmp5VoPmgRomcQoEZp1a_V2b6HPJk&origin=Upper+Changi&destination=Tampines+Singapore`}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 10,
          width: 200,
          height: 200,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          background: "#fff"
        }}
      >
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyAKrNJmp5VoPmgRomcQoEZp1a_V2b6HPJk&q=famous+cafe+Upper+Changi`}
        />
      </div>
      {text && (
        <div className="absolute top-0 right-0 py-2 px-3 mt-3 mr-3 border-round-xl"  >
          <p className="m-0 text-lg text-black">{text}</p>
        </div>
      )}
      {avatarName && (
        <div className="absolute top-0 left-0 py-2 px-3 mt-3 ml-3 border-round-xl" style={{ backgroundColor: 'rgba(211, 211, 211, 0.8)' }}>
          <p className="m-0 text-2xl text-black">{avatarName}</p>
        </div>
      )}
      <audio ref={remoteAudioRef} autoPlay />
      {children}
    </div>
  )
}

export default Conversation