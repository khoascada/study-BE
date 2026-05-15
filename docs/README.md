# Backend Roadmap — prisma-practice

Bộ tài liệu này hướng dẫn bạn nâng project `prisma-practice` (Express 5 + Prisma + PostgreSQL) lên một backend **chuẩn theo pattern senior**, với mục tiêu **học**, không yêu cầu deploy production.

Tài liệu chia làm 2 phần:

- **`roadmap/`** — Lộ trình thực hiện theo 9 phase tuần tự, mỗi phase 1 file. Đọc và làm theo thứ tự.
- **`reference/`** — Cheat-sheet tra cứu nhanh các khái niệm, gom theo nhóm chủ đề. Đọc khi cần tra cứu.

---

## Hiện trạng project

**Đã có**: Express 5, Prisma 7 + PostgreSQL, models (User/Product/Category/Order/Review), auth register/login/logout với bcryptjs + JWT 7d cookie httpOnly, Zod schemas auth/user, validate middleware, TypeScript strict, layered cơ bản (controllers/services/routes/schemas/middlewares).

**Chưa có**: JWT refresh + blacklist + auth middleware bảo vệ route, Redis, global error handler, logging chuẩn, Helmet/CORS/rate-limit, repository pattern, DTO, testing, API docs, ESLint/Prettier/Husky.

---

## Roadmap — 9 phase

| Phase | File                                                               | Tóm tắt                                                                            |
| ----- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 0     | [00-tooling-hygiene.md](roadmap/00-tooling-hygiene.md)             | ESLint, Prettier, Husky, env validation, path alias — nền tảng trước khi viết code |
| 1     | [01-security-middleware.md](roadmap/01-security-middleware.md)     | Helmet, CORS, rate-limit, request ID, global error handler — "vành đai" bảo vệ app |
| 2     | [02-auth-complete.md](roadmap/02-auth-complete.md)                 | Hoàn thiện JWT (access + refresh), blacklist, auth middleware, RBAC                |
| 3     | [03-redis-caching.md](roadmap/03-redis-caching.md)                 | Redis client, cache-aside, rate-limit store, refresh token store                   |
| 4     | [04-layering-code-quality.md](roadmap/04-layering-code-quality.md) | Repository pattern, DTO, mapper, pagination helper                                 |
| 5     | [05-observability.md](roadmap/05-observability.md)                 | Pino logging, health check, correlation ID                                         |
| 6     | [06-testing.md](roadmap/06-testing.md)                             | Vitest + supertest, test DB strategy                                               |
| 7     | [07-api-documentation.md](roadmap/07-api-documentation.md)         | OpenAPI/Swagger generate từ Zod                                                    |
| 8     | [08-optional-extensions.md](roadmap/08-optional-extensions.md)     | BullMQ jobs, file upload, email, realtime (tuỳ chọn)                               |

### Thứ tự đề xuất

**Bắt buộc làm tuần tự**: Phase 0 → 1 → 2 → 3.

Lý do: tooling (0) tránh phải refactor sau, security middleware (1) là tiền đề để auth chuẩn (2), và auth không hoàn thiện được nếu thiếu Redis (3) cho refresh token store + blacklist.

**Tuỳ nhu cầu sau đó**:

- Nếu muốn code sạch hơn ngay → Phase 4 (layering)
- Nếu muốn debug/monitor dễ hơn → Phase 5 (observability)
- Nếu chuẩn bị viết feature lớn → Phase 6 (testing)
- Nếu cần share API cho FE/team → Phase 7 (docs)
- Phase 8 là optional, làm khi gặp use case cụ thể

---

## Reference — 6 file cheat-sheet

| File                                                         | Nội dung                                             |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| [structure-and-config.md](reference/structure-and-config.md) | Folder convention, env config, Prisma best practices |
| [auth-and-security.md](reference/auth-and-security.md)       | JWT, RBAC/ABAC, security checklist, OWASP            |
| [data-and-caching.md](reference/data-and-caching.md)         | Redis pattern, TTL, rate limit algorithms            |
| [errors-and-logging.md](reference/errors-and-logging.md)     | Error class, async wrapper, log convention           |
| [testing-and-docs.md](reference/testing-and-docs.md)         | Test pyramid, OpenAPI, README chuẩn                  |
| [advanced-topics.md](reference/advanced-topics.md)           | Performance, jobs, realtime, devops tối thiểu        |

---

## Recommended Stack

Đề xuất lib cho từng concern trong project này. Lý do chọn ghi ngắn ở cột cuối.

| Concern          | Lib chọn                                    | Vì sao (vs alternative)                                              |
| ---------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| Logging          | **Pino**                                    | Nhanh hơn Winston (~5x), JSON-first, ecosystem tốt với Express       |
| Validation       | **Zod**                                     | Đã dùng, type-safe, có thể reuse cho OpenAPI                         |
| Redis client     | **ioredis**                                 | Mature, cluster-ready, API tốt hơn `node-redis` cho usecase phức tạp |
| Password hashing | **argon2**                                  | OWASP khuyến nghị, bcryptjs là bcrypt thuần JS chậm, nên đổi         |
| JWT              | **jsonwebtoken**                            | Đã dùng, không cần đổi                                               |
| Testing          | **Vitest + supertest**                      | Vitest nhanh + ESM-friendly, tích hợp tốt với TypeScript hơn Jest    |
| API docs         | **zod-to-openapi + swagger-ui-express**     | Reuse Zod schema, tránh viết doc 2 nơi                               |
| Job queue        | **BullMQ**                                  | Standard cho Node + Redis, hỗ trợ retry/repeat tốt                   |
| Linter           | **ESLint flat config + @typescript-eslint** | Flat config là chuẩn mới của ESLint v9+                              |
| Formatter        | **Prettier**                                | Standard, không có lý do dùng khác                                   |
| Pre-commit       | **Husky + lint-staged**                     | Standard, lint-staged chạy chỉ trên file staged → nhanh              |
| Env validation   | **Zod** (reuse)                             | Không cần thêm lib, tận dụng Zod đã có                               |
| Request ID       | **nanoid** hoặc **uuid v7**                 | nanoid nhẹ hơn, uuid v7 sortable theo thời gian                      |

---

## Quy ước đọc tài liệu

- Mọi mục trong roadmap đều có format: **Ý nghĩa / Vì sao cần / Lib gợi ý / Wire vào đâu** trong project hiện tại.
- Reference có format ngắn hơn: **Khái niệm / Khi nào dùng / Lib / Bẫy thường gặp**.
- Tài liệu không có code snippet — đây là roadmap khái niệm. Khi implement, tự tra docs lib chính thức (đáng tin hơn copy từ tutorial cũ).
