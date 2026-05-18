import redis from "@/config/redis";

async function main() {
  await redis.connect();

  // SET key với TTL 10 giây
  await redis.setex("test:greetingssss", 600, "Hello from Redis!");

  // GET key
  const value = await redis.get("test:greetingssss");
  console.log("GET test:greetingssss →", value);

  // TTL còn lại
  const ttl = await redis.ttl("test:greetingssss");
  console.log("TTL remaining →", ttl, "seconds");

  // SET object (serialize JSON thủ công)
  await redis.setex("test:user", 600, JSON.stringify({ id: 1, name: "Khoa" }));
  const raw = await redis.get("test:user");
  console.log("GET test:user →", raw ? JSON.parse(raw) : null);

  // EXISTS
  const exists = await redis.exists("test:greetingssss");
  console.log("EXISTS test:greetings →", exists); // 1 = có, 0 = không

  // DEL
  // await redis.del("test:greeting");
  // const afterDel = await redis.get("test:greeting");
  // console.log("After DEL, GET test:greeting →", afterDel); // null

  await redis.quit();
}

main().catch(console.error);
