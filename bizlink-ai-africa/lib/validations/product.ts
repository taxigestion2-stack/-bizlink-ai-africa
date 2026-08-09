import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(2, 'Le nom du produit est requis'),
  categoryId: z.string().uuid().nullable().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().min(1, "L'unité est requise").default('unité'),
  purchasePrice: z.coerce.number().min(0, 'Le prix d\'achat doit être positif'),
  salePrice: z.coerce.number().min(0, 'Le prix de vente doit être positif'),
  stockQuantity: z.coerce.number().min(0, 'Le stock ne peut pas être négatif').default(0),
  minStockAlert: z.coerce.number().min(0).default(5),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>

export const categorySchema = z.object({
  name: z.string().min(2, 'Le nom de la catégorie est requis'),
  description: z.string().optional(),
})

export type CategoryInput = z.infer<typeof categorySchema>
