import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const serverEnv = createEnv({
  emptyStringAsUndefined: true,

  runtimeEnv: process.env,
  server: {
    DATABASE_URL: z.string().url(),
    SESSION_SECRET: z.string(),
  },
})
