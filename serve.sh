#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=4500

echo "🚀 Khởi động The Hiu Preview Server..."
echo "📂 Thư mục: $DIR"

# Kiểm tra và giải phóng cổng 4500 nếu đang bị chiếm
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
  echo "⚠️  Cổng $PORT đang có tiến trình chạy. Đang dừng tiến trình cũ..."
  kill $(lsof -t -i :$PORT) 2>/dev/null || true
  sleep 0.5
fi

# Tự động mở trình duyệt sau 1 giây
(sleep 1 && open "http://localhost:$PORT") &

echo "🌐 Server đang chạy tại: http://localhost:$PORT"
echo "👉 Nhấn phím Ctrl + C để dừng server."
echo "--------------------------------------------------"

cd "$DIR"
python3 -m http.server $PORT
