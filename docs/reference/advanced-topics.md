# Reference — Advanced Topics

Cheat-sheet cho performance, background jobs, realtime, và DevOps tối thiểu.

---

## Performance

### N+1 query với Prisma

- **Khái niệm**: Query list rồi loop query con cho từng item = `1 + N` query.
- **Cách fix**:
  - `include`: eager load relation. Đơn giản nhưng có thể over-fetch.
  - `select`: chỉ chọn field cần. Tiết kiệm hơn.
  - `findMany` với `where: { id: { in: ids } }` để batch.
- **Bẫy thường gặp**: `include` lồng nhiều level → query JOIN nặng. Cân nhắc tách thành 2 query song song.

### Indexing

- **Khái niệm**: Index trên column dùng để filter/join/sort thường xuyên.
- **Khi nào cần**:
  - Mọi foreign key (Prisma auto thêm cho `@relation`).
  - Column trong `WHERE`/`ORDER BY` thường gặp.
  - Composite index nếu filter combo column.
- **Lib**: Prisma `@@index([col1, col2])` trong schema.
- **Bẫy thường gặp**:
  - Index quá nhiều → write chậm, tốn disk.
  - Index trên column low-cardinality (vd `gender`) → vô dụng.
  - Quên `EXPLAIN ANALYZE` để verify index có được dùng.

### Connection pool tuning

- **Khái niệm**: Prisma pool mặc định `num_cpu * 2 + 1`. Quá thấp → request queue. Quá cao → DB chịu không nổi.
- **Khi nào tune**: Production traffic cao. DB hosted có connection limit (Supabase free 60 connection).
- **Lib**: Pool size set qua URL `?connection_limit=10`. Hoặc dùng PgBouncer pool ở giữa.
- **Bẫy thường gặp**: Mỗi serverless function tạo Prisma client mới → connection bùng. Dùng connection pooler bên ngoài.

### Compression

- **Khái niệm**: Gzip/Brotli response trước khi gửi → giảm bandwidth.
- **Lib**: `compression` middleware Express.
- **Khi nào dùng**: Response JSON lớn. Endpoint nhỏ (<1KB) overhead lớn hơn save.
- **Bẫy**: Đã có proxy/CDN compress rồi → app compress thêm là lãng phí.

### Streaming response

- **Khái niệm**: Trả response từng chunk thay vì buffer toàn bộ trong memory.
- **Khi nào dùng**: Response data lớn (export CSV, file download), AI streaming.
- **Lib**: Express native `res.write()`. Hoặc Node Streams.
- **Bẫy**: Error giữa stream khó handle (header đã gửi → không set status được).

### Caching layer

- **Khái niệm**: Cache ở nhiều tầng: CDN (static), Redis (data), in-process LRU (hot data).
- **Khi nào dùng**: Read-heavy. Đã có ở Phase 3.
- **Bẫy**: Cache tầng dưới hit, tầng trên không tự invalidate khi data đổi.

---

## Background jobs

### BullMQ

- **Khái niệm**: Queue library trên Redis. Hỗ trợ retry, repeat (cron), delayed, priority, rate limit job.
- **Khi nào dùng**: Mọi task không cần response sync — gửi email, xử lý ảnh, generate PDF, sync với 3rd party.
- **Lib**: **BullMQ** (modern, TypeScript-first, replace Bull cũ). Alternative `agenda` (MongoDB-based).
- **Bẫy thường gặp**:
  - Worker chung process với web → block event loop khi job nặng. Tách process.
  - Job idempotent không đảm bảo → retry gây side-effect double.
  - Không monitor queue size → backlog không phát hiện.

### Retry strategy

- **Khái niệm**: Job fail → tự retry với backoff (exponential). Sau N lần fail → dead-letter queue.
- **Khi nào dùng**: Mọi job gọi external service.
- **Bẫy**: Retry job non-idempotent → side effect bị thực hiện nhiều lần (vd charge credit card 2 lần). Phải implement idempotency.

### Idempotency

- **Khái niệm**: Cùng job chạy nhiều lần → kết quả giống nhau, không side effect kép.
- **Cách làm**:
  - Mỗi job có unique ID → check đã xử lý chưa.
  - External call gửi idempotency key (Stripe, Square hỗ trợ).
  - Mutation DB: dùng UPSERT thay vì INSERT.
- **Bẫy thường gặp**: Assume retry an toàn mà không check → double charge, double send email.

### Cron job

- **Khái niệm**: Job chạy định kỳ (mỗi giờ, mỗi ngày).
- **Lib**: BullMQ `repeat: { cron: '0 0 * * *' }`. Hoặc `node-cron` cho case đơn giản trong-process.
- **Bẫy thường gặp**:
  - In-process cron + nhiều instance → job chạy nhiều lần. Cần distributed lock hoặc dùng external scheduler.
  - Cron chạy đè khi job trước chưa xong. BullMQ có `removeOnComplete` và lock TTL.

---

## Realtime

### WebSocket

- **Khái niệm**: Full-duplex connection sau handshake HTTP upgrade. Client/server gửi nhận tự do.
- **Khi nào dùng**: Chat, collaborative editing, game, live dashboard với 2-way communication.
- **Lib**:
  - `socket.io`: room/namespace, auto fallback, easy. Hơi nặng.
  - `ws`: lightweight, low-level. Phải tự build protocol.
- **Scale**:
  - Sticky session ở load balancer (1 user → 1 instance).
  - Redis pub/sub adapter để broadcast cross-instance. `@socket.io/redis-adapter`.
- **Bẫy thường gặp**:
  - Quên authenticate ở handshake → anyone connect được.
  - Không cleanup khi disconnect → memory leak.
  - Send từng message thay vì batch → quá tải.

### SSE (Server-Sent Events)

- **Khái niệm**: HTTP response streaming, server push event đến client. 1 chiều server→client.
- **Khi nào dùng**: Notification, live feed, AI streaming response. Đơn giản hơn WebSocket nhiều.
- **Lib**: Native Express (set header `Content-Type: text/event-stream`, dùng `res.write`).
- **Bẫy**: Một số proxy buffer response → SSE không deliver realtime. Cần `X-Accel-Buffering: no`.

### Long polling

- **Khái niệm**: Client gửi request, server giữ open cho đến khi có data hoặc timeout.
- **Khi nào dùng**: Khi WebSocket/SSE không khả thi (legacy firewall). Hiếm dùng giờ.

### Khi nào chọn cái nào

| Use case                   | Khuyến nghị                         |
| -------------------------- | ----------------------------------- |
| Chat                       | WebSocket                           |
| Notification 1 chiều       | SSE                                 |
| AI streaming response      | SSE                                 |
| Live collaborative editing | WebSocket                           |
| Stock ticker public        | SSE                                 |
| Game realtime              | WebSocket (or UDP qua WebTransport) |

---

## DevOps tối thiểu cho project học

(User không cần deploy production — phần này chỉ để biết, làm khi cần.)

### Dockerfile

- **Khái niệm**: Image chứa Node + app + dependencies. Build 1 lần, chạy mọi nơi.
- **Best practice**:
  - Multi-stage build: stage build (chứa devDeps + TypeScript compile), stage runtime (chỉ runtime deps + dist).
  - Base image `node:20-alpine` cho gọn. Hoặc `node:20-slim` (Debian, ít vấn đề musl).
  - Non-root user (`USER node`).
  - Layer cache: `COPY package*.json` → `npm ci` trước khi `COPY .`.
- **Bẫy**: Image nặng (>1GB) vì copy `node_modules` dev. Dùng `.dockerignore`.

### docker-compose cho local dev

- **Khái niệm**: File `docker-compose.yml` chạy app + dependencies (PostgreSQL, Redis) local.
- **Khi nào dùng**: Onboarding dev mới — `docker compose up` là chạy ngay, không cần setup từng service.
- **Bẫy**:
  - Volume `node_modules` từ host làm chậm trên Mac/Windows. Anonymous volume cho `node_modules`.
  - DB volume không persistent → reset là mất data. Mount named volume.

### GitHub Actions skeleton

- **Khái niệm**: Workflow CI chạy khi push/PR: install → lint → typecheck → test → build.
- **File**: `.github/workflows/ci.yml`.
- **Bẫy**:
  - Cache `node_modules` qua `actions/cache` để nhanh.
  - Test cần DB → spin Postgres service container trong job.
  - Secrets (DATABASE_URL test) qua GitHub Secrets.

### Health & readiness

(Đã ở Phase 5, nhắc lại vì critical cho deploy.)

- `/health` cho liveness probe của orchestrator (k8s).
- `/ready` cho readiness probe — check DB/Redis.

### Graceful shutdown

- **Khái niệm**: Khi nhận SIGTERM (k8s gửi khi pod terminate), app phải:
  1. Stop accept connection mới.
  2. Finish request đang xử lý.
  3. Close DB/Redis connection.
  4. Exit.
- **Lib**: Express native qua `server.close()`. Có `terminus` cho integration tốt hơn.
- **Bẫy**: Không handle SIGTERM → k8s kill -9 sau timeout → request đang chạy bị mất.

### Secrets management

- **Khái niệm**: Production secret không lưu env file → dùng vault (AWS Secrets Manager, HashiCorp Vault, Doppler).
- **Khi nào quan tâm**: Production thật. Dev/staging `.env` đủ.
- **Bẫy**: Commit `.env` vào git → secret leak. Rotate ngay nếu xảy ra.

---

## Tài nguyên đọc thêm

- **Prisma docs**: prisma.io/docs — đặc biệt phần "best practices" và "performance".
- **OWASP Cheat Sheet Series**: cheatsheetseries.owasp.org — security khía cạnh nào cũng có cheat sheet.
- **Node.js Best Practices** (goldbergyoni/nodebestpractices) — repo GitHub tổng hợp pattern, đáng đọc.
- **The Twelve-Factor App** — methodology cho app cloud-native, áp dụng được phần nhiều cho BE.
