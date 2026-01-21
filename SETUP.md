# Hướng dẫn Setup

## 1. Cài đặt dependencies

```bash
npm install
```

## 2. Tạo file `.env` để set OpenAI API Key

Tạo file `.env` trong thư mục `web_ui` với nội dung:

```env
OPENAI_API_KEY=sk-your-api-key-here
PORT=3001
```

**Lưu ý quan trọng:**
- Thay `sk-your-api-key-here` bằng API key thật của bạn từ OpenAI
- File `.env` đã được thêm vào `.gitignore` để không commit lên git
- **KHÔNG BAO GIỜ** commit API key lên git!

## 3. Chạy Backend Server

```bash
npm run dev:server
```

Server sẽ chạy tại `http://localhost:3001` (hoặc port bạn set trong `.env`)

## 4. Chạy Frontend (terminal khác)

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173` (hoặc port Vite tự chọn)

## 5. Các biến môi trường khác (tùy chọn)

Bạn có thể thêm vào `.env`:

```env
OPENAI_MODEL=gpt-4o-mini
SYSTEM_PROMPT=You are a helpful assistant.
MAX_INPUT_CHARS=8000
DEBUG=false
```

## Troubleshooting

- **Lỗi "Missing OPENAI_API_KEY"**: Kiểm tra file `.env` đã có `OPENAI_API_KEY` chưa
- **Lỗi port đã được sử dụng**: Đổi `PORT` trong `.env` sang port khác
- **Frontend không kết nối được backend**: Kiểm tra `VITE_API_PORT` trong `.env` (hoặc `src/config.js`) khớp với port backend
