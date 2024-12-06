'use client'

import { useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribeAudio } from '../utils/transcribe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LipSyncCharacter } from '@/components/LipSyncCharacter';
import { Volume2 } from 'lucide-react';

export default function VoiceRecorderTranscriber() {
  const { isRecording, audioBlob, startRecording, stopRecording } = useAudioRecorder();
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleTranscribe = async () => {
    if (audioBlob) {
      setIsTranscribing(true);
      try {
        const text = await transcribeAudio(audioBlob);
        console.log('Transcription received:', text); // Debug log
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

  const speakText = () => {
    if (!isSpeaking && transcription) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(transcription);
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-md mx-auto outline-none border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-center text-4xl font-bold">Voice to Lip Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <LipSyncCharacter text={transcription} />
          <div className="flex space-x-4 flex-row items-center mt-4">
            <Button 
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className="bg-black text-white rounded hover:bg-black/90"
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            {audioBlob && (
              <>
                <Button className="bg-black text-white rounded hover:bg-black/90" onClick={handleDownload}>
                  Download Recording
                </Button>
                <Button 
                  className="bg-black text-white rounded hover:bg-black/90" 
                  onClick={handleTranscribe} 
                  disabled={isTranscribing}
                >
                  {isTranscribing ? 'Transcribing...' : 'Transcribe'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
        {transcription && (
          <CardFooter className="flex flex-col items-start w-full">
            <div className="mt-4 w-full">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transcription:</h3>
                <Button
                  onClick={speakText}
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                >
                  <Volume2 
                    className={`h-10 w-10 ${isSpeaking ? 'text-blue-500' : 'text-black'}`}
                  />
                </Button>
              </div>
              <div className="mt-2 p-4  rounded-lg">
                {transcription}
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}