/**
 * Génère un fichier CSV côté navigateur (compatible Excel/Google Sheets),
 * sans dépendance externe — évite d'alourdir le projet pour un simple export.
 */

function escapeCsvValue(value: unknown): string {
  const str = String(value ?? '')
  // Un champ contenant une virgule, un guillemet ou un retour à la ligne
  // doit être entouré de guillemets, avec les guillemets internes doublés.
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function arrayToCsv(headers: string[], rows: (string | number)[][]): string {
  // \uFEFF (BOM) en tête : garantit que Excel affiche correctement les
  // accents français (é, è, à...) à l'ouverture du fichier.
  const bom = '\uFEFF'
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(','))
  return bom + lines.join('\n')
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
