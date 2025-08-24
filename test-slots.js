// Test slot generation logic
const { addMinutes, parseISO } = require('date-fns')

function generateSlots(startTime, endTime, serviceMinutes, intervalMinutes) {
  const slots = []
  const date = '2025-01-20' // Monday
  
  const workStart = parseISO(`${date}T${startTime}`)
  const workEnd = parseISO(`${date}T${endTime}`)
  
  let currentTime = workStart
  
  console.log(`\nGenerating slots from ${startTime} to ${endTime}`)
  console.log(`Service duration: ${serviceMinutes} minutes`)
  console.log(`Interval: ${intervalMinutes} minutes`)
  console.log('-----------------------------------')
  
  while (currentTime < workEnd) {
    const slotEnd = addMinutes(currentTime, serviceMinutes)
    
    // Allow slots that end exactly at closing time or before
    if (slotEnd <= workEnd) {
      const timeStr = currentTime.toTimeString().slice(0, 5)
      const endStr = slotEnd.toTimeString().slice(0, 5)
      slots.push(timeStr)
      console.log(`✓ Slot: ${timeStr} - ${endStr}`)
    } else {
      const timeStr = currentTime.toTimeString().slice(0, 5)
      const endStr = slotEnd.toTimeString().slice(0, 5)
      console.log(`✗ Skipped: ${timeStr} - ${endStr} (ends after closing)`)
    }
    
    currentTime = addMinutes(currentTime, intervalMinutes)
  }
  
  console.log(`\nTotal slots generated: ${slots.length}`)
  console.log('Available slots:', slots.join(', '))
  
  return slots
}

// Test different scenarios
console.log('========================================')
console.log('TEST 1: 30-minute service, 30-minute intervals')
generateSlots('09:00', '17:00', 30, 30)

console.log('\n========================================')
console.log('TEST 2: 60-minute service, 60-minute intervals')
generateSlots('09:00', '17:00', 60, 60)

console.log('\n========================================')
console.log('TEST 3: 60-minute service, 30-minute intervals')
generateSlots('09:00', '17:00', 60, 30)

console.log('\n========================================')
console.log('TEST 4: 30-minute service, 60-minute intervals')
generateSlots('09:00', '17:00', 30, 60)