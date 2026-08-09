import { z } from 'zod'

export const submitPaymentProofSchema = z.object({
  plan: z.enum(['starter', 'pro']),
  paymentMethod: z.enum(['mobile_money', 'bank_transfer']),
  proofTransactionId: z.string().min(2, "L'identifiant de transaction est requis"),
  screenshotPath: z.string().min(1, 'La capture de preuve est requise'),
  currency: z.string().default('USD'),
})

export type SubmitPaymentProofInput = z.infer<typeof submitPaymentProofSchema>

export const reviewPaymentProofSchema = z.object({
  transactionId: z.string().uuid(),
  approve: z.boolean(),
  reviewNotes: z.string().optional(),
})

export type ReviewPaymentProofInput = z.infer<typeof reviewPaymentProofSchema>
