import { defineEventHandler, createError, getRouterParam, createEventStream } from 'h3'
import { pdfQueue } from '../../utils/queue'
import { Job } from 'bullmq'

export default defineEventHandler(async (event) => {
  // Enable SSE endpoint
  setHeader(event, 'cache-control', 'no-cache')
  setHeader(event, 'connection', 'keep-alive')
  setHeader(event, 'content-type', 'text/event-stream')
  setResponseStatus(event, 200)

  const jobId = getRouterParam(event, 'jobId')


  if (!jobId) throw createError({ status: 400, statusText: 'jobId is required' })

  

  const job = await pdfQueue.getJob(jobId) as Job
  if (!job) {
     event.node.res.write(`data: ${JSON.stringify({ status: 'not_found' })}\n\n`)
    return event.node.res.end()
  }

  // Send initial status
  const initialState = await job.getState()
  console.log('init')
  try {
    event.node.res.write(`data: ${JSON.stringify({ 
      status: initialState,
      progress: job.progress
    })}\n\n`)
  } catch (error) {
    console.error('Error sending initial state:', error)
  }
// Event listeners
  const completedMessage =  (jobId: string, result: any) => {
    if (jobId === job.id) {
      console.log('completed')
      try {
         event.node.res.write(`data: ${JSON.stringify({
          status: 'completed',
          result: JSON.parse(result)
        })}\n\n`)
      } catch (error) {
        console.error('Error sending completed event:', error)
      }
    }
  }

  const failedMessage =  (jobId: string, error: any) => {
    if (jobId === job.id) {
      console.log('failed')
      try {
         event.node.res.write(`data: ${JSON.stringify({
          status: 'failed',
          error: error.message
        })}\n\n`)
      } catch (pushError) {
        console.error('Error sending failed event:', pushError)
      }
    }
  }

  const progressMessage =  (jobId: string, progress: number|object) => {
    console.log('progressed before:', progress)
    if (jobId === job.id) {
      console.log('progressed:', progress)
      try {
         event.node.res.write(`data: ${JSON.stringify({
          status: 'processing',
          progress
        })}\n\n`)
      } catch (error) {
        console.error('Error sending progress event:', error)
      }
    }
  }

  
  const handleJobUpdate=async()=>{
    const currState= await job.getState()
    const tmpJob = await pdfQueue.getJob(jobId) as Job
    switch (currState) {
      case "active":
        //get the progress value 
        tmpJob.progress==100? completedMessage(jobId,tmpJob.returnvalue):progressMessage(jobId,tmpJob.progress)
        break;

      case "failed":
        failedMessage(jobId,tmpJob.failedReason)
        break;
    
      default:
        break;
    }
  }

    const interval = setInterval(async () => {
      await handleJobUpdate()
    }, 2000);

  event._handled = true;

   // Clean up on client disconnect
   event.node.req.on('close', () => {
    clearInterval(interval);
  })
})