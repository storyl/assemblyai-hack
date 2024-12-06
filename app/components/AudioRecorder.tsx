'use client'

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      // Create WebSocket connection
      const ws = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000');

      ws.onopen = () => {
        ws.send(JSON.stringify({
          audio_data: '',
          sample_rate: 16000,
          raw: true
        }));
      };

      ws.onmessage = (message) => {
        const result = JSON.parse(message.data);
        if (result.message_type === 'FinalTranscript') {
          setTranscript(prev => prev + ' ' + result.text);
          setPartialTranscript('');
        } else {
          setPartialTranscript(result.text);
        }
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === 1) {
          const reader = new FileReader();
          reader.onload = () => {
            if (ws.readyState === 1) {
              ws.send(JSON.stringify({
                audio_data: typeof reader.result === 'string' ? reader.result.split(',')[1] : ''
              }));
            }
          };
          reader.readAsDataURL(event.data);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Error accessing microphone: ' + errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex justify-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-4 rounded-full ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="p-4 bg-gray-100 rounded min-h-32">
          <p className="font-medium">Transcript:</p>
          <p>{transcript}</p>
          {isRecording && (
            <p className="text-gray-500 italic">
              {partialTranscript || <Loader2 className="w-4 h-4 animate-spin" />}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;