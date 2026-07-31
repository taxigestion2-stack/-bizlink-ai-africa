import { z } from 'zod'

export const inviteStaffSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  fullName: z.string().min(2, 'Le nom complet est requis'),
  role: z.enum(['admin', 'staff']),
})

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>
