# Reference — Data & Caching

Cheat-sheet về Redis pattern, cache strategy, và rate-limit algorithm.

---

## Redis caching patterns

### Cache-aside (lazy loading)

- **Khái niệm**: App đọc từ cache trước. Miss → đọc DB, set vào cache. Mutation → invalidate cache key.
- **Khi nào dùng**: Read-heavy data, có thể stale tạm thời. Pattern phổ biến nhất.
- **Bẫy thường gặp**:
  - Quên invalidate khi update → serve stale data lâu.
  - Cache stampede: TTL expire đồng loạt → hàng loạt request miss đập DB. Fix: randomize TTL ± 10%, hoặc lock khi rebuild cache.

### Write-through

- **Khái niệm**: Mọi write đi qua cache (cache write → DB write). Cache luôn fresh.
- **Khi nào dùng**: Cần consistency cao giữa cache và DB.
- **Bẫy**: Write chậm hơn (2 lần ghi). Nếu cache fail → ảnh hưởng write path.

### Write-behind (write-back)

- **Khái niệm**: Write vào cache trước, async flush sang DB sau.
- **Khi nào dùng**: Write rất nhiều, có thể accept loss khi crash. Hiếm dùng cho data quan trọng.
- **Bẫy**: Crash mất data chưa flush. Cần WAL hoặc persistent cache.

### Read-through

- **Khái niệm**: Tương tự cache-aside nhưng cache layer tự gọi DB khi miss (không phải app).
- **Khi nào dùng**: Khi có cache framework support (vd `node-cache-manager`). Tách concern cache khỏi app code.

---

## TTL strategy

- **Khái niệm**: Time-to-live cho cache key. Tự xoá sau X giây.
- **Khi nào dùng**: Mọi cache. Không có TTL → cache phình mãi.
- **Cách chọn TTL**:
  - Data hiếm đổi (vd category list): vài giờ.
  - Data đổi vừa (vd product info): 5-15 phút.
  - Data thường đổi (vd user count): 30s-1min.
  - Data realtime: không cache.
- **Bẫy thường gặp**:
  - TTL = 0 trong ioredis nghĩa là không expire (không phải expire ngay). Phải set TTL > 0.
  - TTL quá dài + không invalidate → stale data.

---

## Cache invalidation

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

### Strategies

- **Explicit**: Mutation xong xoá key cụ thể. Đơn giản nhất, đúng đắn nhất, nhưng dễ quên.
- **Tag-based**: Mỗi key gắn tag(s). Xoá theo tag → xoá hàng loạt key liên quan. Redis không hỗ trợ native, phải tự maintain mapping.
- **Version-based**: Key chứa version (`user:v3:42`). Tăng version → cache cũ tự "vô hình". Không cần xoá.
- **Event-based**: Mutation publish event → subscriber invalidate cache tương ứng. Phù hợp distributed.

### Bẫy thường gặp

- Invalidate sai key (typo) → cache không bao giờ refresh.
- Quên invalidate khi data đổi qua admin tool / job → stale data dài hạn.

---

## Distributed lock (Redis)

- **Khái niệm**: Lock dùng chung giữa nhiều process qua Redis. `SET key value NX EX ttl`.
- **Khi nào dùng**: Đảm bảo 1 task chỉ chạy 1 lần dù app có nhiều instance (vd cron job, cache rebuild).
- **Lib**: `redlock` (Redlock algorithm). Hoặc tự dùng `SET NX EX` cho case đơn giản.
- **Bẫy thường gặp**:
  - Process crash khi đang giữ lock → lock vĩnh viễn. TTL bắt buộc.
  - Release lock của process khác (do TTL hết, lock đã được process khác lấy). Phải check value trước khi del.

---

## Rate limit algorithms

### Fixed window

- **Khái niệm**: Đếm request trong cửa sổ cố định (vd 100 req/15min, reset đầu mỗi 15min).
- **Pros**: Implementation đơn giản (1 counter + TTL).
- **Cons**: Burst ở biên 2 cửa sổ — user có thể gửi 200 req trong 1 phút (cuối window + đầu window tiếp).

### Sliding window log

- **Khái niệm**: Lưu timestamp mỗi request. Đếm số timestamp trong window rolling.
- **Pros**: Chính xác.
- **Cons**: Tốn memory (lưu mọi timestamp). Không scale cho rate cao.

### Sliding window counter

- **Khái niệm**: Kết hợp fixed window với weighted estimate dựa trên window trước.
- **Pros**: Tương đối chính xác, ít memory.
- **Cons**: Logic phức tạp hơn.

### Token bucket

- **Khái niệm**: Bucket chứa N token, refill rate R/s. Mỗi request lấy 1 token. Hết → reject.
- **Pros**: Cho phép burst (đến size bucket), smooth long-term.
- **Cons**: Cần state stateful + atomic update.

### Khuyến nghị

- **Project học**: dùng `express-rate-limit` (fixed window) + `rate-limit-redis` cho store.
- **Cần burst-friendly**: token bucket.
- **Bẫy**: Mọi rate limit chỉ tốt khi IP/identifier đáng tin. Sau proxy/CDN phải config `trust proxy` đúng để lấy real IP.

---

## Cache key naming convention

- **Pattern**: `<resource>:<id>` hoặc `<resource>:<id>:<sub>`.
  - Vd: `user:42`, `user:42:posts`, `product:list:page:1`.
- **Quy tắc**:
  - Dùng `:` làm separator (Redis convention).
  - Có namespace nếu nhiều app dùng chung Redis (`prisma-practice:user:42`).
  - Đừng dùng key động không bounded (vd query string tùy ý) → key bùng nổ.
- **Bẫy thường gặp**: Key có chứa data đổi liên tục (vd timestamp) → mỗi request 1 key mới → cache vô dụng.

---

## Khi nào KHÔNG cache

- Data realtime quan trọng (balance, inventory cuối) — sai 1 con số = mất tiền.
- Data per-user volume lớn (key bùng nổ).
- Write-heavy hơn read — cache không có ROI.
- Compute trả về cực rẻ (vd `users.length`) — query DB còn nhanh hơn round-trip Redis.
