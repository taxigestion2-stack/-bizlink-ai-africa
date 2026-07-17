import { z } from 'zod'

export const expenseSchema = z.object({
  category: z.string().min(2, 'La catégorie est requise'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  expenseDate: z.string().min(1, 'La date est requise'),
  receiptUrl: z.string().url().optional().or(z.literal('')),
})

export type ExpenseInput = z.infer<typeof expenseSchema>

export const EXPENSE_CATEGORIES = [
  'Loyer',
  'Électricité / Eau',
  'Transport',
  'Salaires',
  'Communication',
  'Fournitures',
  'Entretien',
  'Autre',
] as const
