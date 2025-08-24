const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAndUpdateScheduleSettings() {
  try {
    // Get all businesses
    const businesses = await prisma.business.findMany({
      select: { 
        id: true, 
        name: true, 
        settings: true 
      }
    })

    console.log('Found businesses:', businesses.length)

    for (const business of businesses) {
      console.log(`\nChecking business: ${business.name} (${business.id})`)
      
      // Check current settings
      const currentSettings = business.settings || {}
      console.log('Current settings:', JSON.stringify(currentSettings, null, 2))
      
      // Check if scheduleSettings exists
      if (!currentSettings.scheduleSettings) {
        console.log('No schedule settings found. Adding default settings...')
        
        // Add default schedule settings (1 hour interval, 09:00-17:00)
        const updatedSettings = {
          ...currentSettings,
          scheduleSettings: {
            timeInterval: 60, // 1 hour = 60 minutes
            startTime: '09:00',
            endTime: '17:00',
            workingDays: [1, 2, 3, 4, 5] // Monday to Friday
          }
        }
        
        // Update business with new settings
        await prisma.business.update({
          where: { id: business.id },
          data: { settings: updatedSettings }
        })
        
        console.log('Updated with schedule settings:', JSON.stringify(updatedSettings.scheduleSettings, null, 2))
      } else {
        console.log('Schedule settings already exist:', JSON.stringify(currentSettings.scheduleSettings, null, 2))
      }
    }

    console.log('\n=== Schedule Settings Check Complete ===')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndUpdateScheduleSettings()