// Test what day of week different dates return
const dates = [
  '2025-01-20', // Monday
  '2025-01-21', // Tuesday
  '2025-01-22', // Wednesday
  '2025-01-23', // Thursday
  '2025-01-24', // Friday
  '2025-01-25', // Saturday
  '2025-01-26', // Sunday
]

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

console.log('Testing Date.getDay() for different dates:')
console.log('==========================================')

dates.forEach(dateString => {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay()
  console.log(`${dateString} -> Day ${dayOfWeek} (${dayNames[dayOfWeek]})`)
})

console.log('\n\nTesting with UTC:')
console.log('==================')

dates.forEach(dateString => {
  const date = new Date(dateString + 'T00:00:00')
  const dayOfWeek = date.getDay()
  console.log(`${dateString}T00:00:00 -> Day ${dayOfWeek} (${dayNames[dayOfWeek]})`)
})

console.log('\n\nTesting with different timezone interpretation:')
console.log('===============================================')

dates.forEach(dateString => {
  // When parsing YYYY-MM-DD, JavaScript treats it as UTC
  const date = new Date(dateString)
  console.log(`${dateString}:`)
  console.log(`  - toString(): ${date.toString()}`)
  console.log(`  - toISOString(): ${date.toISOString()}`)
  console.log(`  - getDay(): ${date.getDay()}`)
  console.log(`  - getUTCDay(): ${date.getUTCDay()}`)
  console.log('')
})