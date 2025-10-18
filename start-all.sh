#!/usr/bin/env bash
# start-all.sh
# 一键启动/停止/查看 前端 (Soma_V0) 与 后端 (Self_AI_Agent)
# 使用: ./start-all.sh start|stop|status|logs|health|install

set -euo pipefail
ROOT_DIR="/Users/patrick_ma/Soma/Soma_V0"
BACKEND_DIR="$ROOT_DIR/Self_AI_Agent"
FRONTEND_DIR="$ROOT_DIR"

# 可配置端口
FRONTEND_PORT=${FRONTEND_PORT:-8081}
BACKEND_PORT=${BACKEND_PORT:-8787}

LOG_DIR="/tmp/soma_logs"
mkdir -p "$LOG_DIR"
FRONT_LOG="$LOG_DIR/frontend.log"
BACK_LOG="$LOG_DIR/self-agent.log"
PID_DIR="/tmp/soma_pids"
mkdir -p "$PID_DIR"
FRONT_PID_FILE="$PID_DIR/frontend.pid"
BACK_PID_FILE="$PID_DIR/self-agent.pid"

# npm 命令
NPM=${NPM:-npm}

function ensure_node_npm() {
  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js 未安装或不在 PATH。请先安装 Node.js。"
    exit 1
  fi
  if ! command -v $NPM >/dev/null 2>&1; then
    echo "$NPM 未找到。请安装 npm 或调整 NPM 变量。"
    exit 1
  fi
}

function start_frontend() {
  echo "[frontend] Starting frontend in $FRONTEND_DIR (port $FRONTEND_PORT)"
  cd "$FRONTEND_DIR"
  # 可选安装依赖（如需要）
  # $NPM install

  # 启动并写 pid
  nohup $NPM run dev --silent > "$FRONT_LOG" 2>&1 &
  PID=$!
  echo $PID > "$FRONT_PID_FILE"
  echo "[frontend] started PID=$PID, log: $FRONT_LOG"
}

function start_backend() {
  echo "[backend] Starting backend in $BACKEND_DIR (port $BACKEND_PORT)"
  cd "$BACKEND_DIR"
  # 可选安装依赖（如需要）
  # $NPM install

  nohup $NPM run dev --silent > "$BACK_LOG" 2>&1 &
  PID=$!
  echo $PID > "$BACK_PID_FILE"
  echo "[backend] started PID=$PID, log: $BACK_LOG"
}

function stop_pidfile() {
  local pidfile="$1"
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile" 2>/dev/null || echo "")
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Killing PID $pid"
      kill -9 "$pid" || true
    fi
    rm -f "$pidfile"
  fi
}

function stop_all() {
  echo "Stopping frontend and backend..."
  stop_pidfile "$FRONT_PID_FILE"
  stop_pidfile "$BACK_PID_FILE"
  echo "Stopped."
}

function status_all() {
  echo "Status:"
  if [ -f "$FRONT_PID_FILE" ]; then
    pid=$(cat "$FRONT_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo "[frontend] running PID=$pid (log: $FRONT_LOG)"
    else
      echo "[frontend] PID file exists but process not running"
    fi
  else
    echo "[frontend] not running"
  fi

  if [ -f "$BACK_PID_FILE" ]; then
    pid=$(cat "$BACK_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo "[backend] running PID=$pid (log: $BACK_LOG)"
    else
      echo "[backend] PID file exists but process not running"
    fi
  else
    echo "[backend] not running"
  fi
}

function tail_logs() {
  echo "Tailing logs (ctrl-c to exit)"
  tail -n 200 -f "$FRONT_LOG" "$BACK_LOG"
}

function health_check() {
  echo "Frontend health check: http://localhost:$FRONTEND_PORT"
  if curl -sS "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
    echo "  frontend: reachable"
  else
    echo "  frontend: unreachable"
  fi

  echo "Backend health check: http://localhost:$BACKEND_PORT/health"
  if curl -sS "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
    echo "  backend: healthy"
  else
    echo "  backend: unreachable or unhealthy"
  fi
}

function install_deps() {
  echo "Installing dependencies (frontend & backend). This may take a while..."
  cd "$BACKEND_DIR"
  $NPM install
  cd "$FRONTEND_DIR"
  $NPM install
}

case "${1:-}" in
  start)
    ensure_node_npm
    start_backend
    # 给后端一点时间启动，再启动前端（避免端口冲突或 race）
    sleep 1
    start_frontend
    ;;
  stop)
    stop_all
    ;;
  restart)
    stop_all
    sleep 1
    start_backend
    sleep 1
    start_frontend
    ;;
  status)
    status_all
    ;;
  logs)
    tail_logs
    ;;
  health)
    health_check
    ;;
  install)
    install_deps
    ;;
  *)
    cat <<EOF
Usage: $0 {start|stop|restart|status|logs|health|install}

Commands:
  start     Start backend and frontend in background (logs to $LOG_DIR)
  stop      Stop both services (by PID files)
  restart   Stop then start
  status    Show running status and PIDs
  logs      Tail both logs
  health    Simple HTTP health checks
  install   Run npm install in backend and frontend

Example:
  # make script executable once
  chmod +x $0

  # start both
  ./start-all.sh start

  # watch logs
  ./start-all.sh logs

  # stop
  ./start-all.sh stop
EOF
    ;;
esac
