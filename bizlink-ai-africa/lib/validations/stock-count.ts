import { z } from 'zod'

export const stockCountItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  systemQuantity: z.number(),
  unit: z.string(),
  countedQuantity: z.coerce.number().min(0, 'La quantité comptée doit être positive ou nulle'),
})

export const stockCountSchema = z.object({
  notes: z.string().optional(),
  items: z.array(stockCountItemSchema).min(1, 'Aucun produit à compter'),
})

export type StockCountInput = z.infer<typeof stockCountSchema>
export type StockCountItemInput = z.infer<typeof stockCountItemSchema>
