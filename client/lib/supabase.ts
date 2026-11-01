/**
 * Supabase SQL Database Integration
 * Connects user profile & messaging to Supabase SQL database using the authenticated Firebase user ID (firebaseUid).
 */

import { API_URL } from './api'

export interface SupabaseProfile {
  id?: string
  firebase_uid?: string
  firebaseUid?: string
  email?: string
  username?: string
  first_name?: string
  last_name?: string
  full_name?: string
  firstName?: string
  lastName?: string
  fullName?: string
  phone_number?: string
  phoneNumber?: string
  location?: string | {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  bio?: string
  garden_experience?: string
  gardenExperience?: string
  profile_image?: string
  profileImage?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

export interface SellerProfile {
  _id: string
  id?: string
  firebaseUid?: string
  username: string
  firstName: string
  lastName: string
  fullName: string
  email?: string
  phoneNumber?: string
  profileImage?: string
  cropsCount?: number
  crops?: string[]
  location?: any
  gardenExperience?: string
}

export interface SupabaseMessage {
  id: string
  _id?: string
  sender_id: string
  receiver_id: string
  senderId?: string
  receiverId?: string
  sender_name?: string
  receiver_name?: string
  senderName?: string
  receiverName?: string
  sender_avatar?: string
  receiver_avatar?: string
  senderAvatar?: string
  receiverAvatar?: string
  content: string
  is_read?: boolean
  isRead?: boolean
  created_at: string
  createdAt?: string
  sender?: {
    _id: string
    username: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  receiver?: {
    _id: string
    username: string
    firstName: string
    lastName: string
    profileImage?: string
  }
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Returns true if Supabase URL and Anon Key are configured and valid.
 */
export function isSupabaseConfigured(): boolean {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  if (
    SUPABASE_URL.includes('your-project') ||
    SUPABASE_ANON_KEY.includes('your-supabase') ||
    SUPABASE_ANON_KEY.startsWith('your-')
  ) {
    return false
  }
  return true
}

/**
 * Helper to get default Supabase headers.
 */
function getSupabaseHeaders(): Record<string, string> {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Normalizes a raw Supabase profile row into a camelCase profile object.
 */
function normalizeProfile(row: Record<string, any>): Partial<SupabaseProfile> {
  const firstName = row.first_name || (row.full_name ? row.full_name.split(' ')[0] : '')
  const lastName = row.last_name || (row.full_name ? row.full_name.split(' ').slice(1).join(' ') : '')
  const fullName = row.full_name || `${firstName} ${lastName}`.trim()

  let location = row.location
  if (typeof location === 'string' && location.startsWith('{')) {
    try {
      location = JSON.parse(location)
    } catch {
      // keep as string
    }
  }

  return {
    id: row.id,
    firebaseUid: row.firebase_uid || row.id,
    email: row.email,
    username: row.username,
    firstName,
    lastName,
    fullName,
    phoneNumber: row.phone_number || row.phoneNumber,
    location,
    bio: row.bio,
    gardenExperience: row.garden_experience || row.gardenExperience || 'beginner',
    profileImage: row.profile_image || row.profileImage || row.avatar_url,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  }
}

/**
 * Fetches user profile information from Supabase SQL database using the authenticated Firebase UID.
 */
export async function fetchSupabaseProfile(
  firebaseUid: string,
  email?: string
): Promise<Partial<SupabaseProfile> | null> {
  if (!isSupabaseConfigured() || !firebaseUid) {
    return null
  }

  try {
    const filters = [`firebase_uid.eq.${encodeURIComponent(firebaseUid)}`, `id.eq.${encodeURIComponent(firebaseUid)}`]
    if (email) {
      filters.push(`email.eq.${encodeURIComponent(email)}`)
    }

    const endpoint = `${SUPABASE_URL}/rest/v1/profiles?or=(${filters.join(',')})&select=*&limit=1`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getSupabaseHeaders(),
    })

    if (!response.ok) {
      console.warn(`Supabase profile query failed: status ${response.status}`)
      return null
    }

    const data = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      return normalizeProfile(data[0])
    }

    return null
  } catch (error) {
    console.warn('Error fetching profile from Supabase:', error)
    return null
  }
}

/**
 * Upserts user profile information into the Supabase SQL database (profiles table).
 * Links profile using authenticated Firebase user ID (firebase_uid).
 */
export async function upsertSupabaseProfile(
  data: Partial<SupabaseProfile> & { firebaseUid: string }
): Promise<{ success: boolean; data?: Partial<SupabaseProfile>; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' }
  }

  if (!data.firebaseUid) {
    return { success: false, error: 'Firebase UID is required to save to Supabase' }
  }

  try {
    const firstName = data.firstName || (data.fullName ? data.fullName.split(' ')[0] : '')
    const lastName = data.lastName || (data.fullName ? data.fullName.split(' ').slice(1).join(' ') : '')
    const fullName = data.fullName || `${firstName} ${lastName}`.trim()

    let locationStr = ''
    if (typeof data.location === 'object' && data.location !== null) {
      const parts = [
        data.location.address,
        data.location.city,
        data.location.state,
        data.location.zipCode,
      ].filter(Boolean)
      locationStr = parts.join(', ')
    } else if (typeof data.location === 'string') {
      locationStr = data.location
    }

    const payload = {
      id: data.firebaseUid,
      firebase_uid: data.firebaseUid,
      email: data.email || null,
      username: data.username || null,
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: fullName || null,
      phone_number: data.phoneNumber || null,
      location: locationStr || null,
      bio: data.bio || null,
      garden_experience: data.gardenExperience || 'beginner',
      profile_image: data.profileImage || null,
      updated_at: new Date().toISOString(),
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(),
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`Supabase upsert failed (${response.status}):`, errorText)
      return { success: false, error: errorText }
    }

    const result = await response.json()
    const returnedRow = Array.isArray(result) && result.length > 0 ? result[0] : payload
    return { success: true, data: normalizeProfile(returnedRow) }
  } catch (error: any) {
    console.error('Error saving profile to Supabase:', error)
    return { success: false, error: error?.message || 'Failed to update Supabase profile' }
  }
}

// ========================================================================
// SELLER SEARCH & MESSAGING FUNCTIONS (SUPABASE + PLATFORM INTEGRATION)
// ========================================================================

/**
 * Searches actual crop sellers from the Supabase database and platform crops.
 * Matches on name, username, or crops sold.
 */
export async function searchActualCropSellers(
  query: string,
  currentUserId?: string
): Promise<SellerProfile[]> {
  const trimmed = query.trim().toLowerCase()
  const sellerMap = new Map<string, SellerProfile>()

  // 1. If Supabase is configured, search Supabase profiles table
  if (isSupabaseConfigured()) {
    try {
      let endpoint = `${SUPABASE_URL}/rest/v1/profiles?select=*&limit=30`
      if (trimmed) {
        endpoint += `&or=(full_name.ilike.*${encodeURIComponent(trimmed)}*,username.ilike.*${encodeURIComponent(trimmed)}*,first_name.ilike.*${encodeURIComponent(trimmed)}*,last_name.ilike.*${encodeURIComponent(trimmed)}*)`
      }

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: getSupabaseHeaders(),
      })

      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows)) {
          rows.forEach((row) => {
            const sid = row.firebase_uid || row.id || row._id
            if (sid && sid !== currentUserId) {
              const fn = row.first_name || (row.full_name ? row.full_name.split(' ')[0] : '')
              const ln = row.last_name || (row.full_name ? row.full_name.split(' ').slice(1).join(' ') : '')
              const fullName = row.full_name || `${fn} ${ln}`.trim() || row.username || 'Crop Seller'
              sellerMap.set(sid, {
                _id: sid,
                id: sid,
                firebaseUid: sid,
                username: row.username || 'seller',
                firstName: fn,
                lastName: ln,
                fullName,
                email: row.email,
                phoneNumber: row.phone_number,
                profileImage: row.profile_image || row.avatar_url,
                location: row.location,
                gardenExperience: row.garden_experience,
                crops: [],
                cropsCount: 0,
              })
            }
          })
        }
      }
    } catch (sbErr) {
      console.warn('Error querying Supabase for sellers:', sbErr)
    }
  }

  // 2. Cross-reference with platform crops to ensure all actual crop sellers are included
  try {
    const res = await fetch(`${API_URL}/crops`)
    if (res.ok) {
      const data = await res.json()
      const crops = data.crops || []

      crops.forEach((crop: any) => {
        const owner = crop.owner || crop.seller
        const sellerId = crop.sellerId || (owner && (owner._id || owner.id || owner.firebaseUid))
        if (!sellerId || sellerId === currentUserId) return

        const existing = sellerMap.get(sellerId)
        const cropName = crop.name || ''

        if (existing) {
          if (cropName && !existing.crops?.includes(cropName)) {
            existing.crops = [...(existing.crops || []), cropName]
            existing.cropsCount = (existing.cropsCount || 0) + 1
          }
        } else {
          const fn = owner?.firstName || (owner?.username ? owner.username.split('_')[0] : 'Crop')
          const ln = owner?.lastName || 'Seller'
          const fullName = `${fn} ${ln}`.trim()
          sellerMap.set(sellerId, {
            _id: String(sellerId),
            id: String(sellerId),
            firebaseUid: owner?.firebaseUid || String(sellerId),
            username: owner?.username || `seller_${sellerId}`,
            firstName: fn,
            lastName: ln,
            fullName,
            email: owner?.email,
            phoneNumber: owner?.phoneNumber,
            profileImage: owner?.profileImage || '',
            location: crop.garden?.location || owner?.location,
            gardenExperience: owner?.gardenExperience || 'intermediate',
            crops: cropName ? [cropName] : [],
            cropsCount: 1,
          })
        }
      })
    }
  } catch (cropsErr) {
    console.warn('Error querying crops API for sellers:', cropsErr)
  }

  // 3. Convert map to array and apply query filtering if query provided
  const results = Array.from(sellerMap.values())

  if (!trimmed) {
    return results
  }

  return results.filter((seller) => {
    const nameMatch = seller.fullName?.toLowerCase().includes(trimmed)
    const userMatch = seller.username?.toLowerCase().includes(trimmed)
    const cropMatch = seller.crops?.some((c) => c.toLowerCase().includes(trimmed))
    return nameMatch || userMatch || cropMatch
  })
}

/**
 * Normalizes message record from Supabase or storage into SupabaseMessage.
 */
function normalizeMessage(row: Record<string, any>): SupabaseMessage {
  const sid = row.sender_id || row.senderId || (typeof row.sender === 'object' ? row.sender?._id : row.sender)
  const rid = row.receiver_id || row.receiverId || (typeof row.receiver === 'object' ? row.receiver?._id : row.receiver)
  const createdAt = row.created_at || row.createdAt || new Date().toISOString()
  const isRead = Boolean(row.is_read ?? row.isRead)

  return {
    id: String(row.id || row._id || Date.now()),
    _id: String(row.id || row._id || Date.now()),
    sender_id: sid,
    receiver_id: rid,
    senderId: sid,
    receiverId: rid,
    sender_name: row.sender_name || row.senderName || row.sender?.firstName,
    receiver_name: row.receiver_name || row.receiverName || row.receiver?.firstName,
    sender_avatar: row.sender_avatar || row.senderAvatar || row.sender?.profileImage,
    receiver_avatar: row.receiver_avatar || row.receiverAvatar || row.receiver?.profileImage,
    content: row.content || '',
    is_read: isRead,
    isRead,
    created_at: createdAt,
    createdAt,
    sender: typeof row.sender === 'object' ? row.sender : {
      _id: sid,
      username: row.sender_name || 'user',
      firstName: (row.sender_name || 'User').split(' ')[0],
      lastName: (row.sender_name || '').split(' ').slice(1).join(' '),
      profileImage: row.sender_avatar || '',
    },
    receiver: typeof row.receiver === 'object' ? row.receiver : {
      _id: rid,
      username: row.receiver_name || 'seller',
      firstName: (row.receiver_name || 'Seller').split(' ')[0],
      lastName: (row.receiver_name || '').split(' ').slice(1).join(' '),
      profileImage: row.receiver_avatar || '',
    },
  }
}

/**
 * Fetches conversation messages between two users from Supabase SQL database.
 * Falls back to localStorage cache if Supabase is offline.
 */
export async function fetchMessagesFromSupabase(
  user1Id: string,
  user2Id: string
): Promise<SupabaseMessage[]> {
  const cacheKey = `cgp_chat_${[user1Id, user2Id].sort().join('_')}`
  let messages: SupabaseMessage[] = []

  // Check Supabase if configured
  if (isSupabaseConfigured() && user1Id && user2Id) {
    try {
      const f1 = `and(sender_id.eq.${encodeURIComponent(user1Id)},receiver_id.eq.${encodeURIComponent(user2Id)})`
      const f2 = `and(sender_id.eq.${encodeURIComponent(user2Id)},receiver_id.eq.${encodeURIComponent(user1Id)})`
      const endpoint = `${SUPABASE_URL}/rest/v1/messages?or=(${f1},${f2})&order=created_at.asc`

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: getSupabaseHeaders(),
      })

      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows) && rows.length > 0) {
          messages = rows.map(normalizeMessage)
          if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify(messages))
          }
          return messages
        }
      }
    } catch (err) {
      console.warn('Error fetching messages from Supabase:', err)
    }
  }

  // Fallback to local storage cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        messages = JSON.parse(cached)
      }
    } catch {
      messages = []
    }
  }

  return messages
}

/**
 * Sends and stores a new message in the Supabase SQL database.
 * Also caches in local storage and dispatches update.
 */
export async function sendMessageToSupabase(params: {
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  senderAvatar?: string
  receiverAvatar?: string
  content: string
}): Promise<SupabaseMessage> {
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const timestamp = new Date().toISOString()

  const messageRecord: SupabaseMessage = {
    id: msgId,
    _id: msgId,
    sender_id: params.senderId,
    receiver_id: params.receiverId,
    senderId: params.senderId,
    receiverId: params.receiverId,
    sender_name: params.senderName,
    receiver_name: params.receiverName,
    sender_avatar: params.senderAvatar || '',
    receiver_avatar: params.receiverAvatar || '',
    content: params.content,
    is_read: false,
    isRead: false,
    created_at: timestamp,
    createdAt: timestamp,
    sender: {
      _id: params.senderId,
      username: params.senderName.toLowerCase().replace(/\s+/g, ''),
      firstName: params.senderName.split(' ')[0],
      lastName: params.senderName.split(' ').slice(1).join(' '),
      profileImage: params.senderAvatar || '',
    },
    receiver: {
      _id: params.receiverId,
      username: params.receiverName.toLowerCase().replace(/\s+/g, ''),
      firstName: params.receiverName.split(' ')[0],
      lastName: params.receiverName.split(' ').slice(1).join(' '),
      profileImage: params.receiverAvatar || '',
    },
  }

  // 1. Save to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
        method: 'POST',
        headers: {
          ...getSupabaseHeaders(),
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          id: msgId,
          sender_id: params.senderId,
          receiver_id: params.receiverId,
          sender_name: params.senderName,
          receiver_name: params.receiverName,
          sender_avatar: params.senderAvatar || null,
          receiver_avatar: params.receiverAvatar || null,
          content: params.content,
          is_read: false,
          created_at: timestamp,
        }),
      })
    } catch (sbErr) {
      console.warn('Supabase message insert error:', sbErr)
    }
  }

  // 2. Update local cache
  if (typeof window !== 'undefined') {
    const cacheKey = `cgp_chat_${[params.senderId, params.receiverId].sort().join('_')}`
    try {
      const existing = localStorage.getItem(cacheKey)
      const list: SupabaseMessage[] = existing ? JSON.parse(existing) : []
      list.push(messageRecord)
      localStorage.setItem(cacheKey, JSON.stringify(list))

      // Also record in user's active conversations list
      const convKey = `cgp_active_convs_${params.senderId}`
      const convs = JSON.parse(localStorage.getItem(convKey) || '[]')
      const index = convs.findIndex((c: any) => c.partnerId === params.receiverId)
      const convItem = {
        partnerId: params.receiverId,
        partnerName: params.receiverName,
        partnerAvatar: params.receiverAvatar || '',
        lastMessage: params.content,
        timestamp,
      }
      if (index >= 0) {
        convs[index] = convItem
      } else {
        convs.unshift(convItem)
      }
      localStorage.setItem(convKey, JSON.stringify(convs))
    } catch (e) {
      console.warn('Local storage message save error:', e)
    }
  }

  return messageRecord
}

/**
 * Fetches all conversations involving the current logged-in user from Supabase SQL database.
 */
export async function fetchConversationsFromSupabase(
  currentUserId: string
): Promise<any[]> {
  if (!currentUserId) return []

  const convMap = new Map<string, any>()

  // 1. From Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const endpoint = `${SUPABASE_URL}/rest/v1/messages?or=(sender_id.eq.${encodeURIComponent(currentUserId)},receiver_id.eq.${encodeURIComponent(currentUserId)})&order=created_at.desc&limit=100`
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: getSupabaseHeaders(),
      })

      if (res.ok) {
        const rows = await res.json()
        if (Array.isArray(rows)) {
          rows.forEach((row: any) => {
            const isMeSender = row.sender_id === currentUserId
            const partnerId = isMeSender ? row.receiver_id : row.sender_id
            const partnerName = isMeSender ? (row.receiver_name || 'Crop Seller') : (row.sender_name || 'User')
            const partnerAvatar = isMeSender ? (row.receiver_avatar || '') : (row.sender_avatar || '')

            if (!convMap.has(partnerId)) {
              convMap.set(partnerId, {
                _id: partnerId,
                user: {
                  _id: partnerId,
                  username: partnerName.toLowerCase().replace(/\s+/g, ''),
                  firstName: partnerName.split(' ')[0],
                  lastName: partnerName.split(' ').slice(1).join(' '),
                  profileImage: partnerAvatar,
                },
                lastMessage: {
                  content: row.content,
                  createdAt: row.created_at,
                  isRead: row.is_read ?? true,
                },
                unreadCount: (!isMeSender && !row.is_read) ? 1 : 0,
              })
            }
          })
        }
      }
    } catch (err) {
      console.warn('Error fetching conversations from Supabase:', err)
    }
  }

  // 2. Also check local storage for conversations
  if (typeof window !== 'undefined') {
    try {
      const convKey = `cgp_active_convs_${currentUserId}`
      const localConvs = JSON.parse(localStorage.getItem(convKey) || '[]')
      localConvs.forEach((c: any) => {
        if (!convMap.has(c.partnerId)) {
          convMap.set(c.partnerId, {
            _id: c.partnerId,
            user: {
              _id: c.partnerId,
              username: c.partnerName?.toLowerCase().replace(/\s+/g, '') || 'seller',
              firstName: c.partnerName?.split(' ')[0] || 'Crop',
              lastName: c.partnerName?.split(' ').slice(1).join(' ') || 'Seller',
              profileImage: c.partnerAvatar || '',
            },
            lastMessage: {
              content: c.lastMessage || 'Connected on GardenShare',
              createdAt: c.timestamp || new Date().toISOString(),
              isRead: true,
            },
            unreadCount: 0,
          })
        }
      })
    } catch (e) {
      console.warn('Local storage conv fetch error:', e)
    }
  }

  return Array.from(convMap.values())
}
