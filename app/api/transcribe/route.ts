import { AssemblyAI } from "assemblyai";

const apiKey = process.env.ASSEMBLY_AI_API_KEY;

if (!apiKey) {
  throw new Error('API key is not defined');
}

const client = new AssemblyAI({
  apiKey: apiKey,
});

export async function POST(request: Request) {
  try {
    const { audioUrl, prompt } = await request.json();

    // Ensure audioUrl is defined and is a string
    if (typeof audioUrl !== 'string') {
      return Response.json(
        { success: false, error: 'Invalid audio URL' },
        { status: 400 }
      );
    }

    // Transcribe the audio
    const transcript = await client.transcripts.transcribe({ 
      audio: audioUrl,
      language_detection: true
    });

    // Poll for completion
    let result;
    do {
      result = await client.transcripts.get(transcript.id);
      if (result.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before polling again
      }
    } while (result.status !== 'completed' && result.status !== 'error');

    if (result.status === 'error') {
      throw new Error('Transcription failed');
    }

    // Get the summary using Lemur after transcription is complete
    const { response } = await client.lemur.task({
      transcript_ids: [transcript.id],
      prompt: prompt || 'Provide a brief summary of the transcript.',
      final_model: 'anthropic/claude-3-5-sonnet'
    });

    return Response.json({ 
      success: true, 
      transcription: result.text,
      summary: response 
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json(
      { success: false, error: 'Failed to process audio' },
      { status: 500 }
    );
  }
} 