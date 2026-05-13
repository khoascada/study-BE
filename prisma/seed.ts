import prisma from '../src/prisma';

async function main() {
  console.log("Seeding data...");

  // Xoá dữ liệu cũ theo thứ tự đúng để tránh lỗi khoá ngoại
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. Tạo 10 Users
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}_${Date.now()}@example.com`,
        name: `User ${i}`,
        age: 20 + Math.floor(Math.random() * 30), // Random tuổi 20-50
        address: `Địa chỉ số ${i}, Phố X, Thành phố Y`,
      },
    });
    users.push(user);
  }
  console.log("Created 10 users.");

  // 2. Tạo 10 Categories
  const categories = [];
  for (let i = 1; i <= 10; i++) {
    const category = await prisma.category.create({
      data: {
        name: `Category ${i} - ${Date.now()}`,
        description: `Mô tả chi tiết cho danh mục ${i}`,
      },
    });
    categories.push(category);
  }
  console.log("Created 10 categories.");

  // 3. Tạo 10 Products
  const products = [];
  for (let i = 1; i <= 10; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomCategory1 = categories[Math.floor(Math.random() * categories.length)];
    const randomCategory2 = categories[Math.floor(Math.random() * categories.length)];
    const categoryIds = [...new Set([randomCategory1.id, randomCategory2.id])].map(id => ({ id }));

    const product = await prisma.product.create({
      data: {
        name: `Product ${i}`,
        price: Math.floor(Math.random() * 100) * 1000 + 10000, 
        stock: Math.floor(Math.random() * 50) + 1, // Random tồn kho 1-50
        description: `Mô tả sản phẩm ${i} tuyệt vời`,
        isActive: Math.random() > 0.2, // 80% là active
        userId: randomUser.id,
        categories: {
          connect: categoryIds
        }
      },
    });
    products.push(product);
  }
  console.log("Created 10 products.");

  // 4. Tạo 10 Orders
  const orderStatuses = ["pending", "completed", "cancelled"];
  for (let i = 1; i <= 10; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    
    await prisma.order.create({
      data: {
        quantity: Math.floor(Math.random() * 5) + 1, // Mua 1-5 sản phẩm
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        userId: randomUser.id,
        productId: randomProduct.id,
      }
    });
  }
  console.log("Created 10 orders.");

  // 5. Tạo 10 Reviews
  for (let i = 1; i <= 10; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    
    await prisma.review.create({
      data: {
        rating: Math.floor(Math.random() * 5) + 1, // Đánh giá 1-5 sao
        comment: `Sản phẩm này rất tốt, đánh giá lần thứ ${i}!`,
        userId: randomUser.id,
        productId: randomProduct.id,
      }
    });
  }
  console.log("Created 10 reviews.");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
