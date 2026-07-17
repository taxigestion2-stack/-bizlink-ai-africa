import { z } from 'zod'

export const debtPaymentSchema = z.object({
  amount: z.coerce.number().positive('Le montant doit être positif'),
  paymentDate: z.string().min(1, 'La date est requise'),
  notes: z.string().optional(),
})

export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>
