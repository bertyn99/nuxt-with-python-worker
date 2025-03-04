import { Queue, QueueEvents } from 'bullmq'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

export const pdfQueue = new Queue('pdf-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
})

export const pdfQueueEvents= new QueueEvents('pdf-processing',{connection:pdfQueue.opts.connection})