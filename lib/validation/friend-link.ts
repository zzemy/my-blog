import { z } from 'zod'

const httpUrl = z.string().trim().url('请输入有效的 URL').max(2048, 'URL 不能超过 2048 个字符').refine(
  (value) => {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol)
    } catch {
      return false
    }
  },
  '只支持 HTTP 或 HTTPS 链接',
)

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''))

export const friendLinkSubmissionSchema = z.object({
  name: z.string().trim().min(1, '请填写昵称').max(60, '昵称不能超过 60 个字符'),
  url: httpUrl,
  avatar_url: httpUrl.optional().or(z.literal('')),
  description: z.string().trim().min(1, '请填写网站介绍').max(180, '介绍不能超过 180 个字符'),
  note: optionalText(180),
  contact: optionalText(120),
  csrfToken: z.string().trim().min(1, '请求已过期，请刷新页面后重试'),
  website: z.string().max(0).optional(),
})

export const friendLinkAdminSchema = friendLinkSubmissionSchema.omit({ csrfToken: true, website: true }).extend({
  status: z.enum(['pending', 'approved', 'rejected']).default('approved'),
  sort_order: z.coerce.number().int().min(-9999).max(9999).default(0),
})

export type FriendLinkSubmission = z.infer<typeof friendLinkSubmissionSchema>
export type FriendLinkAdminInput = z.infer<typeof friendLinkAdminSchema>
