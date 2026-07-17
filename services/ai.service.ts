import type { SupabaseClient } from '@supabase/supabase-js'

export interface BusinessContext {
  todayRevenue: number
  todayProfit: number
  todaySalesCount: number
  monthlyExpenses: number
  monthlyProfit: number
  openDebtsTotal: number
  topProducts: { name: string; quantitySold: number }[]
  lowStockProducts: { name: string; stock: number; unit: string }[]
}

/**
 * Construit le contexte métier utilisé par le chatbot. Toutes les requêtes
 * passent par le client Supabase de l'utilisateur connecté (RLS active) :
 * impossible d'exposer les données d'une autre organisation, même par erreur
 * de prompt engineering.
 */
export async function buildBusinessContext(
  supabase: SupabaseClient,
  organizationId: string
): Promise<BusinessContext> {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${new Date().toISOString().slice(0, 7)}-01`

  const [todaySalesRes, monthSalesRes, monthExpensesRes, debtsRes, productsRes, saleItemsRes] =
    await Promise.all([
      supabase
        .from('sales')
        .select('total_amount, profit')
        .eq('organization_id', organizationId)
        .eq('sale_date', today),
      supabase
        .from('sales')
        .select('profit')
        .eq('organization_id', organizationId)
        .gte('sale_date', monthStart),
      supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', organizationId)
        .gte('expense_date', monthStart),
      supabase
        .from('debts')
        .select('remaining_amount')
        .eq('organization_id', organizationId)
        .in('status', ['open', 'partial']),
      supabase
        .from('products')
        .select('name, stock_quantity, min_stock_alert, unit')
        .eq('organization_id', organizationId)
        .order('stock_quantity', { ascending: true })
        .limit(50),
      supabase
        .from('sale_items')
        .select('quantity, product:products(name), sale:sales!inner(organization_id, sale_date)')
        .eq('sale.organization_id', organizationId)
        .gte('sale.sale_date', monthStart),
    ])

  const todaySales = todaySalesRes.data ?? []
  const monthlyProfit = (monthSalesRes.data ?? []).reduce((sum, s: any) => sum + Number(s.profit), 0)
  const monthlyExpenses = (monthExpensesRes.data ?? []).reduce((sum, e: any) => sum + Number(e.amount), 0)
  const openDebtsTotal = (debtsRes.data ?? []).reduce((sum, d: any) => sum + Number(d.remaining_amount), 0)

  const lowStockProducts = (productsRes.data ?? [])
    .filter((p: any) => Number(p.stock_quantity) <= Number(p.min_stock_alert))
    .slice(0, 10)
    .map((p: any) => ({ name: p.name, stock: Number(p.stock_quantity), unit: p.unit }))

  const salesByProduct = new Map<string, number>()
  for (const row of (saleItemsRes.data ?? []) as any[]) {
    const name = row.product?.name ?? 'Produit inconnu'
    salesByProduct.set(name, (salesByProduct.get(name) ?? 0) + Number(row.quantity))
  }
  const topProducts = Array.from(salesByProduct.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, quantitySold]) => ({ name, quantitySold }))

  return {
    todayRevenue: todaySales.reduce((sum, s: any) => sum + Number(s.total_amount), 0),
    todayProfit: todaySales.reduce((sum, s: any) => sum + Number(s.profit), 0),
    todaySalesCount: todaySales.length,
    monthlyExpenses,
    monthlyProfit,
    openDebtsTotal,
    topProducts,
    lowStockProducts,
  }
}

export function buildSystemPrompt(context: BusinessContext, organizationName: string): string {
  return `Tu es l'assistant IA de "${organizationName}" sur BizLink AI Africa, un outil de gestion pour petits commerces africains.

Règles strictes :
- Réponds toujours en français, de façon simple et directe (le commerçant n'est pas forcément technique).
- Utilise UNIQUEMENT les données ci-dessous. Ne jamais inventer de chiffres.
- Si une information n'est pas disponible dans les données, dis-le clairement au lieu de deviner.
- Sois concret : donne des conseils actionnables (ex: "réapprovisionnez X" plutôt que des généralités).

Données du commerce (à jour du jour) :
- Chiffre d'affaires aujourd'hui : ${context.todayRevenue.toFixed(2)} (${context.todaySalesCount} vente(s))
- Bénéfice aujourd'hui : ${context.todayProfit.toFixed(2)}
- Bénéfice du mois en cours : ${context.monthlyProfit.toFixed(2)}
- Dépenses du mois en cours : ${context.monthlyExpenses.toFixed(2)}
- Total des dettes clients en cours : ${context.openDebtsTotal.toFixed(2)}
- Produits qui se vendent le mieux ce mois-ci : ${
    context.topProducts.length
      ? context.topProducts.map((p) => `${p.name} (${p.quantitySold} vendu(s))`).join(', ')
      : 'aucune vente ce mois-ci'
  }
- Produits en rupture ou stock faible : ${
    context.lowStockProducts.length
      ? context.lowStockProducts.map((p) => `${p.name} (${p.stock} ${p.unit})`).join(', ')
      : 'aucun'
  }`
}

/**
 * Appel à l'API de génération de texte. Utilise Groq Cloud par défaut
 * (gratuit, sans carte bancaire, compatible avec le format OpenAI) — voir
 * https://console.groq.com. Pour repasser sur OpenAI plus tard, il suffit de
 * changer AI_API_BASE_URL et AI_API_KEY dans .env.local, aucun code à toucher.
 */
export async function generateChatResponse(
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const apiKey = process.env.AI_API_KEY ?? process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Aucune clé API IA configurée (AI_API_KEY ou GROQ_API_KEY) côté serveur.')
  }

  const baseUrl = process.env.AI_API_BASE_URL ?? 'https://api.groq.com/openai/v1'
  const model = process.env.AI_MODEL ?? 'llama-3.3-70b-versatile'

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Erreur API IA (${response.status}) : ${errorBody}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? "Désolé, je n'ai pas pu générer de réponse."
}
