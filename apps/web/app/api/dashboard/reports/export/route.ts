import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@dashboard/db'
import { getCurrentBusiness } from '@/lib/auth-utils'
import * as XLSX from 'xlsx'
import { format as formatDate } from 'date-fns'
import { logger } from '@/lib/logger'

// Export reports as Excel or CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const outputFormat = searchParams.get('format') || 'excel' // excel or csv
    const period = searchParams.get('period') || 'monthly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Get current business
    const business = await getCurrentBusiness()
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const businessSettings = business.settings as { enableStaffModule?: boolean } | null | undefined
    const businessFeatures = business.features as { enableStaffModule?: boolean } | null | undefined
    const staffModuleEnabled = Boolean(
      businessSettings?.enableStaffModule ?? businessFeatures?.enableStaffModule
    )

    // Calculate date range
    let start: Date
    let end: Date
    const now = new Date()
    
    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      // Default to last 30 days
      end = now
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get appointments
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
        service: true,
        staff: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // Get business info
    const tenant = await prisma.tenant.findUnique({
      where: { id: business.tenantId },
      include: {
        users: {
          where: { isAdmin: true },
          take: 1
        }
      }
    })

    // Prepare data for export
    const summaryData = [
      ['Business Report', business.name],
      ['Period', `${formatDate(start, 'yyyy-MM-dd')} to ${formatDate(end, 'yyyy-MM-dd')}`],
      ['Generated', formatDate(now, 'yyyy-MM-dd HH:mm')],
      [],
      ['Summary'],
      ['Total Revenue', appointments.reduce((sum, apt) => apt.status !== 'CANCELLED' ? sum + (apt.totalAmount || 0) : sum, 0)],
      ['Total Appointments', appointments.length],
      ['Completed', appointments.filter(apt => apt.status === 'CONFIRMED' || apt.status === 'COMPLETED').length],
      ['Cancelled', appointments.filter(apt => apt.status === 'CANCELLED').length],
      ['Pending', appointments.filter(apt => apt.status === 'PENDING').length],
      []
    ]

    const appointmentsData = [
      ['Appointments Detail'],
      ['Date', 'Time', 'Customer', 'Service', 'Staff', 'Status', 'Amount', 'Phone', 'Email'],
      ...appointments.map(apt => [
        formatDate(apt.startTime, 'yyyy-MM-dd'),
        formatDate(apt.startTime, 'HH:mm'),
        apt.customer?.name || 'N/A',
        apt.service?.name || 'N/A',
        apt.staff?.name || tenant?.users[0]?.name || 'Owner',
        apt.status,
        apt.totalAmount || 0,
        apt.customer?.phone || 'N/A',
        apt.customer?.email || 'N/A'
      ])
    ]

    // Calculate staff reports if enabled
    let staffData: any[] = []
    if (staffModuleEnabled) {
      const staffMembers = await prisma.staff.findMany({
        where: { businessId: business.id }
      })

      staffData = [
        [],
        ['Staff Performance Report'],
        ['Staff Name', 'Total Revenue', 'Appointments', 'Completed', 'Cancelled', 'Hours Worked', 'Avg Ticket'],
        ...staffMembers.map(staff => {
          const staffAppointments = appointments.filter(apt => apt.staffId === staff.id)
          const revenue = staffAppointments.reduce((sum, apt) => 
            apt.status !== 'CANCELLED' ? sum + (apt.totalAmount || 0) : sum, 0)
          const hoursWorked = staffAppointments.reduce((sum, apt) => {
            if (apt.status !== 'CANCELLED' && apt.endTime) {
              return sum + (apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60 * 60)
            }
            return sum + 1 // Default to 1 hour
          }, 0)
          
          return [
            staff.name,
            revenue,
            staffAppointments.length,
            staffAppointments.filter(apt => apt.status === 'CONFIRMED' || apt.status === 'COMPLETED').length,
            staffAppointments.filter(apt => apt.status === 'CANCELLED').length,
            Math.round(hoursWorked * 10) / 10,
            staffAppointments.length > 0 ? revenue / staffAppointments.length : 0
          ]
        })
      ]
    }

    // Service performance data
    const serviceStats = appointments.reduce((acc, apt) => {
      if (apt.service && apt.status !== 'CANCELLED') {
        const serviceName = apt.service.name
        if (!acc[serviceName]) {
          acc[serviceName] = { count: 0, revenue: 0 }
        }
        acc[serviceName].count++
        acc[serviceName].revenue += apt.totalAmount || 0
      }
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const serviceData = [
      [],
      ['Service Performance'],
      ['Service', 'Count', 'Total Revenue', 'Average Price'],
      ...Object.entries(serviceStats)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .map(([name, stats]) => [
          name,
          stats.count,
          stats.revenue,
          stats.revenue / stats.count
        ])
    ]

    // Customer data
    const customerMap = new Map()
    appointments.forEach(apt => {
      if (apt.customerId) {
        if (!customerMap.has(apt.customerId)) {
          customerMap.set(apt.customerId, {
            name: apt.customer?.name || 'N/A',
            appointments: 0,
            revenue: 0
          })
        }
        const customer = customerMap.get(apt.customerId)
        customer.appointments++
        if (apt.status !== 'CANCELLED') {
          customer.revenue += apt.totalAmount || 0
        }
      }
    })

    const customerData = [
      [],
      ['Customer Analysis'],
      ['Customer', 'Appointments', 'Total Spent'],
      ...Array.from(customerMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 20) // Top 20 customers
        .map(customer => [
          customer.name,
          customer.appointments,
          customer.revenue
        ])
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Add Summary sheet
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ...summaryData,
      ...serviceData,
      ...customerData,
      ...staffData
    ])
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')
    
    // Add Appointments sheet
    const appointmentsSheet = XLSX.utils.aoa_to_sheet(appointmentsData)
    XLSX.utils.book_append_sheet(wb, appointmentsSheet, 'Appointments')

    // Generate buffer
    const buffer = XLSX.write(wb, { 
      bookType: outputFormat === 'csv' ? 'csv' : 'xlsx', 
      type: 'buffer' 
    })

    // Return file
    const filename = `${business.name.replace(/[^a-z0-9]/gi, '_')}_report_${formatDate(now, 'yyyyMMdd')}.${outputFormat === 'csv' ? 'csv' : 'xlsx'}`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': outputFormat === 'csv' 
          ? 'text/csv' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error('Error exporting reports:', error)
    return NextResponse.json(
      { error: 'Failed to export reports' },
      { status: 500 }
    )
  }
}