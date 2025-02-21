// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: "2024-11-01",
  css: ['~/assets/css/main.css'],
  nitro: {
    experimental: {
      websocket: true,
    },
    storage:{
      local:{
          driver: 'fs',
          base: './.data/file'
      }
    }
  },
  modules: ["@nuxt/ui", "@vueuse/nuxt",'@nuxt/content'],
  devtools: { enabled: true },
});