import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'multi-layer-ai-lbbdulvj',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_74uaRTQ3Cwet6LM2CXC_Iz1FQuAjrcCO',
  authRequired: false,
})
