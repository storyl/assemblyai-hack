// Start by making sure the `assemblyai` and `node-record-lpcm16` package is
// installed. If not, you can install it by running the following command:
// npm install assemblyai
// npm install node-record-lpcm16
// npm install --save-dev @types/node-record-lpcm16 (if using TypeScript)
//
// You should also have `sox` installed on your system. If not, run:
// brew install sox (macOS)
// sudo apt-get install sox libsox-fmt-all (Linux)

// @ts-nocheck

import { AssemblyAI, RealtimeTranscript } from 'assemblyai'
import recorder from 'node-record-lpcm16'

if (!process.env.ASSEMBLY_API_KEY) {
    throw new Error('ASSEMBLY_API_KEY environment variable is required')
  }
  
  const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLY_API_KEY
  })

const transcriber = client.realtime.transcriber({
  sampleRate: 16_000,
})

const run = async () => {
  transcriber.on('open', ({ sessionId }) => {
    console.log(`Session opened with ID: ${sessionId}`)
  })

  transcriber.on('error', (error: Error) => {
    console.error('Error:', error)
  })

  transcriber.on('close', (code: number, reason: string) =>
    console.log('Session closed:', code, reason)
  )

  transcriber.on('transcript', (transcript: RealtimeTranscript) => {
    console.log('Received:', transcript)

    if (!transcript.text) return

    if (transcript.message_type == 'FinalTranscript') {
      console.log('Final:', transcript.text)
    } else {
      console.log('Partial:', transcript.text)
    }
  })

  console.log('Connecting to real-time transcript service')
  await transcriber.connect()

  console.log('Starting recording')
  console.log('If you want to stop recording, press Ctrl/CMD+C')

  const recording = recorder.record({
    channels: 1,
    sampleRate: 16_000,
    audioType: 'wav', // Linear PCM
  })

  recording.stream().on('data', (buffer: Buffer) => {
    transcriber.sendAudio(buffer)
  })

  process.on('SIGINT', async function () {
    console.log()
    console.log('Stopping recording')
    recording.stop()

    console.log('Closing real-time transcript connection')
    await transcriber.close()

    process.exit()
  })
}

run()
    