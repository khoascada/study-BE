# Phase 1 — Security & Core Middleware

## Mục tiêu phase này

Thiết lập "vành đai" bảo vệ app: security headers, CORS có whitelist, rate-limit cơ bản, và global error handler để app không bao giờ crash hay leak stack trace ra client. Đây là tiền đề bắt buộc trước khi làm auth hoàn chỉnh.

## Checklist

- [ ] **Helmet**
  - **Ý nghĩa**: Middleware tự động set các HTTP security headers (Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, ...).
  - **Vì sao cần**: Chống các attack vector phổ biến (clickjacking, MIME sniffing, XSS) bằng header config — gần như free.
  - **Lib gợi ý**: `helmet`. Standard cho Express, không có alternative.
  - **Wire vào đâu**: `src/index.ts`, mount sớm trong middleware chain, trước routes.

- [ ] **CORS với whitelist**
  - **Ý nghĩa**: CORS = Cross-Origin Resource Sharing. Whitelist = chỉ origin trong danh sách được phép gọi API, thay vì `*`.
  - **Vì sao cần**: `*` cho phép bất kỳ website nào gọi API → nguy hiểm khi dùng cookie auth (CSRF). Whitelist origin cụ thể an toàn hơn.
  - **Lib gợi ý**: `cors` (Express middleware standard). Đọc env để lấy whitelist origin.
  - **Wire vào đâu**: `src/index.ts`, mount sau Helmet, trước routes.

- [ ] **express-rate-limit (memory store tạm)**
  - **Ý nghĩa**: Giới hạn số request từ 1 IP trong 1 cửa sổ thời gian (vd 100 req/15min).
  - **Vì sao cần**: Chống brute-force (đặc biệt login), abuse, DoS đơn giản.
  - **Lib gợi ý**: `express-rate-limit`. Phase này dùng memory store, Phase 3 sẽ chuyển sang Redis store khi có Redis.
  - **Wire vào đâu**: `src/index.ts` cho rate-limit global. Riêng route `/login`, `/register` cần limit chặt hơn — apply ngay tại router.

- [ ] **Request ID middleware**
  - **Ý nghĩa**: Mỗi request gắn 1 ID duy nhất (nanoid hoặc uuid v7), gắn vào `req.id` và response header `X-Request-Id`.
  - **Vì sao cần**: Khi user báo lỗi, dùng request ID tra log nhanh. Cũng để correlation log trong distributed system sau này.
  - **Lib gợi ý**: `nanoid` (nhẹ) hoặc `uuid` v7 (sortable theo time). Tự viết middleware đơn giản, không cần lib middleware riêng.
  - **Wire vào đâu**: `src/middlewares/request-id.middleware.ts`. Mount đầu tiên trong chain để log/error handler dùng được.

- [ ] **Custom `AppError` class + error hierarchy**
  - **Ý nghĩa**: Class kế thừa `Error` với thêm field `statusCode`, `code`, `details`. Tạo subclass cho từng loại (`NotFoundError`, `UnauthorizedError`, `ValidationError`, ...).
  - **Vì sao cần**: Throw error có ngữ nghĩa từ service, error handler map sang HTTP status code chuẩn. Tránh `throw new Error('user not found')` rồi check string ở chỗ khác.
  - **Lib gợi ý**: Không cần lib, tự viết. Có thể tham khảo `http-errors` cho idea.
  - **Wire vào đâu**: `src/utils/errors.ts`. Service layer throw, error handler bắt.

- [ ] **Global error handler middleware**
  - **Ý nghĩa**: Middleware 4-arg `(err, req, res, next)` ở cuối chain. Bắt mọi error từ async controller/service và trả response chuẩn.
  - **Vì sao cần**: Tránh lặp try-catch ở mọi controller. Đảm bảo response error có shape thống nhất. Không leak stack trace ra client ở production.
  - **Lib gợi ý**: Tự viết. Cần helper `asyncHandler` wrap async controller để forward error sang `next(err)` (Express 5 hỗ trợ tự động, Phase này nếu vẫn cần thì viết).
  - **Wire vào đâu**: `src/middlewares/error.middleware.ts`. Mount sau cùng trong `src/index.ts`, sau routes.

- [ ] **404 handler**
  - **Ý nghĩa**: Middleware bắt mọi request không match route nào và trả 404 với shape chuẩn.
  - **Vì sao cần**: Express mặc định trả HTML 404 — không phù hợp với JSON API. Cần response JSON nhất quán.
  - **Lib gợi ý**: Không cần lib.
  - **Wire vào đâu**: `src/middlewares/not-found.middleware.ts`. Mount sau routes, trước error handler.

- [ ] **Response wrapper chuẩn**
  - **Ý nghĩa**: Mọi response success/error có shape thống nhất, vd `{ success: true, data, meta }` hoặc `{ success: false, error: { code, message, details } }`.
  - **Vì sao cần**: Frontend xử lý response dễ và nhất quán. Đặc biệt quan trọng khi viết doc API và SDK client.
  - **Lib gợi ý**: Không cần lib, tự viết helper `sendSuccess(res, data)` và để error handler tự format error response.
  - **Wire vào đâu**: `src/utils/response.ts`. Refactor controllers dùng helper này.

## Sau phase này

App có security headers, CORS whitelist, rate-limit cơ bản, mọi error đều trả JSON shape chuẩn không leak stack trace, request có ID để tra log. Sẵn sàng làm Phase 2 — auth hoàn thiện trên nền tảng an toàn này.
