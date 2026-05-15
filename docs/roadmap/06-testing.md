# Phase 6 — Testing

## Mục tiêu phase này

Thiết lập hạ tầng test để code change không breaking thứ khác. Tập trung vào integration test (gọi qua HTTP, hit DB thật) — kiểu test ROI cao nhất cho BE — bổ sung unit test cho logic phức tạp.

## Checklist

- [ ] **Test runner: Vitest**
  - **Ý nghĩa**: Framework chạy test, có expect/describe/it API, mock, snapshot, coverage.
  - **Vì sao cần**: Là nền tảng để viết test. Vitest nhanh hơn Jest đáng kể, ESM-friendly, TypeScript out-of-box (không cần babel/ts-jest).
  - **Lib gợi ý**: **Vitest** — recommended. Jest vẫn là standard nhưng setup TypeScript phức tạp hơn. Node có `node:test` built-in nhưng API còn nghèo.
  - **Wire vào đâu**: `vitest.config.ts` ở root. Script `test` trong `package.json`.

- [ ] **Supertest cho HTTP integration test**
  - **Ý nghĩa**: Lib gửi HTTP request đến Express app (không cần start server thật) và assert response.
  - **Vì sao cần**: Test endpoint thật — verify routing, middleware chain, validation, response shape. Đây là kiểu test giá trị cao nhất cho BE API.
  - **Lib gợi ý**: `supertest` — standard. Không có alternative đáng kể.
  - **Wire vào đâu**: Cần export Express `app` riêng (không tự `listen`) trong `src/app.ts`. `src/index.ts` import `app` và listen. Test import `app` và pass cho supertest.

- [ ] **Test database strategy**
  - **Ý nghĩa**: Quyết định cách isolate test khỏi data thật. 3 hướng phổ biến: (1) DB riêng cho test (`prisma-practice-test`), reset trước mỗi test suite. (2) Transaction rollback — mỗi test trong 1 transaction, rollback cuối. (3) Truncate tables trước mỗi test.
  - **Vì sao cần**: Test phải reproducible, không phụ thuộc state từ test khác. Hit DB thật cho test integration là quan trọng (mock Prisma không phát hiện được lỗi migration/query).
  - **Lib gợi ý**: Approach (1) đơn giản nhất cho học. Approach (2) nhanh nhưng tricky với Prisma. Có `prisma-test-environment` nhưng overkill.
  - **Wire vào đâu**: `.env.test` riêng với `DATABASE_URL` test DB. Helper `tests/helpers/db.ts` để reset DB. Setup file Vitest gọi reset trước mỗi suite.

- [ ] **Mock Prisma / Redis cho unit test**
  - **Ý nghĩa**: Unit test service không hit DB thật → mock repository/Prisma client trả data giả. Tương tự mock Redis client.
  - **Vì sao cần**: Unit test nhanh (ms), tách bạch logic service khỏi infrastructure. Integration test mới cần hit thật.
  - **Lib gợi ý**: Vitest có `vi.mock()` built-in. Hoặc `prisma-mock` / tạo mock thuần TypeScript.
  - **Wire vào đâu**: Pattern: service nhận repository qua constructor → test inject mock. Phase 4 (repository pattern) làm cho mục này dễ hơn nhiều.

- [ ] **Cấu trúc folder test**
  - **Ý nghĩa**: Quyết định để test ở đâu — cạnh source (`auth.service.test.ts` cạnh `auth.service.ts`) hay folder riêng (`tests/`).
  - **Vì sao cần**: Convention nhất quán → dễ tìm, IDE plugin chạy tốt. Cạnh source dễ thấy có test cho file đó không. Folder riêng gọn root.
  - **Lib gợi ý**: Không cần lib. Khuyên: unit test cạnh source (`.test.ts`), integration/e2e test trong `tests/integration/`.
  - **Wire vào đâu**: Cấu hình Vitest `include: ['src/**/*.test.ts', 'tests/**/*.test.ts']`.

- [ ] **Test pyramid**
  - **Ý nghĩa**: Tỷ lệ test: nhiều unit test (rẻ, nhanh) → ít integration → rất ít e2e. Hình kim tự tháp.
  - **Vì sao cần**: ROI cao nhất. E2E test đắt, chậm, dễ flaky. Unit test rẻ, nhanh, chính xác về logic nhưng không phát hiện lỗi tích hợp. Cần cả 3 lớp nhưng tỉ lệ khác nhau.
  - **Lib gợi ý**: Không phải lib mà là mindset. Áp dụng khi quyết định "viết test loại nào cho feature này".
  - **Wire vào đâu**: Khi review test plan: logic phức tạp → unit; flow API → integration; chỉ critical flow (login, checkout) → e2e.

- [ ] **Test fixtures & factories**
  - **Ý nghĩa**: Helper tạo data test (vd `createTestUser(overrides)` trả về User đã insert DB). Tránh lặp setup data ở mỗi test.
  - **Vì sao cần**: Test ngắn hơn, đọc dễ. Đổi schema chỉ sửa factory, test không cần đổi.
  - **Lib gợi ý**: `@faker-js/faker` cho data ngẫu nhiên. Tự viết factory thay vì dùng lib factory (vd `fishery`) cho dự án học.
  - **Wire vào đâu**: `tests/factories/`.

- [ ] **Coverage report**
  - **Ý nghĩa**: Đo % code được test cover. Vitest có built-in qua `c8` hoặc `istanbul`.
  - **Vì sao cần**: Biết vùng nào chưa được test. Đừng obsess về 100% — quan tâm vùng critical (auth, payment) có cover không.
  - **Lib gợi ý**: Vitest built-in (`vitest --coverage`).
  - **Wire vào đâu**: Script `test:coverage` trong `package.json`.

## Sau phase này

Có hạ tầng test: chạy `npm test` ra kết quả nhanh, có thể viết test cho mọi layer (controller/service/repository). Tự tin refactor và thêm feature mới. Sẵn sàng cho Phase 7 — API docs.
