const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAndFixWorkingHours() {
  try {
    // Get all businesses
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true }
    })

    console.log('Found businesses:', businesses.length)

    for (const business of businesses) {
      console.log(`\nChecking business: ${business.name} (${business.id})`)
      
      // Get existing working hours
      const existingHours = await prisma.workingHours.findMany({
        where: { businessId: business.id },
        orderBy: { dayOfWeek: 'asc' }
      })

      console.log('Existing working hours:', existingHours.length)
      
      // Check which days are missing
      const existingDays = existingHours.map(h => h.dayOfWeek)
      const missingDays = []
      
      // Monday to Friday (1-5)
      for (let day = 1; day <= 5; day++) {
        if (!existingDays.includes(day)) {
          missingDays.push(day)
        }
      }

      if (missingDays.length > 0) {
        console.log('Missing days:', missingDays)
        
        // Create default working hours for missing days
        for (const day of missingDays) {
          const newHours = await prisma.workingHours.create({
            data: {
              businessId: business.id,
              dayOfWeek: day,
              openTime: '09:00',
              closeTime: '18:00',
              isClosed: false,
              isActive: true
            }
          })
          console.log(`Created working hours for day ${day}:`, newHours)
        }
      }

      // Also ensure weekends are marked as closed
      for (let day = 0; day <= 6; day += 6) { // Sunday (0) and Saturday (6)
        const weekendHours = existingHours.find(h => h.dayOfWeek === day)
        if (!weekendHours) {
          await prisma.workingHours.create({
            data: {
              businessId: business.id,
              dayOfWeek: day,
              openTime: '09:00',
              closeTime: '18:00',
              isClosed: true,
              isActive: true
            }
          })
          console.log(`Created closed hours for day ${day}`)
        }
      }
    }

    // Show all working hours after fix
    console.log('\n=== All Working Hours After Fix ===')
    const allHours = await prisma.workingHours.findMany({
      orderBy: [
        { businessId: 'asc' },
        { dayOfWeek: 'asc' }
      ]
    })
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    allHours.forEach(h => {
      console.log(`Business ${h.businessId.slice(0, 8)}... - ${dayNames[h.dayOfWeek]}: ${h.isClosed ? 'CLOSED' : `${h.openTime} - ${h.closeTime}`}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndFixWorkingHours()