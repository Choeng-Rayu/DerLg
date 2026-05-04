/**
 * One-time admin user seeder script.
 * Run: npx ts-node --project tsconfig.json prisma/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'admin@derlg.com'
const ADMIN_PASSWORD = 'Admin@DerLg2026!'
const ADMIN_NAME = 'Super Admin'

async function main() {
  console.log('🌱 Seeding admin user...')

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      role: 'ADMIN',
      emailVerified: true,
    },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      role: 'ADMIN',
      preferredLanguage: 'EN',
      emailVerified: true,
      tokenVersion: 0,
    },
  })

  console.log(`\n✅ Admin user ready:`)
  console.log(`   ID:       ${admin.id}`)
  console.log(`   Email:    ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log(`   Role:     ${admin.role}`)
  console.log(`\n👉 Log in at: http://localhost:3002/login`)
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
