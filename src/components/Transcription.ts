import { AssemblyAI } from "assemblyai";

export async function transcribeAudioTrack(audio: MediaStreamTrack, apiKey: string) {
  const client = new AssemblyAI({ apiKey });


  const stream = new MediaStream([audio]);
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  return new Promise<string | null>((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const uploadUrl = await client.files.upload(blob);
        const transcript = await client.transcripts.transcribe({
          audio_url: uploadUrl,
          speech_model: "universal"
        });
        resolve(transcript.text);
      } catch (err) {
        console.error("Transcription failed:", err);
        resolve(null);
      }
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // record 5 seconds
  });
  
}