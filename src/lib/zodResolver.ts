// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'

/**
 * Minimal zodResolver para React Hook Form compatible con Zod v4.
 * Usa `any` para evitar la incompatibilidad entre z.output<T> y FieldValues.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver<T extends z.ZodType<any>>(schema: T): Resolver<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (values: any) => {
    const result = schema.safeParse(values)
    if (result.success) return { values: result.data, errors: {} }

    const errors: Record<string, { type: string; message: string }> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (path && !errors[path]) {
        errors[path] = { type: 'validation', message: issue.message }
      }
    }
    return { values: {}, errors }
  }
}
