import type { Metadata } from 'next'
import { ProductForm } from '@/components/products/product-form'

export const metadata: Metadata = { title: 'Nouveau produit — BizLink AI Africa' }

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nouveau produit</h1>
      <ProductForm />
    </div>
  )
}
