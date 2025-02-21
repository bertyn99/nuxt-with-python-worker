import { defineEventHandler, readBody } from 'h3'
import { pdfQueue } from '../utils/queue'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readFormData(event)
    const file = formData.get('file') as File
    
    //store the file locally  or in S3 compatible api with adequate driver
    const storage = useStorage('local')
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    const formatedName=formatFileName(file.name)

    await storage.setItemRaw(formatedName,buffer)

    // Add job to BullMQ queue
    const job = await pdfQueue.add('process-pdf', {
      file: {
        name:formatedName,
        path:`./.data/file/${formatedName}`,
        option:{} 

      },
    })
    
    return {
      jobId: job.id
    } 
  } catch (error:any) {
    console.error(error)
    throw createError({statusMessage:error.msg,statusCode:500})
  }
  
})