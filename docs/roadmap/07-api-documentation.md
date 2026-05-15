# Phase 7 — API Documentation

## Mục tiêu phase này

Tự động sinh tài liệu API từ Zod schema đã có — không phải viết doc tay (sẽ outdate). Frontend/team khác có giao diện Swagger UI để khám phá API. Đây là "interface" chính thức giữa BE và phần còn lại.

## Checklist

- [ ] **OpenAPI generate từ Zod**
  - **Ý nghĩa**: Convert Zod schema (đã có ở `src/schemas/`) thành OpenAPI 3 specification (JSON/YAML). OpenAPI là tiêu chuẩn mô tả REST API.
  - **Vì sao cần**: Tránh duplicate: schema validate input + schema mô tả API là 2 thứ giống nhau → phải đồng bộ. Generate từ Zod đảm bảo doc luôn match validation thật.
  - **Lib gợi ý**: `@asteasolutions/zod-to-openapi` — phổ biến nhất hiện tại. Alternative: `zod-openapi`.
  - **Wire vào đâu**: `src/openapi/` chứa registry. Extend Zod schema với `.openapi({...})` để bổ sung metadata (description, example).

- [ ] **Swagger UI**
  - **Ý nghĩa**: Giao diện web hiển thị OpenAPI spec — list endpoint, click vào xem chi tiết, "Try it out" gọi thử API.
  - **Vì sao cần**: Frontend dev / QA dùng để hiểu API mà không cần đọc code. Là tài liệu sống — đổi schema → UI tự update.
  - **Lib gợi ý**: `swagger-ui-express` — standard. Alternative: `redoc-express` (UI đẹp hơn, ít interactive hơn).
  - **Wire vào đâu**: Endpoint `/docs` mount Swagger UI từ OpenAPI spec. Chỉ enable ở dev/staging, tắt ở production (hoặc đặt sau auth).

- [ ] **Tag theo resource**
  - **Ý nghĩa**: OpenAPI cho phép gom endpoint theo tag (vd `Auth`, `User`, `Product`). Swagger UI hiển thị theo group tag.
  - **Vì sao cần**: API lớn 50+ endpoint → list phẳng khó đọc. Group giúp navigate nhanh.
  - **Lib gợi ý**: Built-in của OpenAPI, set tag khi register route.
  - **Wire vào đâu**: Tại nơi register endpoint vào OpenAPI registry, pass field `tags: ['Auth']`.

- [ ] **Response shape convention**
  - **Ý nghĩa**: Doc rõ shape response success/error chuẩn (đã thiết kế ở Phase 1) — định nghĩa 1 lần làm "schema component" và reference từ mọi endpoint.
  - **Vì sao cần**: Tránh viết shape response lặp lại ở mỗi endpoint. Frontend biết format chung để viết error handler.
  - **Lib gợi ý**: OpenAPI `components.schemas` — reusable schema reference.
  - **Wire vào đâu**: `src/openapi/components.ts` định nghĩa schema common (`SuccessResponse`, `ErrorResponse`, `PaginationMeta`).

- [ ] **Error code table**
  - **Ý nghĩa**: Bảng liệt kê các error code app trả về (`USER_NOT_FOUND`, `INVALID_CREDENTIALS`, `RATE_LIMIT_EXCEEDED`, ...) kèm HTTP status và mô tả.
  - **Vì sao cần**: Frontend handle error theo code (machine-readable) thay vì message (UI-readable). Doc giúp align code giữa BE và FE.
  - **Lib gợi ý**: Có thể là trang riêng trong Swagger UI (qua custom HTML) hoặc 1 file markdown.
  - **Wire vào đâu**: Constants từ Phase 4 (`src/constants/error-codes.ts`) → generate markdown table hoặc embed vào OpenAPI description.

- [ ] **Example request/response**
  - **Ý nghĩa**: Mỗi endpoint kèm 1-2 example body/response cụ thể.
  - **Vì sao cần**: Đọc schema khô khan, đọc example nhanh hiểu. Đặc biệt cho input phức tạp (nested object).
  - **Lib gợi ý**: OpenAPI `examples` field. Zod-to-openapi cho phép pass example qua `.openapi({ example: ... })`.
  - **Wire vào đâu**: Khi định nghĩa schema Zod, thêm `.openapi({ example: {...} })`.

- [ ] **Postman / Insomnia collection (optional)**
  - **Ý nghĩa**: Export collection để team dùng Postman test API.
  - **Vì sao cần**: Một số dev quen Postman hơn Swagger UI. Collection có thể commit vào repo cho version control.
  - **Lib gợi ý**: OpenAPI spec import được vào Postman trực tiếp — không cần export collection riêng. Hoặc `openapi-to-postman`.
  - **Wire vào đâu**: Optional. Skip nếu Swagger UI đủ dùng.

## Sau phase này

API có tài liệu sống auto-generated từ Zod, Swagger UI cho FE/QA dùng, error codes có bảng tra. Backend đã đủ chuẩn để hand-off cho team khác. Phase 8 là optional extensions tuỳ feature cụ thể.
