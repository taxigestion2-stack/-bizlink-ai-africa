import { z } from 'zod'

export const saleItemSchema = z.object({
  productId: z.string().uuid('Produit requis'),
  quantity: z.coerce.number().positive('La quantité doit être positive'),
  unitPrice: z.coerce.number().min(0, 'Le prix unitaire doit être positif'),
})

export const saleSchema = z
  .object({
    customerId: z.preprocess((v) => (v === '' ? undefined : v), z.string().uuid().optional().nullable()),
    saleDate: z.string().min(1, 'La date est requise'),
    discount: z.coerce.number().min(0).default(0),
    paymentStatus: z.enum(['paid', 'partial', 'unpaid']),
    paymentMethod: z.string().optional(),
    paidAmount: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
    items: z.array(saleItemSchema).min(1, 'Ajoutez au moins un produit'),
  })
  .refine((data) => data.paymentStatus !== 'partial' || !!data.customerId, {
    message: 'Un client est requis pour une vente partiellement payée',
    path: ['customerId'],
  })
  .refine((data) => data.paymentStatus !== 'partial' || data.paidAmount !== undefined, {
    message: 'Le montant payé est requis pour une vente partielle',
    path: ['paidAmount'],
  })

export type SaleInput = z.infer<typeof saleSchema>
export type SaleItemInput = z.infer<typeof saleItemSchema>
