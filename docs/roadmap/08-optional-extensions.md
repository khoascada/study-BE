# Phase 8 — Optional Extensions

## Mục tiêu phase này

Các tính năng mở rộng theo nhu cầu cụ thể của feature. Không phải mọi project đều cần — chỉ làm khi gặp use case. Mục đích phase này là biết **khi nào cần dùng** và **dùng lib nào**.

## Checklist

- [ ] **Background jobs với BullMQ**
  - **Ý nghĩa**: Queue chạy task async sau request (gửi email, xử lý ảnh, gọi API ngoài, generate report). Worker process tách biệt với web process.
  - **Vì sao cần**: HTTP request không nên đợi task chậm (vd send email 2s) — user perceive lag. Đưa vào queue → response nhanh, worker xử lý sau.
  - **Lib gợi ý**: **BullMQ** — standard cho Node + Redis, có retry, repeat, delay, priority. Alternative `agenda` (MongoDB-based).
  - **Wire vào đâu**: Cần Redis (Phase 3). Tạo `src/jobs/` chứa queue + worker definitions. `src/index.ts` start worker process (hoặc tách process riêng).

- [ ] **File upload**
  - **Ý nghĩa**: Endpoint nhận multipart/form-data, lưu file vào local disk hoặc S3-compatible storage (AWS S3, MinIO, Cloudflare R2).
  - **Vì sao cần**: Upload avatar, document, image. Production luôn cần.
  - **Lib gợi ý**: `multer` (parse multipart). Với S3: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`. Skeleton dùng local disk, abstract qua interface để swap S3 sau.
  - **Wire vào đâu**: `src/services/storage.service.ts` với interface `IStorage` (uploadFile/deleteFile/getUrl). Implementation `LocalStorage` và `S3Storage`. Endpoint riêng dùng multer middleware.

- [ ] **Email service (skeleton)**
  - **Ý nghĩa**: Service gửi email qua SMTP hoặc provider (SendGrid, AWS SES, Resend). Skeleton = interface + 1 implementation mock (log ra console).
  - **Vì sao cần**: Password reset, email verification, notification. Mock ở dev, swap real provider ở production.
  - **Lib gợi ý**: `nodemailer` (SMTP universal). Resend SDK cho dev experience tốt. Provider nào cũng được, abstract qua interface.
  - **Wire vào đâu**: `src/services/email.service.ts`. Implement `IEmailService` với `MockEmailService` (log) và `SmtpEmailService`. Gọi từ password reset/email verify flow (Phase 2).

- [ ] **Webhook handler pattern**
  - **Ý nghĩa**: Endpoint nhận webhook từ service ngoài (Stripe, GitHub, ...). Cần verify signature, idempotency check, fast response.
  - **Vì sao cần**: Webhook là cách standard tích hợp với SaaS. Xử lý sai dễ dẫn đến double-process hoặc miss event.
  - **Lib gợi ý**: Không cần lib chung. Mỗi provider có SDK riêng để verify signature. Pattern: verify → enqueue job (BullMQ) → response 200 ngay → worker xử lý async.
  - **Wire vào đâu**: `src/routes/webhook.router.ts`. Mỗi provider 1 endpoint riêng `/webhook/stripe`, `/webhook/github`.

- [ ] **WebSocket / SSE**
  - **Ý nghĩa**: Realtime communication. WebSocket = full duplex, dùng cho chat/collaboration. SSE (Server-Sent Events) = 1 chiều server→client, đơn giản hơn, dùng cho notification.
  - **Vì sao cần**: Polling tốn resource, latency cao. Realtime cho UX tốt với feature như notification, live update.
  - **Lib gợi ý**: WebSocket: `socket.io` (auto fallback, room, namespace) hoặc `ws` (lightweight, low-level). SSE: native Express response, không cần lib.
  - **Wire vào đâu**: Scale cần Redis adapter cho Socket.io (Phase 3 đã có Redis pub/sub). Tách process WebSocket riêng nếu traffic lớn.

- [ ] **i18n (internationalization)**
  - **Ý nghĩa**: Trả response message theo locale của user (vd `Accept-Language: vi` → message tiếng Việt).
  - **Vì sao cần**: App phục vụ user nhiều ngôn ngữ. Sai locale → UX kém.
  - **Lib gợi ý**: `i18next` + `i18next-fs-backend`. Khá nặng cho dự án nhỏ — cân nhắc tự viết key-value map cho 2-3 ngôn ngữ.
  - **Wire vào đâu**: Middleware parse `Accept-Language` → attach `req.locale`. Error/response helper lookup message theo locale.

- [ ] **Soft delete**
  - **Ý nghĩa**: Thay vì `DELETE FROM users WHERE id = X`, set `deletedAt = now()`. Mọi query mặc định lọc `deletedAt IS NULL`.
  - **Vì sao cần**: Recover data khi xoá nhầm. Audit history. Một số resource (Order, Payment) tuyệt đối không nên hard delete.
  - **Lib gợi ý**: Prisma chưa hỗ trợ soft delete native (đang propose). Workaround: middleware `prisma.$extends` để inject filter. Hoặc explicit ở mọi query.
  - **Wire vào đâu**: Thêm `deletedAt: DateTime?` vào model cần soft delete. Tạo helper / extension Prisma client.

- [ ] **Audit log**
  - **Ý nghĩa**: Log mọi action thay đổi data quan trọng vào bảng `AuditLog` (ai, làm gì, khi nào, on resource nào).
  - **Vì sao cần**: Compliance (GDPR, SOC2). Debug khi có dispute "ai sửa cái này". Detect abuse pattern.
  - **Lib gợi ý**: Tự viết. Có thể tự động qua Prisma middleware để hook vào mọi mutation.
  - **Wire vào đâu**: Model `AuditLog` trong Prisma schema. Helper hook vào service layer hoặc Prisma extension.

## Sau phase này

Project có toolkit đầy đủ cho mọi feature thường gặp. Pick & choose theo nhu cầu — không cần làm hết. Đây là điểm dừng của roadmap. Sau đó là học sâu hơn từng mảng (vd performance tuning, distributed system pattern, microservices) — đã ngoài scope BE basic.
