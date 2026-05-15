# Reference — Errors & Logging

Cheat-sheet về error class, validation, log convention, và correlation ID.

---

## Error handling

### Error class hierarchy

- **Khái niệm**: Custom `AppError extends Error` với `statusCode`, `code`, `details`. Subclass cho từng loại: `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`.
- **Khi nào dùng**: Mọi app non-trivial. Cho phép throw có ngữ nghĩa từ service, error handler tự map sang HTTP status.
- **Bẫy thường gặp**:
  - Không extends Error gốc → mất stack trace, instanceof check fail.
  - Throw plain string `throw 'not found'` → mất type, không có stack trace.
  - Để statusCode hard-code trong controller thay vì error class → khó maintain.

### Async handler wrapper

- **Khái niệm**: Hàm bọc async controller, catch error và forward sang `next(err)` cho Express error middleware.
- **Khi nào dùng**: Express 4 (bắt buộc). Express 5 đã hỗ trợ tự động — không cần wrapper.
- **Lib**: `express-async-handler` hoặc tự viết. Project này dùng Express 5 nên SKIP.
- **Bẫy thường gặp**: Quên wrap async controller ở Express 4 → unhandled rejection, app crash.

### Error code convention

- **Khái niệm**: Mỗi loại lỗi có code constant SCREAMING_SNAKE_CASE: `USER_NOT_FOUND`, `INVALID_CREDENTIALS`, `RATE_LIMIT_EXCEEDED`.
- **Khi nào dùng**: Mọi app có FE consume API. FE handle theo code, không parse message.
- **Bẫy thường gặp**:
  - Đổi code khi đã expose ra FE → breaking change. Treat error code như API contract.
  - Code quá generic (`ERROR`) → vô dụng. Code quá specific (`USER_42_NOT_FOUND`) → bùng nổ.

### Error response shape

- **Khái niệm**: Mọi error response cùng shape, vd:
  ```
  { success: false, error: { code, message, details? } }
  ```
- **Khi nào dùng**: Bắt buộc cho mọi BE API. Convention nhất quán giúp FE viết error handler 1 chỗ.
- **Bẫy thường gặp**:
  - Trộn shape success và error (cùng có `data`) → FE confused.
  - Leak stack trace ở production. Phải check `NODE_ENV !== 'production'` trước khi include stack.

---

## Validation

### Zod schema pattern

- **Khái niệm**: Định nghĩa schema cho body/params/query. Middleware parse → throw nếu fail, attach data đã parsed vào `req`.
- **Khi nào dùng**: Mọi endpoint có input từ client.
- **Lib**: Zod (đã có).
- **Bẫy thường gặp**:
  - Validate ở controller thay vì middleware → repeat code, dễ quên.
  - Không strip extra field → user gửi thêm `role: 'admin'` lọt vào DB. Dùng `.strict()` hoặc default Zod đã strip.
  - Để Zod error gốc trả về client → message khó hiểu cho user. Format lại trong error handler.

### Reuse schema cho OpenAPI

- **Khái niệm**: 1 Zod schema → vừa validate input, vừa generate OpenAPI spec.
- **Lib**: `@asteasolutions/zod-to-openapi`.
- **Bẫy**: Viết schema validate riêng + schema doc riêng → drift theo thời gian.

### Validate output (response)?

- **Khái niệm**: Validate response trước khi gửi cho client.
- **Khi nào dùng**: Ở môi trường dev/staging để bắt sớm output không đúng shape. Production thường skip để tránh overhead.
- **Bẫy**: Validate response strict ở production có thể từ chối response hợp lệ do schema chưa update — gây 500 oan.

---

## Logging

### Log levels

| Level   | Khi nào dùng                                          |
| ------- | ----------------------------------------------------- |
| `fatal` | App phải shut down                                    |
| `error` | Operation thất bại, cần điều tra                      |
| `warn`  | Bất thường nhưng app vẫn chạy (vd deprecated API gọi) |
| `info`  | Sự kiện quan trọng (user login, job started)          |
| `debug` | Chi tiết phục vụ debug, off ở production              |
| `trace` | Cực kỳ chi tiết, hiếm dùng                            |

- **Bẫy thường gặp**:
  - Log mọi thứ level `info` → noise. Phân biệt rõ.
  - Để `debug` ở production → tốn disk, leak data.

### Structured logging

- **Khái niệm**: Log JSON với field rõ ràng thay vì plain text. Vd: `{ level, time, msg, userId, requestId, duration }`.
- **Khi nào dùng**: Mọi app production. `console.log` cho dev tạm được.
- **Lib**: Pino (recommend) hoặc Winston.
- **Bẫy**: Log object circular reference → crash. Pino handle bằng `safe-stable-stringify`.

### Pino vs Winston

| Tiêu chí  | Pino                    | Winston                   |
| --------- | ----------------------- | ------------------------- |
| Tốc độ    | Rất nhanh (~5x Winston) | Trung bình                |
| Format    | JSON-first              | Đa format                 |
| Transport | Async qua worker thread | Đa transport built-in     |
| Ecosystem | pino-http, pino-pretty  | winston-daily-rotate, ... |

**Chọn**: Pino cho hầu hết case mới. Winston nếu cần tích hợp transport phức tạp (Datadog, CloudWatch).

### Sensitive data redaction

- **Khái niệm**: Tự che `password`, `token`, `authorization` header khi log.
- **Lib**: Pino có `redact: { paths: [...] }` built-in.
- **Bẫy thường gặp**:
  - Quên redact path nested (vd `req.body.user.password`).
  - Log entire request object → vô tình include header authorization.

### Log gì, không log gì

| Nên log                                         | Không log                       |
| ----------------------------------------------- | ------------------------------- |
| Request method/url/status/duration              | Body request đầy đủ (PII!)      |
| User action quan trọng (login, password change) | Password, token, credit card    |
| Error kèm stack trace                           | Health check ping spam          |
| Job started/finished/failed                     | Mọi function call (overlogging) |
| External API call (target, duration, status)    |                                 |

---

## Correlation ID flow

### Request ID

- **Khái niệm**: Mỗi request có 1 ID duy nhất, attach vào `req.id` và response header `X-Request-Id`.
- **Khi nào dùng**: Mọi BE production. Cần để tra log khi user báo lỗi.
- **Lib**: `nanoid` hoặc `uuid` v7 (sortable).

### Propagate qua log

- **Khái niệm**: Request ID phải xuất hiện trong MỌI log của request đó, kể cả service layer sâu.
- **Lib**:
  - `pino-http` tự bind `req.log` per request → log từ `req.log.info()` có sẵn requestId.
  - AsyncLocalStorage (Node native) inject context xuyên function call mà không cần truyền tham số.
- **Bẫy thường gặp**:
  - Async không bắt được context → log thiếu requestId. AsyncLocalStorage fix được.
  - Logger global vs request-scoped: phải có cách bind context.

### Propagate qua HTTP call

- **Khái niệm**: Khi service A gọi service B, truyền request ID qua header `X-Request-Id`. Service B đọc và dùng cùng ID.
- **Khi nào dùng**: Microservices, gọi service nội bộ.
- **Bẫy**: Quên propagate → mất trace giữa các service.

---

## Khi nào dùng error.log vs console.log

- `console.log/error`: chỉ dev quick debug, REMOVE trước commit.
- `logger.info/error`: mọi log nghiêm túc của app.
- **Bẫy thường gặp**: Commit `console.log` vào production → log không structured, không vào log aggregator. ESLint rule `no-console` ngăn được.
