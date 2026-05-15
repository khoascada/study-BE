# Reference — Auth & Security

Cheat-sheet về authentication, authorization, và security checklist.

---

## Authentication

### JWT vs Session

- **JWT (stateless)**: Token chứa thông tin user, sign bằng secret. Server verify signature, không cần DB lookup. Pros: scale ngang dễ. Cons: revoke khó (cần blacklist).
- **Session (stateful)**: Server lưu session ID → user info trong store (Redis/DB). Client chỉ giữ session ID. Pros: revoke tức thì (xoá khỏi store). Cons: cần session store.
- **Khi nào dùng cái nào**:
  - JWT: API thuần (mobile, SPA), microservices, public API.
  - Session: web app server-rendered, cần revoke tức thì, không muốn phức tạp blacklist.
- **Bẫy thường gặp**: JWT lưu trong localStorage → dễ XSS đánh cắp. Dùng httpOnly cookie an toàn hơn.

### Access + Refresh token

- **Khái niệm**: Access token ngắn (15m) cho gọi API. Refresh token dài (7-30d) chỉ để xin access mới.
- **Khi nào dùng**: Mọi app dùng JWT. Single token dài hạn là anti-pattern.
- **Bẫy thường gặp**:
  - Trả refresh token qua header thường → dễ leak. Nên dùng httpOnly cookie path `/auth/refresh`.
  - Access token lưu cookie, refresh token cũng cookie cùng path → CSRF nguy hiểm. Phân path khác nhau.

### Refresh token rotation

- **Khái niệm**: Mỗi lần refresh, cấp refresh token mới + invalidate cái cũ. Nếu cái cũ được dùng lại → detect compromise, revoke all tokens của user.
- **Khi nào dùng**: Bắt buộc khi dùng refresh token. Không rotate = lộ token là toang.
- **Bẫy thường gặp**: Race condition khi client gọi refresh đồng thời. Cần grace period (vài giây) cho token cũ hoặc dedupe ở client.

### Token blacklist

- **Khái niệm**: Khi logout/đổi password, lưu `jti` token còn hạn vào Redis với TTL = thời gian còn lại. Middleware check trước khi accept.
- **Khi nào dùng**: Mọi app cần "logout thật" (token không dùng được sau logout).
- **Lib**: Redis (`SETEX`).
- **Bẫy thường gặp**: Token không có `jti` → không blacklist được. Phải sign token với `jti` (random ID) từ đầu.

### OAuth (Google/GitHub)

- **Khái niệm**: User login bằng provider bên ngoài thay vì password.
- **Khi nào dùng**: Giảm friction signup, không phải lưu password.
- **Lib**: `passport` (đa strategy) hoặc tự viết với `openid-client`. Passport API hơi cũ nhưng phổ biến.
- **Bẫy thường gặp**:
  - Không link account theo email → user có nhiều account (1 Google + 1 GitHub cùng email).
  - State param thiếu → CSRF on callback.

---

## Authorization

### RBAC (Role-Based Access Control)

- **Khái niệm**: User có role(s). Mỗi route check role required. Vd `admin` xoá user, `user` chỉ xem.
- **Khi nào dùng**: Phân quyền đơn giản 3-5 role. Đa số app dùng pattern này.
- **Lib**: Tự viết middleware `requireRole(...roles)`.
- **Bẫy thường gặp**: Logic phân quyền phức tạp (vd "admin nhưng chỉ trên resource của mình") nhồi vào RBAC → spaghetti. Cần ABAC.

### ABAC (Attribute-Based Access Control)

- **Khái niệm**: Permission tính từ attribute (user, resource, action, context). Vd "user có thể edit post nếu là author HOẶC là admin".
- **Khi nào dùng**: Logic phức tạp, multi-tenant, ownership-based.
- **Lib**: `casl` (TypeScript-first, ability definition). `oso` (declarative policy language).
- **Bẫy thường gặp**: Áp dụng ABAC khi RBAC đủ → over-engineering.

### Policy object pattern

- **Khái niệm**: Mỗi resource có file `policy.ts` với hàm như `canEdit(user, post)`. Service/controller gọi hàm này.
- **Khi nào dùng**: Logic phân quyền tách bạch khỏi controller, dễ test, dễ tái sử dụng.
- **Bẫy thường gặp**: Quên check policy ở 1 endpoint → security hole. Cần convention: mọi action mutate đều phải qua policy.

---

## Security checklist

### Helmet

- **Khái niệm**: Tự set HTTP security headers (CSP, X-Frame-Options, HSTS, ...).
- **Bẫy**: CSP mặc định strict — có thể block inline script của Swagger UI. Cần config custom CSP cho route đó.

### CORS

- **Khái niệm**: Whitelist origin được phép gọi API.
- **Bẫy**: `credentials: true` + `origin: '*'` không được phép theo spec. Phải whitelist origin cụ thể.

### CSRF (khi dùng cookie auth)

- **Khái niệm**: Attacker từ site khác gửi request mang cookie của user. Phòng: SameSite cookie + CSRF token.
- **Khi nào quan tâm**: Auth qua cookie. JWT trong Authorization header không bị CSRF.
- **Lib**: `csurf` (deprecated, nhưng vẫn dùng được). `csrf-csrf` (modern).
- **Bẫy**: SameSite=Lax không đủ với GET state-changing (anti-pattern nhưng có app làm).

### XSS

- **Khái niệm**: Inject script vào content được render lại cho user khác.
- **Bẫy ở BE**:
  - Không escape output khi render HTML server-side.
  - Cho phép HTML trong user input mà không sanitize (vd rich text). Dùng `dompurify` server-side.

### Secret management

- **Khái niệm**: JWT_SECRET, DB password, API key — không bao giờ commit vào code.
- **Bẫy thường gặp**:
  - Commit `.env` vào git. Phải `.gitignore` + chỉ commit `.env.example`.
  - Log accidentally print env → leak ra log aggregator.
  - JWT_SECRET ngắn (< 32 char) → brute-force được. Dùng `crypto.randomBytes(64).toString('hex')`.

### Dependency audit

- **Khái niệm**: Lib có lỗ hổng → app có lỗ hổng. Audit định kỳ.
- **Lib**: `npm audit`, `snyk`, GitHub Dependabot.
- **Bẫy**: `npm audit fix --force` có thể break compatibility. Đọc kỹ trước khi auto-fix.

### Password hashing

- **Khái niệm**: Hash với salt + work factor cao để chống GPU brute-force.
- **Lib**: **argon2** (OWASP recommend), bcrypt (vẫn ổn). Tuyệt đối không SHA/MD5.
- **Bẫy**: Work factor mặc định lib cập nhật theo thời gian — nên rehash khi user login nếu hash dùng work factor cũ.

### Rate limiting

- **Khái niệm**: Giới hạn request/IP/time.
- **Bẫy**:
  - Limit theo IP duy nhất → user sau NAT chung IP bị limit oan. Cân nhắc limit theo user (sau auth) cho endpoint sensitive.
  - Memory store không scale ngang. Phải Redis store.

---

## OWASP Top 10 quick check

| #   | Risk                          | Mitigation chính cho BE                                         |
| --- | ----------------------------- | --------------------------------------------------------------- |
| A01 | Broken Access Control         | RBAC/ABAC, policy object, deny by default                       |
| A02 | Cryptographic Failures        | argon2 cho password, HTTPS, secrets không hard-code             |
| A03 | Injection                     | Prisma ORM (chống SQLi). Sanitize HTML khi cần                  |
| A04 | Insecure Design               | Threat model trước khi design feature nhạy cảm                  |
| A05 | Security Misconfiguration     | Helmet, tắt debug ở prod, default credentials đổi hết           |
| A06 | Vulnerable Components         | npm audit, Dependabot                                           |
| A07 | Auth & Identity Failures      | MFA option, lockout sau N lần fail, không reveal "email exists" |
| A08 | Software & Data Integrity     | Verify signature webhook, không exec code từ user input         |
| A09 | Logging & Monitoring Failures | Log auth event, alert anomaly                                   |
| A10 | Server-Side Request Forgery   | Whitelist URL khi fetch từ user input                           |
