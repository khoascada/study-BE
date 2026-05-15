# Phase 5 — Observability

## Mục tiêu phase này

Cho phép biết được "app đang chạy như thế nào" — log có cấu trúc để search/filter, health check để monitor, correlation ID để trace một request xuyên các log. Đây là điều phân biệt giữa "code chạy được" và "code vận hành được".

## Checklist

- [ ] **Structured logging với Pino**
  - **Ý nghĩa**: Log dạng JSON với field rõ ràng (`level`, `time`, `msg`, `userId`, `requestId`, ...) thay vì plain text. Production format JSON, dev format pretty.
  - **Vì sao cần**: Log JSON parse được bằng tool (Datadog, Loki, ELK). `console.log` không có level, không structured → không tra cứu được khi app lớn.
  - **Lib gợi ý**: **Pino** — nhanh nhất, ecosystem tốt với Express. Alternative `winston` flexibility cao hơn nhưng chậm hơn ~5x. Pino-pretty cho dev.
  - **Wire vào đâu**: `src/config/logger.ts` export logger singleton. Replace mọi `console.log/error` trong code bằng `logger.info/error`.

- [ ] **HTTP access log với pino-http**
  - **Ý nghĩa**: Middleware tự log mỗi request: method, url, status, duration, requestId, userId.
  - **Vì sao cần**: Biết endpoint nào được gọi bao nhiêu lần, request nào chậm, request nào lỗi. Đây là dữ liệu cơ bản để debug và optimize.
  - **Lib gợi ý**: `pino-http` (tích hợp Pino).
  - **Wire vào đâu**: `src/index.ts`, mount sau request-id middleware (cần req.id), trước routes.

- [ ] **Correlation ID flow**
  - **Ý nghĩa**: Request ID (từ Phase 1) phải xuất hiện trong MỌI log liên quan đến request đó — kể cả log từ service layer sâu bên trong.
  - **Vì sao cần**: User báo lỗi → có request ID → grep log → thấy đầy đủ flow request đó từ HTTP đến DB query.
  - **Lib gợi ý**: AsyncLocalStorage (Node native, không cần lib) để inject context xuyên function calls. Hoặc dùng `pino-http` tự bind `req.log` per request.
  - **Wire vào đâu**: `src/utils/context.ts` cho AsyncLocalStorage. Logger lấy requestId từ store khi log.

- [ ] **Sensitive data redaction**
  - **Ý nghĩa**: Cấu hình logger tự che password, token, authorization header khi log object có chứa.
  - **Vì sao cần**: Tránh leak credentials vào log. GDPR compliance. Quan trọng khi log request body / response.
  - **Lib gợi ý**: Pino có option `redact` built-in — chỉ cần list các path.
  - **Wire vào đâu**: Config Pino trong `src/config/logger.ts`. Path ví dụ: `['*.password', '*.token', 'req.headers.authorization', 'req.headers.cookie']`.

- [ ] **Health check endpoint `/health` (liveness)**
  - **Ý nghĩa**: Endpoint trả 200 OK nếu process đang chạy. Không check dependency.
  - **Vì sao cần**: Load balancer / orchestrator (k8s) dùng để biết khi nào restart container. Liveness fail = process treo, cần kill.
  - **Lib gợi ý**: Không cần lib, viết 1 handler trả `{ status: 'ok' }`.
  - **Wire vào đâu**: `src/routes/health.router.ts`. Mount công khai, không qua auth.

- [ ] **Readiness check endpoint `/ready`**
  - **Ý nghĩa**: Endpoint check các dependency có hoạt động không: DB (`prisma.$queryRaw\`SELECT 1\``), Redis (`redis.ping()`). Trả 503 nếu fail.
  - **Vì sao cần**: Khác liveness — readiness fail nghĩa là "đừng route request đến tôi, tôi chưa sẵn sàng" (vd DB down). Load balancer sẽ tạm bỏ instance này khỏi pool.
  - **Lib gợi ý**: Không cần lib.
  - **Wire vào đâu**: Cùng `health.router.ts`. Inject Prisma client + Redis client để check.

- [ ] **Metrics endpoint skeleton (optional)**
  - **Ý nghĩa**: Endpoint `/metrics` trả về Prometheus format: request count, latency histogram, error count, etc.
  - **Vì sao cần**: Cho phép Prometheus/Grafana scrape và visualize. Là tiền đề cho alerting (vd "latency p99 > 1s 5 phút liên tiếp → alert").
  - **Lib gợi ý**: `prom-client` — standard. Skip nếu chưa định dùng Prometheus.
  - **Wire vào đâu**: `src/routes/metrics.router.ts`. **Optional cho dự án học**.

## Sau phase này

App có log JSON structured với correlation ID, có health/readiness check, có thể tra cứu mọi request qua log. Hết phase này backend đã "production-observable" — sẵn sàng cho Phase 6 (testing) để code change tự tin hơn.
