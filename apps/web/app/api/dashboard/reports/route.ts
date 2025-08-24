import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness, createAuthResponse } from '@/lib/auth-utils'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format } from 'date-fns'

// GET business metrics and reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily' // daily, weekly, monthly, yearly
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Get current business
    const business = await getCurrentBusiness()

    if (!business) {
      return createAuthResponse('Business not found', 404)
    }

    // Calculate date ranges based on period
    let start: Date
    let end: Date
    let previousStart: Date
    let previousEnd: Date

    const now = new Date()
    
    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      previousStart = subDays(start, daysDiff)
      previousEnd = subDays(end, daysDiff)
    } else {
      switch (period) {
        case 'daily':
          start = startOfDay(now)
          end = endOfDay(now)
          previousStart = startOfDay(subDays(now, 1))
          previousEnd = endOfDay(subDays(now, 1))
          break
        case 'weekly':
          start = startOfWeek(now, { weekStartsOn: 1 })
          end = endOfWeek(now, { weekStartsOn: 1 })
          previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
          previousEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
          break
        case 'monthly':
          start = startOfMonth(now)
          end = endOfMonth(now)
          previousStart = startOfMonth(subMonths(now, 1))
          previousEnd = endOfMonth(subMonths(now, 1))
          break
        case 'yearly':
          start = startOfYear(now)
          end = endOfYear(now)
          previousStart = startOfYear(subYears(now, 1))
          previousEnd = endOfYear(subYears(now, 1))
          break
        default:
          start = startOfDay(now)
          end = endOfDay(now)
          previousStart = startOfDay(subDays(now, 1))
          previousEnd = endOfDay(subDays(now, 1))
      }
    }

    // Get appointments for current period
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startTime: {
          gte: start,
          lte: end
        }
      },
      include: {
        customer: true,
        service: true
      }
    })

    // Get appointments for previous period
    const previousAppointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startTime: {
          gte: previousStart,
          lte: previousEnd
        }
      }
    })

    // Calculate metrics
    const totalRevenue = appointments.reduce((sum, apt) => {
      if (apt.status !== 'CANCELLED') {
        return sum + (apt.totalAmount || 0)
      }
      return sum
    }, 0)

    const previousRevenue = previousAppointments.reduce((sum, apt) => {
      if (apt.status !== 'CANCELLED') {
        return sum + (apt.totalAmount || 0)
      }
      return sum
    }, 0)

    const totalAppointments = appointments.length
    const completedAppointments = appointments.filter(apt => apt.status === 'CONFIRMED' || apt.status === 'COMPLETED').length
    const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED').length
    const pendingAppointments = appointments.filter(apt => apt.status === 'PENDING').length

    const previousTotalAppointments = previousAppointments.length
    
    // Calculate unique customers
    const uniqueCustomers = new Set(appointments.map(apt => apt.customerId)).size
    const previousUniqueCustomers = new Set(previousAppointments.map(apt => apt.customerId)).size

    // Get new vs returning customers
    const allTimeCustomerIds = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        startTime: {
          lt: start
        }
      },
      select: {
        customerId: true
      },
      distinct: ['customerId']
    })

    const existingCustomerIds = new Set(allTimeCustomerIds.map(a => a.customerId))
    const currentCustomerIds = appointments.map(apt => apt.customerId)
    const newCustomers = currentCustomerIds.filter(id => !existingCustomerIds.has(id))
    const returningCustomers = currentCustomerIds.filter(id => existingCustomerIds.has(id))

    // Calculate service popularity
    const serviceStats = appointments.reduce((acc, apt) => {
      if (apt.service && apt.status !== 'CANCELLED') {
        const serviceName = apt.service.name
        if (!acc[serviceName]) {
          acc[serviceName] = {
            count: 0,
            revenue: 0
          }
        }
        acc[serviceName].count++
        acc[serviceName].revenue += apt.totalAmount || 0
      }
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    // Generate chart data based on period
    let chartData: any[] = []
    
    if (period === 'daily' || (startDate && endDate && Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) <= 7)) {
      // Show last 7 days
      const days = eachDayOfInterval({ 
        start: subDays(end, 6), 
        end 
      })
      
      chartData = await Promise.all(days.map(async (day) => {
        const dayStart = startOfDay(day)
        const dayEnd = endOfDay(day)
        
        const dayAppointments = await prisma.appointment.findMany({
          where: {
            businessId: business.id,
            startTime: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        })
        
        const revenue = dayAppointments.reduce((sum, apt) => {
          if (apt.status !== 'CANCELLED') {
            return sum + (apt.totalAmount || 0)
          }
          return sum
        }, 0)
        
        return {
          date: format(day, 'MMM dd'),
          revenue,
          appointments: dayAppointments.length
        }
      }))
    } else if (period === 'weekly') {
      // Show last 4 weeks
      const weeks = eachWeekOfInterval({ 
        start: subWeeks(end, 3), 
        end 
      }, { weekStartsOn: 1 })
      
      chartData = await Promise.all(weeks.map(async (week) => {
        const weekStart = startOfWeek(week, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(week, { weekStartsOn: 1 })
        
        const weekAppointments = await prisma.appointment.findMany({
          where: {
            businessId: business.id,
            startTime: {
              gte: weekStart,
              lte: weekEnd
            }
          }
        })
        
        const revenue = weekAppointments.reduce((sum, apt) => {
          if (apt.status !== 'CANCELLED') {
            return sum + (apt.totalAmount || 0)
          }
          return sum
        }, 0)
        
        return {
          date: `Week ${format(week, 'w')}`,
          revenue,
          appointments: weekAppointments.length
        }
      }))
    } else if (period === 'monthly') {
      // Show last 12 months
      const months = eachMonthOfInterval({ 
        start: subMonths(end, 11), 
        end 
      })
      
      chartData = await Promise.all(months.map(async (month) => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)
        
        const monthAppointments = await prisma.appointment.findMany({
          where: {
            businessId: business.id,
            startTime: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        })
        
        const revenue = monthAppointments.reduce((sum, apt) => {
          if (apt.status !== 'CANCELLED') {
            return sum + (apt.totalAmount || 0)
          }
          return sum
        }, 0)
        
        return {
          date: format(month, 'MMM'),
          revenue,
          appointments: monthAppointments.length
        }
      }))
    } else if (period === 'yearly') {
      // Show last 5 years
      const currentYear = now.getFullYear()
      chartData = await Promise.all([...Array(5)].map(async (_, i) => {
        const year = currentYear - 4 + i
        const yearStart = new Date(year, 0, 1)
        const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)
        
        const yearAppointments = await prisma.appointment.findMany({
          where: {
            businessId: business.id,
            startTime: {
              gte: yearStart,
              lte: yearEnd
            }
          }
        })
        
        const revenue = yearAppointments.reduce((sum, apt) => {
          if (apt.status !== 'CANCELLED') {
            return sum + (apt.totalAmount || 0)
          }
          return sum
        }, 0)
        
        return {
          date: year.toString(),
          revenue,
          appointments: yearAppointments.length
        }
      }))
    }

    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0

    const appointmentChange = previousTotalAppointments > 0 
      ? ((totalAppointments - previousTotalAppointments) / previousTotalAppointments) * 100 
      : totalAppointments > 0 ? 100 : 0

    const customerChange = previousUniqueCustomers > 0 
      ? ((uniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers) * 100 
      : uniqueCustomers > 0 ? 100 : 0

    // Get peak hours
    const hourlyStats = appointments.reduce((acc, apt) => {
      const hour = apt.startTime.getHours()
      if (!acc[hour]) {
        acc[hour] = 0
      }
      acc[hour]++
      return acc
    }, {} as Record<number, number>)

    const peakHours = Object.entries(hourlyStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    return NextResponse.json({
      metrics: {
        revenue: {
          total: totalRevenue,
          previous: previousRevenue,
          change: revenueChange
        },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
          pending: pendingAppointments,
          previous: previousTotalAppointments,
          change: appointmentChange
        },
        customers: {
          unique: uniqueCustomers,
          new: newCustomers.length,
          returning: returningCustomers.length,
          previous: previousUniqueCustomers,
          change: customerChange
        },
        averageTicket: totalAppointments > 0 ? totalRevenue / totalAppointments : 0
      },
      chartData,
      serviceStats: Object.entries(serviceStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue),
      peakHours,
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}