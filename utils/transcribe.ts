import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || '',
});

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const data = {
      audio: audioBlob,
    };

    const transcript = await client.transcripts.transcribe(data);
    return transcript.text ?? '';
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

