import { z } from 'zod'

export const savingsTransactionSchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  notes: z.string().optional(),
})

export type SavingsTransactionInput = z.infer<typeof savingsTransactionSchema>
