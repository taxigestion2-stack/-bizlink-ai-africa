function escapeCsvValue(value: unknown): string {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function arrayToCsv(headers: string[], rows: (string | number)[][]): string {
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
