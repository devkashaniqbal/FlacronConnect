import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/constants/firestore'

export interface AdminBusiness {
  id:         string
  name:       string
  plan:       string
  planStatus: string
  industry?:  string
  ownerId:    string
  createdAt:  Date
  mrr:        number
}

export interface AdminStats {
  totalBusinesses:  number
  totalUsers:       number
  mrr:              number
  planDistribution: { plan: string; count: number; revenue: number }[]
  recentBusinesses: AdminBusiness[]
}

const PLAN_PRICE: Record<string, number> = {
  starter: 29, growth: 79, pro: 149, enterprise: 399,
}

export function useAdminStats() {
  const [stats, setStats]       = useState<AdminStats | null>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Fetch all businesses
        const bizSnap = await getDocs(collection(db, COLLECTIONS.BUSINESSES))
        const businesses: AdminBusiness[] = bizSnap.docs.map(d => {
          const data = d.data()
          const plan = data.plan || 'starter'
          return {
            id:         d.id,
            name:       data.name || 'Unnamed Business',
            plan,
            planStatus: data.planStatus || 'active',
            industry:   data.industryType,
            ownerId:    data.ownerId || '',
            createdAt:  data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            mrr:        data.planStatus === 'active' ? (PLAN_PRICE[plan] ?? 0) : 0,
          }
        })

        // Fetch all users
        const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS))
        const totalUsers = usersSnap.size

        // Compute plan distribution
        const planMap: Record<string, { count: number; revenue: number }> = {
          starter: { count: 0, revenue: 0 },
          growth:  { count: 0, revenue: 0 },
          pro:     { count: 0, revenue: 0 },
          enterprise: { count: 0, revenue: 0 },
        }
        let totalMrr = 0
        for (const b of businesses) {
          if (planMap[b.plan]) {
            planMap[b.plan].count++
            planMap[b.plan].revenue += b.mrr
          }
          totalMrr += b.mrr
        }

        const planDistribution = Object.entries(planMap).map(([plan, v]) => ({
          plan: plan.charAt(0).toUpperCase() + plan.slice(1),
          count: v.count,
          revenue: v.revenue,
        }))

        // Recent businesses sorted by createdAt desc
        const recentBusinesses = [...businesses]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10)

        setStats({
          totalBusinesses:  businesses.length,
          totalUsers,
          mrr:              totalMrr,
          planDistribution,
          recentBusinesses,
        })
      } catch (err) {
        console.error('Admin stats load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { stats, isLoading }
}
