import { prisma } from '../src/index'

type CustomerLite = {
  id: string
  email: string
  name: string | null
  lastName: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  password: string | null
  emailVerified: boolean
  tags: string[]
  metadata: any
  tenantId: string
  createdAt: Date
}

function scoreCustomer(c: CustomerLite, rel: { bc: number; apt: number; pkg: number }) {
  const fieldScore =
    (c.password ? 2 : 0) +
    (c.name && c.name.trim() ? 1 : 0) +
    (c.lastName && String(c.lastName).trim() ? 1 : 0) +
    (c.phone && String(c.phone).trim() ? 1 : 0) +
    (c.address ? 0.5 : 0) +
    (c.city ? 0.25 : 0) +
    (c.postalCode ? 0.25 : 0) +
    (c.emailVerified ? 1 : 0)
  const relScore = rel.bc * 3 + rel.pkg * 2 + rel.apt
  return fieldScore + relScore
}

async function pickCanonical(email: string): Promise<{ canonical: CustomerLite | null; duplicates: CustomerLite[] }> {
  const customers = await prisma.customer.findMany({
    where: { email: email.toLowerCase() },
    orderBy: { createdAt: 'asc' }
  }) as CustomerLite[]
  if (customers.length <= 1) {
    return { canonical: customers[0] || null, duplicates: [] }
  }

  const scores: Record<string, number> = {}
  for (const customer of customers) {
    const c = customer as CustomerLite
    const [bc, apt, pkg] = await Promise.all([
      prisma.businessCustomer.count({ where: { customerId: c.id } }),
      prisma.appointment.count({ where: { customerId: c.id } }),
      prisma.packagePurchase.count({ where: { customerId: c.id } }),
    ])
    scores[c.id] = scoreCustomer(c as any, { bc, apt, pkg })
  }
  customers.sort((a, b) => (scores[b.id] - scores[a.id]) || (a.createdAt.getTime() - b.createdAt.getTime()))
  const canonical = customers[0]
  const duplicates = customers.slice(1)
  return { canonical, duplicates }
}

async function mergeBusinessCustomers(fromId: string, toId: string, dryRun: boolean) {
  const rows = await prisma.businessCustomer.findMany({ where: { customerId: fromId } })
  for (const r of rows) {
    const where = { businessId_customerId: { businessId: r.businessId, customerId: toId } }
    const existing = await prisma.businessCustomer.findUnique({ where })
    if (dryRun) continue
    if (existing) {
      await prisma.businessCustomer.update({
        where,
        data: {
          lastVisit: r.lastVisit && existing.lastVisit ? (r.lastVisit > existing.lastVisit ? r.lastVisit : existing.lastVisit) : (r.lastVisit || existing.lastVisit),
          totalVisits: existing.totalVisits + (r.totalVisits || 0),
          totalSpent: existing.totalSpent + (r.totalSpent || 0),
          isActive: existing.isActive || r.isActive,
          metadata: existing.metadata as any,
        }
      })
      await prisma.businessCustomer.delete({ where: { id: r.id } })
    } else {
      await prisma.businessCustomer.update({ where: { id: r.id }, data: { customerId: toId } })
    }
  }
}

async function reassignFKs(fromId: string, toId: string, dryRun: boolean) {
  const ops = [
    prisma.appointment.updateMany({ where: { customerId: fromId }, data: { customerId: toId } }),
    prisma.waitlistEntry.updateMany({ where: { customerId: fromId }, data: { customerId: toId } }),
    prisma.packagePurchase.updateMany({ where: { customerId: fromId }, data: { customerId: toId } }),
    prisma.verificationCode.updateMany({ where: { customerId: fromId }, data: { customerId: toId } }),
    prisma.passwordHistory.updateMany({ where: { customerId: fromId }, data: { customerId: toId } }),
    prisma.review.updateMany({ where: { customerId: fromId }, data: { customerId: toId } }),
    prisma.staffReview.updateMany({ where: { customerId: fromId }, data: { customerId: toId } }),
    prisma.loginAttempt.updateMany({ where: { customerId: fromId }, data: { customerId: toId } }),
  ]
  if (!dryRun) await Promise.all(ops)
  await mergeBusinessCustomers(fromId, toId, dryRun)
}

function mergeJson(a: any, b: any) {
  try {
    if (a && typeof a === 'object' && b && typeof b === 'object') return { ...a, ...b }
    return a ?? b ?? {}
  } catch { return a ?? b ?? {} }
}

async function enrichCanonical(canonicalId: string, sources: string[], dryRun: boolean) {
  const sourceRows = await prisma.customer.findMany({ where: { id: { in: sources } } })
  const canonical = await prisma.customer.findUnique({ where: { id: canonicalId } })
  if (!canonical) return
  let data: any = {}
  for (const s of sourceRows) {
    if (!canonical.name && s.name) data.name = s.name
    if (!(canonical.lastName ?? '').trim() && (s as any).lastName) data.lastName = (s as any).lastName
    if (!canonical.phone && s.phone) data.phone = s.phone
    if (!canonical.address && s.address) data.address = s.address
    if (!canonical.city && s.city) data.city = s.city
    if (!canonical.state && s.state) data.state = s.state
    if (!canonical.postalCode && s.postalCode) data.postalCode = s.postalCode
    if (!canonical.country && s.country) data.country = s.country
    data.tags = Array.from(new Set([...(canonical.tags || []), ...(s.tags || [])]))
    data.metadata = mergeJson(canonical.metadata, s.metadata) as any
  }
  if (Object.keys(data).length && !dryRun) {
    await prisma.customer.update({ where: { id: canonicalId }, data })
  }
}

async function consolidate(apply: boolean) {
  const dryRun = !apply
  const duplicates = await prisma.$queryRaw<{ email: string; cnt: bigint }[]>`
    SELECT LOWER(email) as email, COUNT(*)::bigint as cnt
    FROM customers
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
  `
  if (duplicates.length === 0) {
    console.log('No duplicates found. Nothing to do.')
    return
  }
  console.log(`Found ${duplicates.length} duplicated email groups`)
  for (const { email } of duplicates) {
    const { canonical, duplicates: dups } = await pickCanonical(email)
    if (!canonical || dups.length === 0) continue
    console.log(`Email ${email}: canonical ${canonical.id}, merging ${dups.length} duplicates`)
    for (const duplicate of dups) {
      await reassignFKs(duplicate.id, canonical.id, dryRun)
    }
    const duplicateIds = dups.map((duplicate) => duplicate.id)
    await enrichCanonical(canonical.id, duplicateIds, dryRun)
    if (!dryRun) {
      await prisma.customer.deleteMany({ where: { id: { in: duplicateIds } } })
    }
  }
}

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(apply ? 'Running in APPLY mode' : 'Running in DRY-RUN mode (no changes)')
  await consolidate(apply)
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
