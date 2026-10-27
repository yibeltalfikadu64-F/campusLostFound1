import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const LOCATIONS = [
  {
    name: "Main Gate",
    description: "Primary university entrance gate and guard post",
    latitude: 10.9782,
    longitude: 36.9281,
  },
  {
    name: "Central Library",
    description: "Academic library building and reading halls",
    latitude: 10.979,
    longitude: 36.9295,
  },
  {
    name: "Main Student Cafeteria",
    description: "Central dining hall and surrounding patio",
    latitude: 10.9801,
    longitude: 36.931,
  },
  {
    name: "Male Dormitory Block",
    description: "Student residences blocks 1 to 6",
    latitude: 10.9815,
    longitude: 36.932,
  },
  {
    name: "Female Dormitory Block",
    description: "Student residences blocks 7 to 12",
    latitude: 10.982,
    longitude: 36.9325,
  },
  {
    name: "Classroom Block A & B",
    description: "Lecture halls and engineering laboratories",
    latitude: 10.9795,
    longitude: 36.9288,
  },
  {
    name: "Main Administration Building",
    description: "President and registrar offices",
    latitude: 10.9788,
    longitude: 36.9275,
  },
  {
    name: "Campus Sports Complex",
    description: "Football pitch, track, and gym facilities",
    latitude: 10.983,
    longitude: 36.934,
  },
  {
    name: "Security Office",
    description: "Campus central security department and custody",
    latitude: 10.978,
    longitude: 36.9278,
  },
  {
    name: "Student Services & Clinic",
    description: "Health center and student union office",
    latitude: 10.9805,
    longitude: 36.929,
  },
];

const CATEGORIES = [
  {
    name: "Electronics & Gadgets",
    description: "Phones, laptops, chargers, flash drives, power banks",
    icon: "laptop-outline",
  },
  {
    name: "IDs & Documents",
    description: "Student IDs, national IDs, bank cards, passports",
    icon: "card-outline",
  },
  {
    name: "Wallets & Money",
    description: "Wallets, purses, money clips",
    icon: "wallet-outline",
  },
  {
    name: "Keys & Keychains",
    description: "Room keys, motorbike keys, padlock keys",
    icon: "key-outline",
  },
  {
    name: "Books & Stationery",
    description: "Textbooks, notebooks, calculators, binders",
    icon: "book-outline",
  },
  {
    name: "Bags & Backpacks",
    description: "Backpacks, shoulder bags, duffel bags",
    icon: "bag-personal-outline",
  },
  {
    name: "Clothing & Apparel",
    description: "Jackets, sweaters, scarves, caps",
    icon: "tshirt-crew-outline",
  },
  {
    name: "Eyewear & Glasses",
    description: "Prescription glasses, sunglasses, cases",
    icon: "glasses",
  },
  {
    name: "Jewelry & Watches",
    description: "Watches, rings, necklaces",
    icon: "watch",
  },
  {
    name: "Other Items",
    description: "Miscellaneous items not covered above",
    icon: "help-circle-outline",
  },
];

export async function seed(): Promise<void> {
  console.log("Starting Injibara Campus Lost & Found seed...");

  // 1. Create or update campus locations.
  for (const location of LOCATIONS) {
    await prisma.location.upsert({
      where: { name: location.name },
      update: {
        description: location.description,
        latitude: location.latitude,
        longitude: location.longitude,
      },
      create: location,
    });
  }

  console.log(`Locations ready: ${LOCATIONS.length}`);

  // 2. Create or update item categories.
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
        icon: category.icon,
      },
      create: category,
    });
  }

  console.log(`Categories ready: ${CATEGORIES.length}`);

  // 3. Validate administrator configuration.
  const configuredEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim();
  const configuredPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const email = configuredEmail?.toLowerCase();

  if (!email || !configuredPassword?.trim()) {
    throw new Error(
      "Set ADMIN_BOOTSTRAP_EMAIL and a strong, unique ADMIN_BOOTSTRAP_PASSWORD in backend/.env.",
    );
  }

  // 4. Preserve existing accounts; create an admin only if absent.
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (existingUser.role !== Role.ADMIN) {
      throw new Error(
        "The configured admin email already belongs to a non-admin account. No user was changed.",
      );
    }

    console.log(
      "Administrator already exists. Its password and profile were left unchanged.",
    );
  } else {
    const passwordHash = await bcrypt.hash(configuredPassword, 12);

    await prisma.user.create({
      data: {
        fullName:
          process.env.ADMIN_BOOTSTRAP_NAME?.trim() ||
          "Injibara Campus Security Admin",
        email,
        universityId: process.env.ADMIN_BOOTSTRAP_ID?.trim() || "ADM-001",
        phone: process.env.ADMIN_BOOTSTRAP_PHONE?.trim() || undefined,
        passwordHash,
        role: Role.ADMIN,
        department: "Campus Safety & Security",
        isActive: true,
      },
    });

    console.log(`Administrator account created: ${email}`);
  }

  console.log("Seed completed successfully.");
  console.log("No demo users or sample lost-and-found items were created.");
}

if (require.main === module) {
  seed()
    .catch((error: unknown) => {
      console.error(
        "Seed failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
