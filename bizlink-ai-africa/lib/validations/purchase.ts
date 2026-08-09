import { z } from 'zod'

export const purchaseItemSchema = z.object({
  productId: z.string().uuid('Produit requis'),
  quantity: z.coerce.number().positive('La quantité doit être positive'),
  unitCost: z.coerce.number().min(0, "Le coût unitaire doit être positif"),
})

export const purchaseSchema = z.object({
  supplierId: z.string().uuid().nullable().optional(),
  purchaseDate: z.string().min(1, 'La date est requise'),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'Ajoutez au moins un produit'),
})

export type PurchaseInput = z.infer<typeof purchaseSchema>
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>
