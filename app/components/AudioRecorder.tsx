'use client';

import { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

export default function AudioRecorder() {
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({
      audio: true,
      blobPropertyBag: { type: 'audio/wav' },
    });

  const handleTranscribe = async () => {
    if (!mediaBlobUrl) return;

    try {
      setIsLoading(true);
      
      // Convert the blob URL to a File object
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('audio', blob, 'recording.wav');

      // Upload to AssemblyAI
      const result = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioUrl: mediaBlobUrl,
          prompt: 'Summarize the main points of this conversation',
        }),
      });

      const data = await result.json();
      
      if (data.success) {
        setTranscription(`Full Transcription:\n${data.transcription}\n\nSummary:\n${data.summary}`);
      } else {
        console.error('Transcription failed:', data.error);
        setTranscription('Error transcribing audio');
      }
    } catch (error) {
      console.error('Error:', error);
      setTranscription('Error transcribing audio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-4">
        <button
          onClick={startRecording}
          disabled={status === 'recording'}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={status !== 'recording'}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400"
        >
          Stop Recording
        </button>
        {mediaBlobUrl && (
          <button
            onClick={handleTranscribe}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Transcribing...' : 'Transcribe'}
          </button>
        )}
      </div>

      {mediaBlobUrl && (
        <audio src={mediaBlobUrl} controls className="mt-4" />
      )}

      {transcription && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md max-w-2xl w-full">
          <h3 className="font-bold mb-2">Transcription:</h3>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
} 