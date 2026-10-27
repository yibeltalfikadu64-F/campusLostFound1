import { PrismaClient, Role, ItemType, StorageArrangement, ItemStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const LOCATIONS = [
  { name: 'Main Gate', description: 'Primary university entrance gate and guard post', latitude: 10.9782, longitude: 36.9281 },
  { name: 'Central Library', description: 'Academic library building and reading halls', latitude: 10.9790, longitude: 36.9295 },
  { name: 'Main Student Cafeteria', description: 'Central dining hall and surrounding patio', latitude: 10.9801, longitude: 36.9310 },
  { name: 'Male Dormitory Block', description: 'Student residences blocks 1 to 6', latitude: 10.9815, longitude: 36.9320 },
  { name: 'Female Dormitory Block', description: 'Student residences blocks 7 to 12', latitude: 10.9820, longitude: 36.9325 },
  { name: 'Classroom Block A & B', description: 'Lecture halls and engineering laboratories', latitude: 10.9795, longitude: 36.9288 },
  { name: 'Main Administration Building', description: 'President and registrar offices', latitude: 10.9788, longitude: 36.9275 },
  { name: 'Campus Sports Complex', description: 'Football pitch, track, and gym facilities', latitude: 10.9830, longitude: 36.9340 },
  { name: 'Security Office', description: 'Campus central security department and custody', latitude: 10.9780, longitude: 36.9278 },
  { name: 'Student Services & Clinic', description: 'Health center and student union office', latitude: 10.9805, longitude: 36.9290 }
];

const CATEGORIES = [
  { name: 'Electronics & Gadgets', description: 'Phones, laptops, chargers, flash drives, power banks', icon: 'laptop-outline' },
  { name: 'IDs & Documents', description: 'Student IDs, national IDs, bank cards, passports', icon: 'card-outline' },
  { name: 'Wallets & Money', description: 'Wallets, purses, money clips', icon: 'wallet-outline' },
  { name: 'Keys & Keychains', description: 'Room keys, motorbike keys, padlock keys', icon: 'key-outline' },
  { name: 'Books & Stationery', description: 'Textbooks, notebooks, calculators, binders', icon: 'book-outline' },
  { name: 'Bags & Backpacks', description: 'Backpacks, shoulder bags, duffel bags', icon: 'bag-personal-outline' },
  { name: 'Clothing & Apparel', description: 'Jackets, sweaters, scarves, caps', icon: 'tshirt-crew-outline' },
  { name: 'Eyewear & Glasses', description: 'Prescription glasses, sunglasses, cases', icon: 'glasses' },
  { name: 'Jewelry & Watches', description: 'Watches, rings, necklaces', icon: 'watch' },
  { name: 'Other Items', description: 'Miscellaneous items not covered above', icon: 'help-circle-outline' }
];

export async function seed() {
  console.log('--- Starting Injibara University Database Seed ---');

  // 1. Seed Locations
  console.log('Seeding campus locations...');
  for (const loc of LOCATIONS) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: { description: loc.description, latitude: loc.latitude, longitude: loc.longitude },
      create: loc
    });
  }

  // 2. Seed Categories
  console.log('Seeding item categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description, icon: cat.icon },
      create: cat
    });
  }

  // 3. Seed Admin User
  const adminEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@injibara.edu.et').toLowerCase();
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'ChangeThisPasswordInjibara2026!';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: process.env.ADMIN_BOOTSTRAP_NAME || 'Injibara Security Administrator',
      role: Role.ADMIN,
      phone: process.env.ADMIN_BOOTSTRAP_PHONE || '+251911223344',
      universityId: process.env.ADMIN_BOOTSTRAP_ID || 'ADM-001',
      isActive: true
    },
    create: {
      fullName: process.env.ADMIN_BOOTSTRAP_NAME || 'Injibara Security Administrator',
      email: adminEmail,
      universityId: process.env.ADMIN_BOOTSTRAP_ID || 'ADM-001',
      phone: process.env.ADMIN_BOOTSTRAP_PHONE || '+251911223344',
      passwordHash: adminHash,
      role: Role.ADMIN,
      department: 'Campus Safety & Security',
      isActive: true
    }
  });
  console.log(`Admin user seeded: ${admin.email}`);

  // 4. Seed Security Officer User
  const officerHash = await bcrypt.hash('OfficerPass2026!', 10);
  const officer = await prisma.user.upsert({
    where: { email: 'security@injibara.edu.et' },
    update: { role: Role.SECURITY_OFFICER, isActive: true },
    create: {
      fullName: 'Officer Abebe Kebede',
      email: 'security@injibara.edu.et',
      universityId: 'SEC-042',
      phone: '+251922334455',
      passwordHash: officerHash,
      role: Role.SECURITY_OFFICER,
      department: 'Campus Security Patrol',
      isActive: true
    }
  });
  console.log(`Security officer seeded: ${officer.email}`);

  // 5. Seed Student User
  const studentHash = await bcrypt.hash('StudentPass2026!', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@injibara.edu.et' },
    update: { role: Role.USER, isActive: true },
    create: {
      fullName: 'Dawit Tadesse',
      email: 'student@injibara.edu.et',
      universityId: 'UGR/14022/14',
      phone: '+251933445566',
      passwordHash: studentHash,
      role: Role.USER,
      department: 'Computer Science',
      isActive: true
    }
  });
  console.log(`Student user seeded: ${student.email}`);

  // 6. Seed Sample Items (Lost and Found)
  const electronicsCategory = await prisma.category.findUnique({ where: { name: 'Electronics & Gadgets' } });
  const idCategory = await prisma.category.findUnique({ where: { name: 'IDs & Documents' } });
  const libraryLoc = await prisma.location.findUnique({ where: { name: 'Central Library' } });
  const cafeteriaLoc = await prisma.location.findUnique({ where: { name: 'Main Student Cafeteria' } });

  if (electronicsCategory && idCategory && libraryLoc && cafeteriaLoc) {
    const existingItems = await prisma.item.count();
    if (existingItems === 0) {
      // Create a FOUND item
      const foundItem = await prisma.item.create({
        data: {
          reporterId: officer.id,
          type: ItemType.FOUND,
          categoryId: electronicsCategory.id,
          locationId: libraryLoc.id,
          title: 'Samsung Galaxy A54 Blue',
          description: 'Found on the 2nd floor silent study desk. Has a transparent case with a sticker on the back.',
          color: 'Awesome Blue',
          brand: 'Samsung',
          hiddenDetail: 'Lockscreen wallpaper shows a golden retriever; lock PIN is 6 digits; sticker is a Messi cartoon.',
          dateEvent: new Date(Date.now() - 24 * 3600 * 1000),
          keptAt: StorageArrangement.SECURITY_OFFICE,
          status: ItemStatus.OPEN,
          contactPreference: 'IN_APP',
          images: {
            create: [
              { imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80' }
            ]
          }
        }
      });

      // Create a LOST item
      await prisma.item.create({
        data: {
          reporterId: student.id,
          type: ItemType.LOST,
          categoryId: idCategory.id,
          locationId: cafeteriaLoc.id,
          title: 'Injibara Student ID Card (Dawit Tadesse)',
          description: 'Misplaced my official university plastic ID card during lunch hour near counter 2.',
          color: 'Blue & White',
          brand: 'Injibara University',
          dateEvent: new Date(Date.now() - 12 * 3600 * 1000),
          keptAt: StorageArrangement.WITH_FINDER,
          status: ItemStatus.OPEN,
          contactPreference: 'PHONE',
          images: {
            create: [
              { imageUrl: 'https://images.unsplash.com/photo-1589330694653-dad6ef0140be?auto=format&fit=crop&w=600&q=80' }
            ]
          }
        }
      });
      console.log(`Seeded 2 sample demonstration items (FOUND ID: ${foundItem.id})`);
    }
  }

  console.log('--- Injibara Database Seeding Complete ---');
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error('Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
