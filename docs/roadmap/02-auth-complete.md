# Phase 2 — Auth hoàn thiện

## Mục tiêu phase này

Nâng auth từ "JWT 1 token 7 ngày" lên pattern chuẩn: access token ngắn hạn + refresh token dài hạn có rotation, blacklist được token khi logout, middleware bảo vệ route với role-based check, và đổi password hashing sang argon2.

**Lưu ý**: Một số mục (refresh token store, blacklist) cần Redis — về kỹ thuật phụ thuộc Phase 3. Có thể tạm lưu DB trong phase này, rồi Phase 3 migrate sang Redis. Hoặc làm Phase 3 trước Phase 2 cũng được.

## Checklist

- [ ] **Tách Access Token + Refresh Token**
  - **Ý nghĩa**: Access token sống ngắn (15 phút), dùng để gọi API. Refresh token sống dài (7-30 ngày), chỉ dùng để xin access token mới.
  - **Vì sao cần**: Access token rò rỉ → kẻ tấn công chỉ dùng được 15 phút. Token hiện tại 7 ngày → rò rỉ là toang. Refresh token chỉ truyền khi cần renew, ít rủi ro hơn.
  - **Lib gợi ý**: `jsonwebtoken` (đã dùng). Không cần thêm.
  - **Wire vào đâu**: `src/services/auth.service.ts` — chia hàm `signTokens()` trả về cả 2. Endpoint `/login` trả cả 2, thêm endpoint `/refresh`.

- [ ] **Refresh token rotation**
  - **Ý nghĩa**: Mỗi lần dùng refresh token để renew, hệ thống cấp refresh token MỚI và invalidate cái cũ.
  - **Vì sao cần**: Nếu attacker cũng có refresh token cũ và user cũng dùng → khi attacker dùng, user bị logout → user phát hiện bất thường. Phát hiện reuse = phát hiện compromise.
  - **Lib gợi ý**: Tự viết logic, không có lib. Cần store để track refresh token (DB hoặc Redis).
  - **Wire vào đâu**: `src/services/auth.service.ts` thêm `rotateRefreshToken()`. Endpoint `/refresh` gọi hàm này.

- [ ] **Refresh token store (revocable)**
  - **Ý nghĩa**: Lưu refresh token đang active vào DB hoặc Redis (kèm userId, expiry, deviceInfo). Khi user logout/đổi password → xoá token này → refresh không dùng được nữa.
  - **Vì sao cần**: JWT bản chất stateless không revoke được. Muốn revoke phải có store. Refresh token revoke quan trọng hơn access token vì sống dài.
  - **Lib gợi ý**: Phase này có thể dùng Prisma + bảng `RefreshToken`. Phase 3 cân nhắc chuyển sang Redis (TTL native, nhanh hơn).
  - **Wire vào đâu**: Thêm model `RefreshToken` vào [prisma/schema.prisma](../../prisma/schema.prisma). Hoặc Redis key `refresh:{userId}:{jti}`.

- [ ] **Access token blacklist khi logout**
  - **Ý nghĩa**: Khi logout, ghi `jti` (JWT ID) của access token vào blacklist với TTL = thời gian còn lại của token. Middleware auth check blacklist trước khi accept token.
  - **Vì sao cần**: Access token vẫn còn hạn sau logout → nếu rò rỉ trước logout vẫn dùng được. Blacklist chặn được.
  - **Lib gợi ý**: Redis (TTL key) — rất phù hợp use case này. DB cũng được nhưng phải tự dọn expired.
  - **Wire vào đâu**: `src/services/auth.service.ts` thêm hàm `blacklistAccessToken(jti, ttl)`. Auth middleware check blacklist.

- [ ] **Auth middleware: `requireAuth`**
  - **Ý nghĩa**: Middleware verify JWT từ `Authorization: Bearer` hoặc cookie, decode payload, attach `req.user`. Reject nếu token invalid/expired/blacklisted.
  - **Vì sao cần**: File [src/middlewares/auth.middleware.ts](../../src/middlewares/auth.middleware.ts) đang rỗng — chưa có cách bảo vệ route. Bất kỳ route nào cần authenticated user đều cần middleware này.
  - **Lib gợi ý**: `jsonwebtoken` (đã dùng).
  - **Wire vào đâu**: Implement vào file [src/middlewares/auth.middleware.ts](../../src/middlewares/auth.middleware.ts). Apply vào các router cần bảo vệ.

- [ ] **Authorization middleware: `requireRole(...roles)`**
  - **Ý nghĩa**: Middleware factory, nhận list role và reject nếu `req.user.role` không thuộc list.
  - **Vì sao cần**: Phân quyền giữa các route (vd chỉ ADMIN xoá user). Authentication ≠ Authorization — biết user là ai chưa đủ, cần biết user có quyền gì.
  - **Lib gợi ý**: Tự viết, đơn giản. Nếu logic phức tạp hơn (ABAC) cân nhắc `casl` nhưng chưa cần.
  - **Wire vào đâu**: `src/middlewares/authorization.middleware.ts`. Cần thêm field `role` vào model `User` trong Prisma schema.

- [ ] **Đổi bcryptjs → argon2**
  - **Ý nghĩa**: argon2 là winner của Password Hashing Competition 2015, OWASP khuyến nghị hiện tại. bcryptjs là port JS thuần của bcrypt → chậm hơn native nhiều.
  - **Vì sao cần**: argon2 chống GPU attack tốt hơn bcrypt. bcryptjs cụ thể còn chậm do JS. Đổi sớm tránh phải migrate password hash sau.
  - **Lib gợi ý**: `argon2` (native binding). Khi cài có thể cần build tool — Windows có thể cần extra setup, lưu ý.
  - **Wire vào đâu**: `src/services/auth.service.ts` — đổi `bcrypt.hash/compare` → `argon2.hash/verify`. Lưu ý: user cũ trong DB đang dùng bcrypt → cần handle migration (verify cả 2 lần đăng nhập đầu, rehash sang argon2).

- [ ] **Password reset flow (skeleton)**
  - **Ý nghĩa**: User quên password → gửi email với token reset (sống ngắn, 1 lần dùng) → user submit password mới qua token.
  - **Vì sao cần**: Feature thực tế bắt buộc. Skeleton là implement logic, mock phần gửi email bằng log ra console.
  - **Lib gợi ý**: `crypto.randomBytes` cho token. Lưu token hash vào DB (bảng `PasswordResetToken`) với TTL.
  - **Wire vào đâu**: Thêm endpoints `/auth/forgot-password`, `/auth/reset-password`. Thêm model `PasswordResetToken`.

- [ ] **Email verification flow (skeleton)**
  - **Ý nghĩa**: Sau register, user nhận email với link verify. Click link → backend mark `emailVerified = true`.
  - **Vì sao cần**: Tránh fake email, đảm bảo user thực sự sở hữu email đó. Standard cho mọi app có auth.
  - **Lib gợi ý**: Tương tự password reset — token + TTL.
  - **Wire vào đâu**: Thêm field `emailVerified` vào model `User`. Endpoint `/auth/verify-email`. Có thể block login nếu chưa verify (tuỳ chính sách).

## Sau phase này

Auth chuẩn production: access + refresh với rotation, revocable, blacklist khi logout, role-based authorization, password hash chuẩn argon2, có flow reset/verify. Sẵn sàng cho Phase 3 — Redis sẽ tối ưu refresh store và blacklist.
