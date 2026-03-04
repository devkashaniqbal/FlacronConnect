/**
 * OpenAI Realtime API <-> Twilio Media Streams WebSocket Bridge
 * Deployed as a Render Web Service (supports long-lived WebSocket connections)
 *
 * HOW IT WORKS:
 *   Twilio Media Stream (μ-law 8kHz audio) -> bridge -> OpenAI Realtime API (PCM 24kHz)
 *   OpenAI Realtime API (PCM 24kHz audio)  -> bridge -> Twilio Media Stream
 */

import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ''
const PORT           = parseInt(process.env.PORT ?? '8080', 10)

if (!OPENAI_API_KEY) {
  console.error('[Bridge] OPENAI_API_KEY env var is required')
  process.exit(1)
}

const server = http.createServer((_req, res) => {
  res.writeHead(200).end('FlacronControl Voice Bridge — healthy')
})

const wss = new WebSocketServer({ server, path: '/media-stream' })

wss.on('connection', (twilioWs, req) => {
  const url        = new URL(req.url ?? '', `http://${req.headers.host}`)
  const agentId    = url.searchParams.get('agentId')    ?? ''
  const businessId = url.searchParams.get('businessId') ?? ''

  console.log(`[Bridge] New Twilio connection — agent: ${agentId}, business: ${businessId}`)

  // Open WebSocket to OpenAI Realtime API
  const openaiWs = new WebSocket(
    'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    }
  )

  openaiWs.on('open', () => {
    openaiWs.send(JSON.stringify({
      type: 'session.update',
      session: {
        turn_detection:       { type: 'server_vad' },
        input_audio_format:   'g711_ulaw',
        output_audio_format:  'g711_ulaw',
        voice:                'alloy',
        instructions:         'You are a helpful voice assistant. Be concise and natural.',
        modalities:           ['text', 'audio'],
        temperature:          0.8,
      },
    }))
  })

  // Relay Twilio audio -> OpenAI
  twilioWs.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString())
      if (msg.event === 'media' && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(JSON.stringify({
          type:  'input_audio_buffer.append',
          audio: msg.media.payload,
        }))
      } else if (msg.event === 'start') {
        console.log(`[Bridge] Call started — streamSid: ${msg.start?.streamSid}`)
      } else if (msg.event === 'stop') {
        openaiWs.close()
      }
    } catch (err) {
      console.error('[Bridge] Error parsing Twilio message:', err)
    }
  })

  // Relay OpenAI audio -> Twilio
  let streamSid = ''
  openaiWs.on('message', (data: Buffer) => {
    try {
      const event = JSON.parse(data.toString())

      if (event.type === 'response.audio.delta' && event.delta) {
        if (twilioWs.readyState === WebSocket.OPEN) {
          twilioWs.send(JSON.stringify({
            event:    'media',
            streamSid,
            media:    { payload: event.delta },
          }))
        }
      }

      if (event.type === 'response.audio.done') {
        if (twilioWs.readyState === WebSocket.OPEN) {
          twilioWs.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'responseDone' } }))
        }
      }
    } catch (err) {
      console.error('[Bridge] Error parsing OpenAI message:', err)
    }
  })

  twilioWs.on('close', () => {
    console.log('[Bridge] Twilio disconnected')
    openaiWs.close()
  })

  openaiWs.on('close', () => {
    console.log('[Bridge] OpenAI disconnected')
    twilioWs.close()
  })

  openaiWs.on('error', err => console.error('[Bridge] OpenAI WS error:', err))
  twilioWs.on('error', err => console.error('[Bridge] Twilio WS error:', err))
})

server.listen(PORT, () => {
  console.log(`[Bridge] Listening on port ${PORT}`)
})
