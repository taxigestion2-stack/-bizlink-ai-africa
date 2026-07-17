'use client'

import { useEffect, useState, useRef } from 'react'
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/actions/notifications'

type Notification = {
  id: string
  title: string
  message: string
  is_read: boolean
  type: string
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (res.ok) setNotifications(data.notifications ?? [])
    } catch {
      // silencieux : la cloche n'est pas critique pour l'usage du produit
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    await markNotificationReadAction(id)
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await markAllNotificationsReadAction()
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 hover:bg-muted"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b p-3">
            <p className="text-sm font-medium">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-muted-foreground underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">Aucune notification.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`block w-full border-b p-3 text-left last:border-b-0 hover:bg-muted ${
                    n.is_read ? 'opacity-60' : ''
                  }`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString('fr-FR')}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
