# Web UI - AI Chat Application

Ứng dụng chat AI độc lập với React frontend và Node.js backend.

## Tính năng

- 💬 Chat với AI (OpenAI API)
- 📝 Hỗ trợ Markdown rendering
- 🔄 Real-time streaming responses
- 📱 Responsive UI
- ⚙️ Cấu hình qua biến môi trường

## Cấu trúc

```
web_ui/
├── server.cjs          # Backend API server
├── src/
│   ├── App.jsx         # React main component
│   ├── main.jsx        # Alternative vanilla JS entry
│   └── config.js       # API configuration
├── .env                # Environment variables (tạo file này)
└── package.json
```

## Cài đặt nhanh

1. **Cài dependencies:**
   ```bash
   npm install
   ```

2. **Tạo file `.env`:**
   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   PORT=3001
   ```

3. **Chạy backend:**
   ```bash
   npm run dev:server
   ```

4. **Chạy frontend (terminal khác):**
   ```bash
   npm run dev
   ```

Xem [SETUP.md](./SETUP.md) để biết chi tiết.

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `OPENAI_API_KEY` | OpenAI API key (bắt buộc) | - |
| `PORT` | Backend server port | `3001` |
| `OPENAI_MODEL` | Model name | `gpt-4o-mini` |
| `SYSTEM_PROMPT` | System prompt cho AI | `You are a helpful assistant.` |
| `MAX_INPUT_CHARS` | Giới hạn độ dài input | `8000` |
| `DEBUG` | Bật debug logs | `false` |

## Scripts

- `npm run dev` - Chạy frontend dev server
- `npm run dev:server` - Chạy backend API server
- `npm run build` - Build production
- `npm run preview` - Preview production build

## License

Private project
