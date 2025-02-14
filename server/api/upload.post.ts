import { defineEventHandler, readBody } from 'h3'
import { pdfQueue } from '../utils/queue'

export default defineEventHandler(async (event) => {
  const formData = await readBody(event)
  const file = formData.get('file')
  
  // Add job to BullMQ queue
  const job = await pdfQueue.add('process-pdf', {
    file: file, // You might want to save the file somewhere first
  })
  
  return {
    jobId: job.id
  }
})