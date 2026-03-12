import { createContext, useContext, useEffect, useState } from 'react'
import {
  collection, query, where, orderBy, limit,
  onSnapshot, doc, updateDoc,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { COLLECTIONS, ROLES } from '../config/constants'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { currentUser, role, roId } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)

  useEffect(() => {
    if (!currentUser) return

    // Build query based on role
    // Super Admin sees all; others see their RO or direct-to-them
    const notifRef = collection(db, COLLECTIONS.NOTIFICATIONS)

    let q
    if (role === ROLES.SUPER_ADMIN) {
      q = query(notifRef, orderBy('createdAt', 'desc'), limit(50))
    } else {
      q = query(
        notifRef,
        where('recipientRoId', '==', roId),
        orderBy('createdAt', 'desc'),
        limit(30),
      )
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setNotifications(docs)
      setUnreadCount(docs.filter(n => !n.isRead).length)
    })

    return unsubscribe
  }, [currentUser, role, roId])

  async function markAsRead(notificationId) {
    const ref = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId)
    await updateDoc(ref, { isRead: true })
  }

  async function markAllAsRead() {
    const unread = notifications.filter(n => !n.isRead)
    await Promise.all(unread.map(n => markAsRead(n.id)))
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider')
  return context
}
