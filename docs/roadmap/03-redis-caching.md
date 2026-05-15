# Phase 3 — Redis & Caching

## Mục tiêu phase này

Đưa Redis vào project làm: (1) cache cho dữ liệu đọc nhiều, (2) store cho refresh token / blacklist của Phase 2, (3) store cho rate-limit thay cho memory. Redis là "vũ khí đa năng" của BE — học pattern dùng nó là một bước rất lớn lên senior level.

## Checklist

- [ ] **Redis client setup**
  - **Ý nghĩa**: Tạo singleton Redis client kết nối từ app, có connection event handling (connect/reconnect/error).
  - **Vì sao cần**: Tất cả các mục dưới đều cần Redis client. Singleton để không tạo nhiều connection.
  - **Lib gợi ý**: `ioredis` — mature, cluster-ready, API tốt hơn `node-redis` cho usecase phức tạp (pipeline, pub/sub).
  - **Wire vào đâu**: `src/config/redis.ts` export singleton. `src/index.ts` import và đảm bảo connect trước khi start server.

- [ ] **Cache-aside pattern cho read-heavy endpoint**
  - **Ý nghĩa**: Trước khi query DB, check Redis. Nếu hit → trả luôn. Nếu miss → query DB, set vào Redis với TTL, trả response. Update/delete → invalidate cache key.
  - **Vì sao cần**: Giảm tải DB cho endpoint đọc nhiều (vd `GET /products`, `GET /products/:id`). Latency từ Redis < 1ms vs DB query 10-100ms.
  - **Lib gợi ý**: Tự viết wrapper helper `cacheGet(key, ttl, fetcher)`. Không cần lib cache cao cấp như `node-cache-manager` cho dự án học.
  - **Wire vào đâu**: `src/utils/cache.ts` cho helper. Apply trong service layer (`ProductService.findById`).

- [ ] **Migrate refresh token store sang Redis**
  - **Ý nghĩa**: Refresh token đang lưu DB (Phase 2) — chuyển sang key `refresh:{userId}:{jti}` với TTL = expiry.
  - **Vì sao cần**: TTL native trong Redis tự xoá token hết hạn — không cần job dọn. Lookup O(1). Phù hợp với pattern "data ngắn hạn, nhiều ghi/xoá".
  - **Lib gợi ý**: Dùng `ioredis` đã setup.
  - **Wire vào đâu**: Refactor `src/services/auth.service.ts`. Có thể giữ song song DB+Redis trong giai đoạn migrate, sau đó xoá DB.

- [ ] **Access token blacklist (Phase 2 nếu chưa)**
  - **Ý nghĩa**: Khi logout → `SETEX blacklist:{jti} {ttl} 1`. Middleware auth check `EXISTS blacklist:{jti}` trước khi accept token.
  - **Vì sao cần**: Đã giải thích Phase 2. Nhắc lại vì đây là use case "kinh điển" của Redis cho auth.
  - **Lib gợi ý**: `ioredis`.
  - **Wire vào đâu**: `src/services/auth.service.ts` và auth middleware.

- [ ] **Chuyển rate-limit sang Redis store**
  - **Ý nghĩa**: Phase 1 dùng memory store → mỗi instance Node có count riêng → không đúng khi scale ngang. Chuyển sang Redis store dùng chung.
  - **Vì sao cần**: Production thường chạy nhiều instance. Rate-limit chuẩn phải đếm tổng request từ 1 IP qua tất cả instances.
  - **Lib gợi ý**: `rate-limit-redis` (adapter cho `express-rate-limit`).
  - **Wire vào đâu**: Update config `express-rate-limit` ở `src/index.ts` để pass store là `RedisStore`.

- [ ] **Pub/Sub skeleton (optional)**
  - **Ý nghĩa**: Redis Pub/Sub cho phép app publish event sang channel, subscriber nhận realtime. Skeleton = setup 1 publisher + 1 subscriber ví dụ.
  - **Vì sao cần**: Use case: broadcast event giữa các instance Node (vd "user X just updated profile, invalidate cache"). Cũng là tiền đề cho WebSocket scale (Phase 8).
  - **Lib gợi ý**: `ioredis` hỗ trợ native pub/sub. Lưu ý: 1 client subscribe không gửi được command khác → cần 2 client (1 cho command, 1 cho subscribe).
  - **Wire vào đâu**: `src/lib/pubsub.ts` cho skeleton. Áp dụng cụ thể khi có use case (vd Phase 8 WebSocket).

## Sau phase này

Project có Redis layer làm cache, store auth, store rate-limit. Đây là milestone lớn — sau phase này backend đã có đầy đủ "must-have" của BE chuẩn. Các phase sau (4-8) là enhancement tuỳ nhu cầu.
