import { PrismaClient } from "@prisma/client";
import { createHash } from "~/utils/encryption";
import { ClothType, Color, Gender, Size, TargetAudience } from "~/utils/enums";

const db = new PrismaClient();

async function cleanup() {
  console.time("🧹 Cleaned up the database...");

  await db.cartItem.deleteMany();
  await db.payment.deleteMany();
  await db.delivery.deleteMany();
  await db.order.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.employeeRegistrationRequest.deleteMany();
  await db.employee.deleteMany();
  await db.customer.deleteMany();
  await db.admin.deleteMany();

  console.timeEnd("🧹 Cleaned up the database...");
}

async function createAdmin() {
  console.time("👤 Created admin...");

  await db.admin.create({
    data: {
      firstName: "Emily",
      lastName: "Johnson",
      email: "admin@app.com",
      street: "123 Admin Street",
      city: "San Francisco",
      state: "CA",
      zipcode: "94102",
      dob: new Date("1985-07-12"),
      password: await createHash("password"),
      phoneNo: "1234567890",
      gender: Gender.FEMALE,
      commission: 0.0,
    },
  });

  console.timeEnd("👤 Created admin...");
}

async function createEmployees() {
  console.time("👨‍💼 Created employees...");

  await db.employee.create({
    data: {
      firstName: "Michael",
      lastName: "Smith",
      email: "employee@app.com",
      password: await createHash("password"),
      street: "456 Employee Lane",
      city: "San Francisco",
      state: "CA",
      zipcode: "94103",
      dob: new Date("1980-03-15"),
      phoneNo: "1234567890",
      ssn: "123-45-6789",
      gender: Gender.MALE,
    },
  });

  console.timeEnd("👨‍💼 Created employees...");
}

async function createCustomers() {
  console.time("👥 Created customers...");

  await db.customer.create({
    data: {
      firstName: "John",
      lastName: "Doe",
      email: "customer@app.com",
      password: await createHash("password"),
      street: "101 Customer Drive",
      city: "San Francisco",
      state: "CA",
      zipcode: "94105",
      dob: new Date("2000-05-10"),
      phoneNo: "1234567890",
      gender: Gender.MALE,
    },
  });

  console.timeEnd("👥 Created customers...");
}

async function createCategories() {
  console.time("📑 Created categories...");

  const categories = [
    { name: "Men's Wear" },
    { name: "Women's Wear" },
    { name: "Kids' Wear" },
    { name: "T-Shirts" }, // Added T-Shirts category
  ];

  for (const category of categories) {
    await db.category.create({
      data: category,
    });
  }

  console.timeEnd("📑 Created categories...");
}

async function createProducts() {
  console.time("👕 Created products...");

  const mensCategory = await db.category.findFirst({
    where: { name: "Men's Wear" },
  });
  const womensCategory = await db.category.findFirst({
    where: { name: "Women's Wear" },
  });
  const kidsCategory = await db.category.findFirst({
    where: { name: "Kids' Wear" },
  });
  const tshirtCategory = await db.category.findFirst({
    where: { name: "T-Shirts" },
  });

  if (!mensCategory || !womensCategory || !kidsCategory || !tshirtCategory) {
    throw new Error("Required categories not found");
  }

  // Men's Products
  const menProducts = [
    {
      name: "Classic Cotton T-Shirt",
      description: "Comfortable cotton t-shirt for everyday wear",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      type: ClothType.COTTON,
      categoryId: mensCategory.id,
      variants: [
        {
          size: Size.MEDIUM,
          color: Color.BLACK,
          price: 29.99,
          quantity: 100,
          targetAudience: TargetAudience.MEN,
        },
        {
          size: Size.LARGE,
          color: Color.WHITE,
          price: 49.99,
          quantity: 100,
          targetAudience: TargetAudience.MEN,
        },
      ],
    },
    {
      name: "Formal Business Shirt",
      description: "Professional cotton-blend shirt for office wear",
      image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800",
      type: ClothType.COTTON,
      categoryId: mensCategory.id,
      variants: [
        {
          size: Size.MEDIUM,
          color: Color.BLUE,
          price: 49.99,
          quantity: 75,
          targetAudience: TargetAudience.MEN,
        },
        {
          size: Size.LARGE,
          color: Color.WHITE,
          price: 69.99,
          quantity: 75,
          targetAudience: TargetAudience.MEN,
        },
      ],
    },
  ];

  // Women's Products
  const womenProducts = [
    {
      name: "Summer Floral Dress",
      description: "Light and breezy floral dress perfect for summer",
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800",
      type: ClothType.COTTON,
      categoryId: womensCategory.id,
      variants: [
        {
          size: Size.SMALL,
          color: Color.PINK,
          price: 29.99,
          quantity: 50,
          targetAudience: TargetAudience.WOMEN,
        },
        {
          size: Size.MEDIUM,
          color: Color.BLUE,
          price: 39.99,
          quantity: 50,
          targetAudience: TargetAudience.WOMEN,
        },
      ],
    },
    {
      name: "Yoga Leggings",
      description: "High-performance stretch leggings for yoga and workout",
      image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800",
      type: ClothType.COTTON,
      categoryId: womensCategory.id,
      variants: [
        {
          size: Size.SMALL,
          color: Color.BLACK,
          price: 39.99,
          quantity: 100,
          targetAudience: TargetAudience.WOMEN,
        },
        {
          size: Size.MEDIUM,
          color: Color.GRAY,
          price: 49.99,
          quantity: 100,
          targetAudience: TargetAudience.WOMEN,
        },
      ],
    },
  ];

  // Kids' Products
  const kidsProducts = [
    {
      name: "Cartoon Print T-Shirt",
      description: "Fun and colorful t-shirt with cartoon prints",
      image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800",
      type: ClothType.COTTON,
      categoryId: kidsCategory.id,
      variants: [
        {
          size: Size.SMALL,
          color: Color.YELLOW,
          price: 19.99,
          quantity: 80,
          targetAudience: TargetAudience.KIDS,
        },
        {
          size: Size.MEDIUM,
          color: Color.RED,
          price: 29.99,
          quantity: 80,
          targetAudience: TargetAudience.KIDS,
        },
      ],
    },
    {
      name: "School Uniform Set",
      description: "Complete school uniform set with shirt and pants",
      image: "https://images.unsplash.com/photo-1621452773781-0f992fd1f5cb?w=800",
      type: ClothType.COTTON,
      categoryId: kidsCategory.id,
      variants: [
        {
          size: Size.SMALL,
          color: Color.WHITE,
          price: 45.99,
          quantity: 60,
          targetAudience: TargetAudience.KIDS,
        },
        {
          size: Size.MEDIUM,
          color: Color.BLUE,
          price: 55.99,
          quantity: 60,
          targetAudience: TargetAudience.KIDS,
        },
      ],
    },
  ];

  // Unisex T-Shirts
  const unisexTshirts = [
    {
      name: "Graphic Print T-Shirt",
      description: "Modern graphic print t-shirt for all",
      image: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800",
      type: ClothType.COTTON,
      categoryId: tshirtCategory.id,
      variants: [
        {
          size: Size.SMALL,
          color: Color.WHITE,
          price: 24.99,
          quantity: 120,
          targetAudience: TargetAudience.UNISEX,
        },
        {
          size: Size.MEDIUM,
          color: Color.BLACK,
          price: 34.99,
          quantity: 120,
          targetAudience: TargetAudience.UNISEX,
        },
        {
          size: Size.LARGE,
          color: Color.GRAY,
          price: 44.99,
          quantity: 120,
          targetAudience: TargetAudience.UNISEX,
        },
      ],
    },
  ];

  const allProducts = [...menProducts, ...womenProducts, ...kidsProducts, ...unisexTshirts];

  for (const productData of allProducts) {
    const { variants, ...productInfo } = productData;
    const product = await db.product.create({
      data: productInfo,
    });

    await db.productVariant.createMany({
      data: variants.map((variant) => ({
        ...variant,
        productId: product.id,
      })),
    });
  }

  console.timeEnd("👕 Created products...");
}

async function seed() {
  console.log("🌱 Seeding...\n");

  console.time("🌱 Database has been seeded");

  await cleanup();
  await createAdmin();
  await createEmployees();
  await createCustomers();
  await createCategories();
  await createProducts();

  console.timeEnd("🌱 Database has been seeded");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
