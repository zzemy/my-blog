import type { JSONContent } from '@tiptap/react'
import { z } from 'zod'

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const emptyStringToNull = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const numberLikeToNumber = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      return undefined
    }

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : value
  }

  return value
}

const jsonContentSchema = z.custom<JSONContent>(
  (value) => typeof value === 'object' && value !== null,
  { message: 'Content must be a valid TipTap JSON object' }
)

const basePostSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(200, 'Slug is too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase letters, numbers, and hyphens only'),
  description: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(500, 'Description is too long').nullable().optional()
  ),
  content: jsonContentSchema,
  cover_image: z.preprocess(
    emptyStringToNull,
    z.string().trim().url('Cover image must be a valid URL').nullable().optional()
  ),
  author: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1, 'Author is required').max(100, 'Author is too long').default('Admin')
  ),
  tags: z.array(z.string().trim().min(1).max(50)).default([]),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  reading_time: z.preprocess(
    numberLikeToNumber,
    z.number().int().nonnegative('Reading time must be a non-negative integer').nullable().optional()
  ),
  published_at: z.preprocess(
    emptyStringToUndefined,
    z.string().datetime({ offset: true }).nullable().optional()
  ),
})

export const createPostSchema = basePostSchema

export const updatePostSchema = basePostSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
