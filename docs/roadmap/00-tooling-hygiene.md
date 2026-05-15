# Phase 0 — Tooling & Hygiene

## Mục tiêu phase này

Thiết lập "đường ray" trước khi viết code thật: linter bắt lỗi sớm, formatter giữ code thống nhất, env được validate ngay khi app khởi động, path alias để import gọn. Làm trước để tránh phải refactor toàn project sau này.

## Checklist

- [ ] **ESLint + Prettier**
  - **Ý nghĩa**: ESLint = bộ rule tĩnh bắt lỗi logic và code-smell (vd: unused var, await trong non-async). Prettier = format code tự động cho thống nhất (quote, indent, trailing comma).
  - **Vì sao cần**: Đảm bảo code chất lượng và style nhất quán giữa các file, giảm tranh cãi style trong code review, bắt bug sớm trước khi runtime.
  - **Lib gợi ý**: `eslint` (flat config v9+) + `@typescript-eslint` + `eslint-config-prettier` + `prettier`. Tránh dùng airbnb config — quá nặng cho học.
  - **Wire vào đâu**: Tạo `eslint.config.js` và `.prettierrc` ở root. Thêm script `lint`, `format` vào `package.json`.

- [ ] **Zod validate env vars**
  - **Ý nghĩa**: Định nghĩa schema cho biến môi trường (DATABASE_URL, JWT_SECRET, PORT, ...) và parse `process.env` qua schema đó ngay khi app start.
  - **Vì sao cần**: Phát hiện thiếu/sai env ngay lúc khởi động thay vì crash giữa chừng. Cũng cho type-safe khi dùng `env.JWT_SECRET` trong code.
  - **Lib gợi ý**: Dùng lại `zod` đã có. Không cần thêm `envalid` hay `dotenv-safe`.
  - **Wire vào đâu**: Tạo `src/config/env.ts` export `env` đã parse. Thay mọi `process.env.X` trong code bằng `env.X`.

- [ ] **Path alias trong tsconfig**
  - **Ý nghĩa**: Cho phép import bằng `@/services/auth.service` thay vì `../../services/auth.service`.
  - **Vì sao cần**: Import path không phụ thuộc vị trí file, dễ refactor di chuyển file. Đọc code rõ ràng hơn.
  - **Lib gợi ý**: Config `paths` trong `tsconfig.json`. Runtime cần `tsconfig-paths` (đã chạy ts-node) hoặc `tsc-alias` (build).
  - **Wire vào đâu**: `tsconfig.json` thêm `compilerOptions.paths`. Update `nodemon` script để load `tsconfig-paths/register`.

- [ ] **NPM scripts chuẩn**
  - **Ý nghĩa**: Định nghĩa script chuẩn: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `test`, `typecheck`, `prisma:migrate`, `prisma:generate`, `prisma:studio`.
  - **Vì sao cần**: Onboarding member mới chỉ cần đọc scripts là biết chạy lệnh nào. Cũng giúp CI/CD dùng script chuẩn thay vì hardcode lệnh.
  - **Lib gợi ý**: Không cần lib.
  - **Wire vào đâu**: Update phần `scripts` trong `package.json`.

## Sau phase này

Project có nền tảng tooling: code commit được tự động lint/format, env không hợp lệ sẽ chặn app khởi động, import path gọn. Sẵn sàng vào Phase 1 để bổ sung security middleware.
