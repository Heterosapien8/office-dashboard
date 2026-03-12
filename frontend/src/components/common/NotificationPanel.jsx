import { useNotifications } from '../../contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { X, AlertTriangle, Bell, FileWarning, Clock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import clsx from 'clsx'

const TYPE_CONFIG = {
  violation:       { icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50' },
  missingReport:   { icon: FileWarning,   color: 'text-orange-500', bg: 'bg-orange-50' },
  reportReminder:  { icon: Clock,         color: 'text-yellow-500', bg: 'bg-yellow-50' },
  escalationUpdate:{ icon: Bell,          color: 'text-blue-500',   bg: 'bg-blue-50' },
  reportLocked:    { icon: FileWarning,   color: 'text-red-500',    bg: 'bg-red-50' },
  system:          { icon: Bell,          color: 'text-gray-500',   bg: 'bg-gray-50' },
}

export default function NotificationPanel({ onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl
                 border border-gray-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-800">Notifications</p>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-400">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary-600 hover:underline"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No notifications</p>
          </div>
        ) : (
          notifications.map(notif => {
            const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
            const Icon = config.icon
            const ts = notif.createdAt?.toDate?.()

            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={clsx(
                  'flex gap-3 px-4 py-3 cursor-pointer transition-colors',
                  notif.isRead ? 'bg-white hover:bg-gray-50' : `${config.bg} hover:opacity-90`
                )}
              >
                <div className={clsx('flex-shrink-0 mt-0.5', config.color)}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-snug">
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                    {notif.body}
                  </p>
                  {ts && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDistanceToNow(ts, { addSuffix: true })}
                    </p>
                  )}
                </div>
                {!notif.isRead && (
                  <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
