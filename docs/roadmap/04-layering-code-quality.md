# Phase 4 — Layering & Code Quality

## Mục tiêu phase này

Củng cố kiến trúc code: tách Prisma khỏi service (repository pattern), tách input/output type khỏi entity (DTO), gom helper dùng chung (pagination, mapper). Phase này không thêm feature, mà làm code **dễ test, dễ thay đổi, dễ scale team**.

## Checklist

- [ ] **Repository pattern**
  - **Ý nghĩa**: Tạo lớp `*.repository.ts` chỉ chứa Prisma query. Service gọi repository thay vì gọi Prisma trực tiếp.
  - **Vì sao cần**: (1) Service không phụ thuộc Prisma → muốn đổi ORM (ví dụ sang Drizzle) chỉ cần đổi repo. (2) Unit test service dễ — mock repository thay vì mock cả Prisma client. (3) Tập trung query phức tạp vào 1 chỗ thay vì rải khắp service.
  - **Lib gợi ý**: Không cần lib, tự viết class hoặc function module.
  - **Wire vào đâu**: Tạo `src/repositories/` (vd `user.repository.ts`, `product.repository.ts`). Refactor `src/services/` để gọi repo.

- [ ] **DTO (Data Transfer Object) — input & output**
  - **Ý nghĩa**: DTO là shape data đi vào/đi ra qua API, tách khỏi entity DB. Input DTO = body từ request (đã validate). Output DTO = response trả về (lọc field nhạy cảm như `passwordHash`).
  - **Vì sao cần**: (1) Tránh trả nhầm field nhạy cảm. (2) Tách concern: entity DB có thể có nhiều field nội bộ, response không cần show hết. (3) API contract ổn định kể cả khi entity DB thay đổi.
  - **Lib gợi ý**: Tận dụng Zod schema (đã có) — `z.infer<typeof schema>` cho input DTO. Output DTO viết thành type/interface riêng.
  - **Wire vào đâu**: Tạo `src/dtos/`. Hoặc gộp vào `src/schemas/` đã có (Zod schema + DTO type cùng chỗ).

- [ ] **Mapper Entity → DTO**
  - **Ý nghĩa**: Hàm thuần `toUserDto(user: User): UserDto` chuyển entity sang DTO, lọc bỏ field nhạy cảm.
  - **Vì sao cần**: Không lặp code lọc field ở mỗi controller. Đảm bảo nhất quán — mọi response `User` đều cùng shape.
  - **Lib gợi ý**: Không cần lib, hàm thuần. Nếu mapping phức tạp, xem `class-transformer` nhưng overkill cho dự án học.
  - **Wire vào đâu**: `src/mappers/` hoặc gộp vào `src/dtos/` cùng DTO type.

- [ ] **Pagination / filter / sort helper dùng chung**
  - **Ý nghĩa**: Helper parse query string (`?page=2&limit=20&sort=createdAt:desc&filter[status]=active`) thành object Prisma hiểu được. Trả response kèm meta `{ page, limit, total, totalPages }`.
  - **Vì sao cần**: Mọi endpoint list đều cần pagination. Viết 1 lần dùng nhiều nơi, đảm bảo convention thống nhất giữa các endpoint.
  - **Lib gợi ý**: Tự viết. Tham khảo cursor-based pagination (`?cursor=xxx`) cho dataset lớn — hiệu năng tốt hơn offset-based.
  - **Wire vào đâu**: `src/utils/pagination.ts`. Apply trong service layer các endpoint list.

- [ ] **Constants & enums tập trung**
  - **Ý nghĩa**: Gom magic string/number (vd role names, error codes, default TTL, max page size) vào file constants/enums.
  - **Vì sao cần**: Đổi value chỉ ở 1 chỗ. Tránh typo (`'ADMIN'` vs `'Admin'`). IDE autocomplete.
  - **Lib gợi ý**: TypeScript `as const` object hoặc `enum`. Khuyên dùng `as const` (tree-shake tốt hơn enum).
  - **Wire vào đâu**: `src/constants/`. Vd `roles.ts`, `error-codes.ts`, `cache-keys.ts`.

- [ ] **Dependency Injection nhẹ (optional)**
  - **Ý nghĩa**: Thay vì `import { authService }` từ singleton, dùng container DI để inject dependency vào class.
  - **Vì sao cần**: Test dễ hơn (inject mock). Quản lý lifecycle (singleton vs request-scoped). Tuy nhiên với dự án nhỏ, singleton + import là đủ — DI có thể là over-engineering.
  - **Lib gợi ý**: `tsyringe` (Microsoft, nhẹ) hoặc `awilix` (mature, đa style). NestJS có DI built-in nhưng đó là framework khác.
  - **Wire vào đâu**: Áp dụng dần, bắt đầu từ service layer. **Khuyên skip ở dự án học** trừ khi muốn học DI pattern cụ thể.

## Sau phase này

Code base có layering rõ ràng: routes → controllers → services → repositories → Prisma. Input/output type tách bạch khỏi entity DB. Có helper chung cho pagination, mapping. Sẵn sàng cho Phase 5 — observability.
