from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException 
from load_dotenv import load_dotenv

import assemblyai as aai
import asyncio
import os

load_dotenv()

app = FastAPI()

aai.settings.api_key = os.environ.get("ASSEMBLY_AI_API_KEY")

@app.get("/")
async def root():
    """
    Basic route for API health check.
    """
    return {"message": "AssemblyAI Real-Time Transcription API is running"}

@app.websocket("/realtime-transcribe")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio transcription.
    """
    await websocket.accept()

    # Define callback functions
    def on_open(session_opened: aai.RealtimeSessionOpened):
        print("Session ID:", session_opened.session_id)

    async def on_data(transcript: aai.RealtimeTranscript):
        """
        Callback function for receiving transcription results.
        Sends the transcript back to the WebSocket client.
        """
        if not transcript.text:
            return

        message = (
            transcript.text if isinstance(transcript, aai.RealtimeFinalTranscript)
            else transcript.text + " (in progress)"
        )
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"Error sending message to WebSocket client: {e}")

    def on_error(error: aai.RealtimeError):
        """
        Callback function for handling transcription errors.
        """
        print("An error occurred:", error)

    def on_close():
        """
        Callback function for closing the transcription session.
        """
        print("Closing transcription session")

    try:
        # Initialize the real-time transcriber
        transcriber = aai.RealtimeTranscriber(
            on_data=on_data,
            on_error=on_error,
            sample_rate=44_100,
            on_open=on_open,
            on_close=on_close,
        )

        # Start the connection to AssemblyAI
        transcriber.connect()

        print("WebSocket connected. Awaiting audio data...")

        # Listen for incoming audio chunks from the WebSocket
        async for audio_chunk in websocket.iter_bytes():
            # Stream the audio chunk to AssemblyAI for real-time transcription
            transcriber.stream_bytes(audio_chunk)

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Ensure the transcription session is closed
        transcriber.close()
        print("Transcription session ended")
