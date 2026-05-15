# NPM packages cần install theo phase

## Phase 0 — Tooling & Hygiene

Tất cả vào `devDependencies`. Env validation reuse `zod` đã có sẵn, không cần thêm lib.

```bash
npm i -D eslint @eslint/js typescript-eslint eslint-config-prettier \
        prettier \
        tsconfig-paths tsc-alias
```

### Giải thích từng package

| Package                  | Loại          | Mục đích                                                                                |
| ------------------------ | ------------- | --------------------------------------------------------------------------------------- |
| `eslint`                 | linter        | Core ESLint v9+ (flat config)                                                           |
| `@eslint/js`             | linter config | Bộ rule JS recommended chính thức của ESLint                                            |
| `typescript-eslint`      | linter        | Meta package mới (parser + plugin + configs) cho TS-ESLint, dùng với flat config        |
| `eslint-config-prettier` | linter config | Tắt các rule ESLint xung đột với Prettier (không cần `eslint-plugin-prettier`)          |
| `prettier`               | formatter     | Format code tự động — quote, indent, trailing comma                                     |
| `tsconfig-paths`         | runtime       | Resolve path alias `@/...` khi chạy `ts-node` (dev)                                     |
| `tsc-alias`              | build         | Rewrite path alias trong output `dist/` sau khi `tsc` build (vì `tsc` không tự rewrite) |

### Tạm hoãn (bổ sung sau)

- `husky` + `lint-staged` — pre-commit auto lint/format. Sẽ thêm sau, hiện chưa cần.
- `.editorconfig` — đồng bộ IDE settings. Sẽ thêm sau khi làm team / cần CRLF–LF consistency.

### Đã loại bỏ (vì sao không dùng)

- `envalid`, `dotenv-safe` → reuse `zod` đã có.
- `eslint-config-airbnb` → quá nặng cho mục đích học.
- `eslint-plugin-prettier` → không cần, chỉ cần `eslint-config-prettier` để tắt rule xung đột; chạy Prettier riêng qua script.
