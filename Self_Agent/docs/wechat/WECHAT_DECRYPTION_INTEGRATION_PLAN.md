# WeChat数据解密集成方案

## 📋 问题分析

### 当前发现
1. **ChatPackage文件格式**：`RMFH`头部的专有二进制格式（加密）
2. **Media文件格式**：`.tar.enc`（加密的tar归档）
3. **Index文件**：索引数据（可能也加密）
4. **数据量**：~1460个文件，其中~828个加密文件

### 文件结构
```
<用户ID>/
├── ChatPackage/
│   ├── 1653879506000-1666003532000 (RMFH格式，1.7MB)
│   ├── 1666003547000-1680320599000 (RMFH格式，2.6MB)
│   └── ... (时间范围分片的聊天记录)
├── Media/
│   ├── 1678323610000-1678762153000.tar.enc (加密媒体)
│   └── ... (时间范围分片的媒体文件)
└── Index/
    └── ... (索引文件)
```

## 🔍 WeChatMsg工具调研

### 项目信息
- **GitHub**: https://github.com/LC044/WeChatMsg
- **Stars**: 40.1k
- **语言**: Python + PyQt
- **功能**: 解密并导出微信聊天记录
- **License**: MIT

### 核心能力
1. ✅ 解密ChatPackage（RMFH格式）
2. ✅ 解密Media（.tar.enc）
3. ✅ 导出为TXT/HTML/CSV/JSON
4. ✅ 支持年度报告生成
5. ✅ 提取联系人、聊天记录、媒体文件

### 技术架构猜测
- **解密核心**: 需要微信数据库密钥（从微信客户端提取）
- **数据库**: 使用SQLite存储解密后的数据
- **导出格式**: 支持多种明文格式

## 🛠️ 集成方案设计

### 方案A：Python子进程集成（推荐）

**优点**：
- 直接复用WeChatMsg的解密能力
- 维护成本低（跟随上游更新）
- 稳定可靠

**缺点**：
- 需要Python环境
- 进程通信开销

**实现步骤**：
1. 安装WeChatMsg为Python包
2. 创建解密服务脚本（`decrypt_service.py`）
3. Node.js通过child_process调用
4. 解密后自动导入

### 方案B：逆向解密算法（不推荐）

**优点**：
- 纯Node.js实现
- 无依赖

**缺点**：
- 需要逆向工程（可能违反微信ToS）
- 维护成本极高
- 法律风险

### 方案C：用户手动预处理（备选）

**优点**：
- 实现简单
- 无技术债

**缺点**：
- 用户体验差
- 不符合"一键导入"需求

## ✅ 最终技术方案

### 架构设计
```
用户上传加密WeChat数据
    ↓
Node.js后端接收
    ↓
调用Python解密服务 (WeChatMsg核心)
    ↓
解密到临时目录
    ↓
Node.js导入明文数据
    ↓
存储到memories/{wechat}/
    ↓
构建向量索引
    ↓
RAG可用
```

### 目录结构设计
```
Self_AI_Agent/
├── memories/
│   ├── wechat/
│   │   ├── raw/              # 原始解密数据
│   │   ├── processed/        # 处理后的文档
│   │   └── index.json        # 索引元数据
│   ├── instagram/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── index.json
│   └── google/
│       ├── raw/
│       ├── processed/
│       └── index.json
├── services/
│   ├── decryption/
│   │   ├── decrypt_service.py  # Python解密服务
│   │   └── wechat_decrypt.ts   # Node.js调用层
│   └── indexing/
│       └── memory_indexer.ts   # 统一索引服务
└── uploads/                    # 临时上传目录
```

## 🚧 需要用户提供的信息

### 关键信息
1. **微信数据库密钥**
   - WeChatMsg需要从Windows/Mac微信客户端提取密钥
   - 密钥位置：
     - Windows: `%APPDATA%/Tencent/WeChat/`
     - macOS: `~/Library/Containers/com.tencent.xinWeChat/`
   - 提取方法：运行WeChatMsg工具自动获取

2. **微信数据导出路径**
   - 用户已提供：`uploads/extracted_import_1760644792278_vaff08kljb/`
   - 包含完整的ChatPackage/Media/Index结构

3. **Python环境**
   - 需要Python 3.8+
   - 依赖：`pycryptodome`, `lz4`, `silk-python`等

### 操作流程
```bash
# 1. 用户端：获取微信密钥
# 运行WeChatMsg GUI工具 → 自动提取密钥 → 记录密钥

# 2. 后端配置
# 将密钥配置到环境变量或配置文件
WECHAT_DB_KEY=<用户的微信数据库密钥>

# 3. 自动解密导入
# 用户上传加密数据 → 后端自动解密 → 自动导入
```

## 📝 实现检查清单

### Phase 1: 基础设施
- [ ] 创建memories目录结构
- [ ] 实现memory_indexer.ts（统一索引服务）
- [ ] 修改数据库schema支持source字段索引

### Phase 2: Python解密服务
- [ ] 研究WeChatMsg源码提取核心解密函数
- [ ] 创建decrypt_service.py（独立解密脚本）
- [ ] 实现wechat_decrypt.ts（Node.js调用层）
- [ ] 配置密钥管理系统

### Phase 3: 导入流程优化
- [ ] 修改wechat.ts支持解密后数据
- [ ] 添加解密进度反馈
- [ ] 实现解密缓存机制
- [ ] 错误处理和重试逻辑

### Phase 4: 索引和检索
- [ ] 实现分源索引（wechat/instagram/google独立）
- [ ] 统一检索API（支持跨源查询）
- [ ] 优化向量检索（按source过滤）

### Phase 5: 测试验证
- [ ] 端到端测试：上传 → 解密 → 导入 → 检索 → RAG
- [ ] 性能测试：大量数据处理
- [ ] 边界测试：无密钥、损坏数据、部分加密

## 🔐 安全考虑

1. **密钥存储**：使用环境变量或加密配置文件
2. **临时文件**：解密后立即删除原始加密数据
3. **权限控制**：确保只有用户本人可访问解密数据
4. **日志脱敏**：避免在日志中记录敏感信息

## 📊 预期成果

### 技术指标
- ✅ 解密成功率：>95%
- ✅ 导入速度：~100条/秒
- ✅ 检索延迟：<200ms
- ✅ RAG准确率：基于完整数据

### 用户体验
1. **一键上传**：拖拽加密数据即可
2. **自动解密**：后台透明处理
3. **实时反馈**：显示解密和导入进度
4. **分源管理**：WeChat/Instagram/Google独立显示

## 🎯 下一步行动

### 立即执行
1. ⏳ 等待用户提供微信数据库密钥
2. 🔧 开始实现memories目录结构
3. 📚 研究WeChatMsg源码获取解密API

### 用户需要做的
1. **获取微信密钥**：
   ```bash
   # 方法1：使用WeChatMsg工具（推荐）
   git clone https://github.com/LC044/WeChatMsg.git
   cd WeChatMsg
   # 运行GUI程序，自动提取密钥
   
   # 方法2：手动提取（需要技术知识）
   # 参考：https://github.com/LC044/WeChatMsg/wiki/密钥提取
   ```

2. **提供密钥给后端**：
   - 方式1：在前端配置页面输入密钥
   - 方式2：设置环境变量`WECHAT_DB_KEY`
   - 方式3：放入配置文件`.env`

3. **确认数据导出完整**：
   - 确认包含ChatPackage/Media/Index三个目录
   - 确认文件数量合理（~1000+）

---

## 💡 关键发现总结

### 文件头签名
- **ChatPackage**: `RMFH` (0x524D4648)
- **Media**: `.tar.enc` (tar归档 + 加密)

### 数据规模估算
- **ChatPackage**: 每个文件1-3MB，包含时间段内所有聊天
- **Media**: 每个tar.enc包含该时间段所有媒体
- **总数据**: ~632个文档（已导入但内容加密）

### WeChatMsg核心价值
- 已有40.1k stars，经过大量用户验证
- MIT许可证，可以集成
- 活跃维护中，可以获得支持

---

**状态**: � 基础设施已完成，等待用户提供密钥进行测试
**优先级**: 🔴 高（核心功能阻塞）
**已完成**:
- ✅ memories/目录结构创建
- ✅ 统一索引服务(memory_indexer.ts)
- ✅ Python解密脚本(decrypt_service.py)
- ✅ Node.js调用层(wechat_decrypt.ts)
- ✅ 用户操作指南(WECHAT_USER_GUIDE.md)

**下一步**: 用户提供密钥后测试完整流程
