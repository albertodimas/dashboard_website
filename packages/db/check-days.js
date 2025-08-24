const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDays() {
  try {
    const hours = await prisma.workingHour.findMany({
      orderBy: { dayOfWeek: 'asc' }
    })
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    console.log('Current Working Hours in Database:')
    console.log('==================================')
    hours.forEach(h => {
      console.log(`Day ${h.dayOfWeek} (${dayNames[h.dayOfWeek]}): ${h.startTime}-${h.endTime} (Active: ${h.isActive})`)
    })
    
    console.log('\n\nJavaScript Date.getDay() mapping:')
    console.log('==================================')
    console.log('0 = Sunday')
    console.log('1 = Monday')
    console.log('2 = Tuesday')
    console.log('3 = Wednesday')
    console.log('4 = Thursday')
    console.log('5 = Friday')
    console.log('6 = Saturday')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDays()