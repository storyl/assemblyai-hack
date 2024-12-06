'use client'

import { useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribeAudio } from '../utils/transcribe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LipSyncCharacter } from '@/components/LipSyncCharacter';

export default function VoiceRecorderTranscriber() {
  const { isRecording, audioBlob, startRecording, stopRecording } = useAudioRecorder();
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleTranscribe = async () => {
    if (audioBlob) {
      setIsTranscribing(true);
      try {
        const text = await transcribeAudio(audioBlob);
        setTranscription(text);
      } catch (error) {
        console.error('Transcription error:', error);
        setTranscription('Error transcribing audio');
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const handleDownload = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'recorded_audio.wav';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container mx-auto p-4 ">
      <Card className="w-full max-w-md mx-auto outline-none border-none shadow-none">
        <CardHeader>
          <CardTitle className='text-center text-4xl font-bold'>Voice to Lip Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <LipSyncCharacter text={transcription} />
          <div className="flex space-x-4 flex-row items-center mt-4 ">
            <Button 
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className='bg-black text-white rounded hover:bg-black/90'
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            {audioBlob && (
              <>
                <Button className='bg-black text-white rounded hover:bg-black/90' onClick={handleDownload}>Download Recording</Button>
                <Button className='bg-black text-white rounded hover:bg-black/90' onClick={handleTranscribe} disabled={isTranscribing}>
                  {isTranscribing ? 'Transcribing...' : 'Transcribe'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {transcription && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Transcription:</h3>
              <p>{transcription}</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

