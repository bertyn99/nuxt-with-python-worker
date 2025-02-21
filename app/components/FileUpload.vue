<template>
  <div class="max-w-xl mx-auto p-6">
    <div class="mb-6">
      <label class="block text-gray-700 text-sm font-bold mb-2">
        Upload PDF
      </label>
      <input type="file" accept=".pdf" @change="handleFileUpload" class="hidden" ref="fileInput" />
      <button @click="$refs.fileInput.click()"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Select PDF
      </button>
      <span v-if="selectedFile" class="ml-3 text-gray-600">
        {{ selectedFile.name }}
      </span>
    </div>

    <button @click="uploadFile" :disabled="!selectedFile || isUploading"
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
      {{ isUploading ? 'Uploading...' : 'Upload' }}
    </button>

    <div v-if="jobId" class="mt-6">
      <div class="text-gray-700">Job ID: {{ jobId }}</div>
      <div class="text-gray-700">Status: {{ statusProcess }}</div>
      <div v-if="progress" class="mt-2">
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${progress}%` }"></div>
        </div>
        <div class="text-sm text-gray-600 mt-1">{{ progress }}%</div>
      </div>
    </div>

    <div v-if="result" class="mt-6">
      <h3 class="text-lg font-bold mb-2">Results:</h3>

      <MDC :value="contentResult" tag="article" />

    </div>
  </div>
</template>

<script setup>
const fileInput = ref(null)
const selectedFile = ref(null)
const isUploading = ref(false)
const jobId = ref(null)
const statusProcess = ref('')
const progress = ref(0)
const result = ref(null)
const toast = useToast()

const contentResult = computed(() => result.value?.result?.details ?? 'none')

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0]
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const dataRes = await response.json()
    jobId.value = dataRes.jobId
    statusProcess.value = 'Processing'

    // Set up SSE connection
    const { status, data, error, close } = useEventSource(`api/status/${jobId.value}`)
    console.log(data.value)
    console.log(status.value)
    watch(() => data.value, (newVal) => {

      result.value = JSON.parse(newVal)
      if (result.value?.status == "completed") {
        toast.add({
          title: 'Success',
          description: result.value.result.message,
          color: 'success'
        })
      }
    })

    watch(status, (newVal) => {
      statusProcess.value = newVal
      console.log(newVal)
    })


  } catch (error) {
    console.error('Upload error:', error)
    statusProcess.value = 'Error'
  } finally {
    isUploading.value = false
  }
}
</script>