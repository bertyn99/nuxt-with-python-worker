import { defineEventHandler, createError, getRouterParam } from 'h3'
import { pdfQueue,pdfQueueEvents } from '../../utils/queue'
import { Job  } from 'bullmq'

export default defineEventHandler(async (event) => {
  // Set SSE headers
  event.node.res.setHeader('Cache-Control', 'no-cache')
  event.node.res.setHeader('Connection', 'keep-alive') 
  event.node.res.setHeader('Content-Type', 'text/event-stream')
  event.node.res.statusCode = 200

  const jobId = getRouterParam(event, 'jobId')
  if (!jobId) {
    throw createError({ 
      statusCode: 400,
      message: 'jobId is required'
    })
  }

 

  const job = await pdfQueue.getJob(jobId) as Job
  if (!job) {
    sendSSEMessage(event, { status: 'not_found' })
    return event.node.res.end()
  }

  // Send initial state
  const initialState = await job.getState()
  sendSSEMessage(event, {
    status: initialState,
    progress: job.progress 
  })

  // Helper to send SSE messages
  function sendSSEMessage(event: any, data: any) {
    try {
      event.node.res.write(`data: ${JSON.stringify(data)}\n\n`)
      // Flush the response to ensure the client receives it immediately
      if (event.node.res.flush) {
        event.node.res.flush()
      }
    } catch (error) {
      console.error('Error sending SSE message:', error)
    }
  }

  // Set up BullMQ event listeners using pdfpdfQueueEvents
  const onProgress = ({ jobId: eventJobId, data: progress }: { jobId: string; data: number | object }) => {
    console.log('Progress event received:', eventJobId, progress)
    if (eventJobId === jobId) {
      sendSSEMessage(event, {
        status: 'processing',
        progress
      })
    }
  }

  const onCompleted = ({ jobId: eventJobId, returnvalue }: { jobId: string; returnvalue: any }) => {
    console.log('Completed event received:', eventJobId)
    if (eventJobId === jobId) {
      sendSSEMessage(event, {
        status: 'completed',
        result: typeof returnvalue === 'string' ? JSON.parse(returnvalue) : returnvalue
      })
      cleanup()
    }
  }

  const onFailed = ({ jobId: eventJobId, failedReason }: { jobId: string; failedReason: string }) => {
    console.log('Failed event received:', eventJobId)
    if (eventJobId === jobId) {
      sendSSEMessage(event, {
        status: 'failed',
        error: failedReason
      })
      cleanup()
    }
  }

  // Attach event listeners using pdfpdfQueueEvents
  await pdfQueueEvents.waitUntilReady();
  pdfQueueEvents.on('progress', onProgress)
  pdfQueueEvents.on('completed', onCompleted)
  pdfQueueEvents.on('failed', onFailed)

  // Cleanup function
  const cleanup = () => {
    console.log('Cleaning up event listeners')
    pdfQueueEvents.off('progress', onProgress)
    pdfQueueEvents.off('completed', onCompleted)
    pdfQueueEvents.off('failed', onFailed)
    pdfQueueEvents.close()
    event.node.res.end()
  }

  // Clean up on client disconnect
  event.node.req.on('close', cleanup)
})