# Reference — Structure & Config

Cheat-sheet về folder convention, env config, và Prisma best practices.

---

## Folder convention chuẩn cho Express + Prisma

```
src/
├── config/         ← env, logger, redis, prisma client singleton
├── constants/      ← enums, magic values (roles, error codes, cache keys)
├── controllers/    ← parse req, gọi service, format res — KHÔNG chứa business logic
├── services/       ← business logic, orchestration giữa nhiều repository
├── repositories/   ← chỉ chứa Prisma query, không có logic
├── schemas/        ← Zod schema cho validation input
├── dtos/           ← TypeScript type cho input (infer Zod) + output
├── mappers/        ← function thuần Entity → DTO
├── middlewares/    ← Express middleware (auth, validate, error, ...)
├── routes/         ← register endpoint, gắn middleware
├── utils/          ← helper dùng chung (response, pagination, errors)
├── jobs/           ← BullMQ queue + worker (nếu có)
├── events/         ← event emitter / pub-sub handler (nếu có)
├── types/          ← global type augmentation (vd extend Express Request)
├── openapi/        ← OpenAPI registry và schema components
├── app.ts          ← export Express app (không listen)
└── index.ts        ← import app + listen + bootstrap (DB, Redis)
```

**Bẫy thường gặp**:

- Đặt business logic trong controller → khó test, khó tái sử dụng. Controller phải mỏng.
- Service gọi trực tiếp Prisma → khó mock test, kéo Prisma vào mọi nơi.
- Trộn DTO và Entity → response trả nhầm field nhạy cảm.

---

## Environment config

### Pattern Zod-validated env

- **Khái niệm**: Định nghĩa Zod schema cho `process.env`, parse 1 lần lúc khởi động, export object `env` typed.
- **Khi nào dùng**: Mọi project Node. Bắt buộc cho project lớn hơn demo.
- **Lib**: Zod (đã có) — không cần thêm `envalid`.
- **Bẫy thường gặp**:
  - Đọc `process.env.X` rải rác → khó biết app cần env nào.
  - Quên handle env optional vs required → app crash giữa chừng thay vì lúc start.
  - Để default value cho `JWT_SECRET` trong code → nguy hiểm nếu deploy quên set.

### Config object pattern

- **Khái niệm**: Gom config thành object phân nhóm: `{ db: {...}, redis: {...}, jwt: {...}, app: {...} }`.
- **Khi nào dùng**: Khi có >10 env vars hoặc cần phân nhóm rõ.
- **Bẫy thường gặp**: Đẩy logic vào config object (vd gọi `getRedisClient()`). Config nên là **data thuần**.

---

## Prisma best practices

### Transaction

- **Khái niệm**: `prisma.$transaction([...])` cho batch operation atomic. Interactive transaction `$transaction(async (tx) => {...})` cho logic phức tạp.
- **Khi nào dùng**: Multi-step mutation cần all-or-nothing (vd tạo user + tạo profile).
- **Bẫy thường gặp**: Lồng transaction trong transaction → deadlock. Gọi external API trong transaction → giữ lock lâu, timeout.

### Soft delete

- **Khái niệm**: Field `deletedAt: DateTime?`. Query mặc định filter `deletedAt IS NULL`.
- **Khi nào dùng**: Resource cần recoverable (User, Order). Không dùng cho data tạm.
- **Lib**: Prisma chưa native — dùng `$extends` để inject filter tự động.
- **Bẫy thường gặp**: Unique constraint không tự exclude soft-deleted record. Cần dùng partial index hoặc check trong app.

### Migration workflow

- **Khái niệm**: `prisma migrate dev` ở dev (tạo migration + apply). `prisma migrate deploy` ở production (chỉ apply, không tạo).
- **Bẫy thường gặp**:
  - Sửa migration đã apply → hỏng history. Luôn tạo migration mới để fix.
  - Quên commit thư mục `prisma/migrations/`.
  - Không có rollback strategy cho migration breaking (vd drop column).

### Seed

- **Khái niệm**: Script `prisma/seed.ts` chạy bằng `prisma db seed` để populate data dev/test.
- **Khi nào dùng**: Reset DB local. Setup data cố định (roles, categories).
- **Bẫy thường gặp**: Seed chạy ở production → ghi đè/nhân data. Nên có guard bằng env (`NODE_ENV !== 'production'`).

### N+1 query

- **Khái niệm**: Query 1 list → loop call query cho mỗi item → N+1 query. Fix: dùng `include` hoặc `select` để eager load.
- **Khi nào quan tâm**: Mọi endpoint trả list có nested data.
- **Lib**: Prisma có `include` built-in. Cho query phức tạp dùng `$queryRaw` nhưng mất type safety.
- **Bẫy thường gặp**: `include` quá nhiều level → query DB nặng. Cân bằng giữa N+1 và over-fetch.

### Connection pool

- **Khái niệm**: Prisma quản lý pool connection đến DB. Mặc định `num_physical_cpus * 2 + 1`.
- **Khi nào tune**: Production traffic cao hoặc DB hosted có limit connection (vd Supabase free tier).
- **Bẫy thường gặp**: Tạo nhiều Prisma client → mỗi cái có pool riêng → bùng connection. Luôn dùng singleton.
