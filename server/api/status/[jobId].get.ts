import { defineEventHandler } from 'h3'
import { pdfQueue } from '../../utils/queue'

export default defineEventHandler(async (event) => {
  const jobId =getRouterParam(event,'jobId')
  
    if(!jobId) throw createError( 'jobId is required',400)

  // Set headers for SSE
  event.node.res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const job = await pdfQueue.getJob(jobId)
  if (!job) {
    event.node.res.write(`data: ${JSON.stringify({ status: 'not_found' })}\n\n`)
    event.node.res.end()
    return
  }

  // Send initial status
  const initialState = await job.getState()
  event.node.res.write(`data: ${JSON.stringify({ 
    status: initialState,
    progress: await job.progress()
  })}\n\n`)

  // Subscribe to job events
  const cleanup = await pdfQueue.on('global:completed', async (jobId, result) => {
    if (jobId === job.id) {
      event.node.res.write(`data: ${JSON.stringify({
        status: 'completed',
        result: JSON.parse(result)
      })}\n\n`)
      event.node.res.end()
    }
  })

  pdfQueue.on('global:failed', async (jobId, error) => {
    if (jobId === job.id) {
      event.node.res.write(`data: ${JSON.stringify({
        status: 'failed',
        error: error.message
      })}\n\n`)
      event.node.res.end()
    }
  })

  pdfQueue.on('global:progress', async (jobId, progress) => {
    if (jobId === job.id) {
      event.node.res.write(`data: ${JSON.stringify({
        status: 'processing',
        progress
      })}\n\n`)
    }
  })

  // Clean up on client disconnect
  event.node.req.on('close', () => {
    cleanup()
  })
})