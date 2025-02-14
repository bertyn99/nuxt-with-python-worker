// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: "2024-11-01",
  css: ['~/assets/css/main.css'],
  modules: ["@nuxt/ui"],
  devtools: { enabled: true },
});
