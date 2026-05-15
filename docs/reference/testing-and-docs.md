# Reference — Testing & Documentation

Cheat-sheet về test pyramid, OpenAPI, và README convention.

---

## Test pyramid

```
        /\
       /e2e\         ← ít, đắt, chậm, dễ flaky
      /------\
     / integ. \      ← vừa, ROI cao nhất cho BE API
    /----------\
   /   unit     \    ← nhiều, rẻ, nhanh
  /--------------\
```

### Unit test

- **Khái niệm**: Test 1 unit code (function, class) isolation. Mock mọi dependency external.
- **Khi nào dùng**: Logic phức tạp, pure function, util, mapper.
- **Bẫy thường gặp**:
  - Mock quá nhiều → test cái mock, không test code thật.
  - Test implementation thay vì behavior → đổi internal là test break.

### Integration test

- **Khái niệm**: Test nhiều unit phối hợp, hit DB/Redis thật. Với BE API: gọi qua HTTP (supertest) → response.
- **Khi nào dùng**: Mọi endpoint quan trọng. ROI cao nhất cho BE.
- **Lib**: `supertest`.
- **Bẫy thường gặp**:
  - Test phụ thuộc state từ test khác → flaky. Reset DB hoặc transaction rollback.
  - Test chậm vì hit DB → có thể, chấp nhận trade-off. Parallel test cần DB schema riêng cho mỗi worker.

### E2E test

- **Khái niệm**: Test toàn flow user, thường kèm UI. Với BE-only: test chuỗi nhiều endpoint (signup → login → create resource → ...).
- **Khi nào dùng**: Critical flow (auth, payment). Đắt nên hạn chế số lượng.
- **Lib**: Cùng `supertest`/test runner. Hoặc Playwright/Cypress nếu có UI.
- **Bẫy**: Mock external service không nhất quán → false positive/negative.

---

## Test fixtures & factories

### Factory pattern

- **Khái niệm**: Hàm `createUser(overrides)` tạo user test với default sensible, cho override field cụ thể khi cần.
- **Khi nào dùng**: Mọi test cần data setup. Tránh lặp `prisma.user.create(...)` ở mỗi test.
- **Lib**: `@faker-js/faker` cho data ngẫu nhiên. Self-built factory đủ cho hầu hết case.
- **Bẫy thường gặp**:
  - Factory phụ thuộc thứ tự (vd User factory yêu cầu Org tồn tại) → khó dùng. Factory tự tạo cả dependency.
  - Test phụ thuộc data faker random → flaky. Seed faker hoặc dùng deterministic data.

### Fixture vs factory

- **Fixture**: Data tĩnh, load từ file JSON/SQL. Phù hợp data lookup table.
- **Factory**: Data sinh ra mỗi lần. Phù hợp test mutation.
- **Bẫy**: Lạm dụng fixture → khó maintain khi schema đổi. Factory ưu tiên hơn cho BE.

---

## Test database strategy

### Strategy 1: Separate test DB + reset trước mỗi suite

- **Khái niệm**: `.env.test` với `DATABASE_URL` trỏ DB riêng. Trước mỗi test suite chạy migrate + truncate.
- **Pros**: Đơn giản, dễ debug (data còn lại sau test fail).
- **Cons**: Chậm hơn nếu nhiều test.
- **Bẫy**: Dùng nhầm DB dev — luôn check `NODE_ENV === 'test'` trước khi truncate.

### Strategy 2: Transaction rollback per test

- **Khái niệm**: Mỗi test bắt đầu 1 transaction, cuối test rollback. State sạch tự động.
- **Pros**: Rất nhanh.
- **Cons**: Tricky với Prisma — service tạo transaction riêng sẽ phá rollback. Cần inject prisma client với transaction.

### Strategy 3: Truncate trước mỗi test

- **Khái niệm**: `TRUNCATE users, posts, ... CASCADE` trước mỗi test.
- **Pros**: Đơn giản hơn rollback, không phụ thuộc inject pattern.
- **Cons**: Chậm hơn rollback. Phải maintain list bảng truncate.

**Khuyên cho project học**: Strategy 1 (separate DB + reset đầu mỗi file test).

---

## Mock pattern

### Mock Prisma

- **Khái niệm**: Test service không hit DB → mock repository hoặc Prisma client trả data giả.
- **Lib**: Vitest `vi.mock()`, hoặc tự tạo mock module. Có `prisma-mock` package.
- **Bẫy**: Mock không cover edge case của Prisma thật → test pass nhưng prod fail. Vẫn cần integration test layer cao hơn.

### Mock external API

- **Khái niệm**: Khi service gọi API ngoài (Stripe, OpenAI), mock HTTP layer.
- **Lib**: `nock` (HTTP intercept) hoặc `msw` (modern, dùng được cả browser + node).
- **Bẫy**: API thật đổi response shape → mock vẫn pass, prod fail. Định kỳ chạy integration test thật.

---

## Coverage

- **Khái niệm**: % code được test cover (line, branch, function).
- **Khi nào dùng**: Track xu hướng (đang tăng hay giảm). Đặt threshold cho CI fail nếu giảm.
- **Lib**: Vitest built-in (`--coverage`, dùng c8/v8).
- **Bẫy thường gặp**:
  - Obsess 100% → test value thấp (vd test getter). Nhắm 70-80% là tốt cho hầu hết project.
  - Coverage cao nhưng test toàn assertion vô nghĩa → false security.

---

## API Documentation

### OpenAPI (Swagger)

- **Khái niệm**: Spec mô tả REST API theo chuẩn industry. Generate UI và SDK client từ spec.
- **Khi nào dùng**: Mọi public/team-shared API.
- **Lib**:
  - Generate từ code: `@asteasolutions/zod-to-openapi`, `zod-openapi`.
  - Serve UI: `swagger-ui-express` (interactive), `redoc-express` (đẹp, ít interactive).
- **Bẫy thường gặp**:
  - Viết tay → drift với code. Auto-generate luôn ưu tiên.
  - Mỗi endpoint mỗi style → frontend confused. Cần convention (response shape, error code).

### Postman / Insomnia collection

- **Khái niệm**: File JSON chứa collection request. Team dùng để test API tay.
- **Khi nào dùng**: Hỗ trợ thêm Swagger. Một số dev quen Postman hơn.
- **Bẫy**: Maintain song song với OpenAPI → drift. Tốt nhất import từ OpenAPI vào Postman.

### Document structure

Trong project nên có:

- `README.md`: setup, run, link đến doc khác.
- `docs/` folder: doc dài hơn (roadmap, ADR, architecture).
- API doc: Swagger UI ở `/docs` endpoint.
- CHANGELOG.md: history version (nếu library/public API).

---

## README chuẩn cho BE project

Cấu trúc tối thiểu:

1. **Project name + short description** (1 dòng)
2. **Stack** (Node, Express, Prisma, PostgreSQL, Redis) — để dev mới biết nhanh tech gì
3. **Prerequisites** (Node version, PostgreSQL, Redis)
4. **Setup**
   - Clone repo
   - `npm install`
   - Copy `.env.example` → `.env`, điền giá trị
   - `npm run prisma:migrate`
   - `npm run prisma:seed` (nếu có)
5. **Run**
   - Dev: `npm run dev`
   - Test: `npm test`
   - Build: `npm run build`
6. **Project structure** (cây folder + giải thích ngắn)
7. **API documentation** (link tới Swagger UI hoặc OpenAPI spec)
8. **Contributing** (convention commit, branch, PR — nếu nhiều người)
9. **License**

**Bẫy thường gặp**:

- README outdate so với code → dev mới setup fail. Cần update README khi đổi setup.
- Quá dài đọc nản. Doc chi tiết tách ra `docs/`.
- Thiếu phần troubleshoot common issue.
