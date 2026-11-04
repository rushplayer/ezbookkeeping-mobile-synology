# 群晖 x86_64 部署

本次镜像：`ezbookkeeping:synology-amd64`，平台 `linux/amd64`，适用于 Intel/AMD x86_64 群晖的 Container Manager / Docker。基于官方 main 分支 `ec33570`（2.2.0），后端版本标记为 `2.2.0-mobile-ui`。

## 界面变化

- 移动端首页顶部默认显示「添加图片」。选择或拍摄图片后进入新增交易，并自动上传到该交易的图片区域；仍需填写并保存交易。服务器开启交易图片功能时显示。
- 交易编辑中的账户选择改为全屏，按左右两列展示分组与账户，支持搜索。
- 交易分类选择改为全屏树形列表，支持搜索和一级/二级分类。
- 编辑账户时的「账户类别」改用完整弹窗列表，支持搜索。

## Container Manager 图形界面

1. 在群晖新建一个目录，例如 `/volume1/docker/ezbookkeep-mobile`。将 `ezbookkeeping-synology-amd64.tar`、`compose.synology.yaml` 和 `.env.synology.example` 复制到该目录。
2. 在 Container Manager → 映像 → 新增 → 从文件新增，导入 tar。导入后映像名应为 `ezbookkeeping:synology-amd64`。此映像只需本地导入，不需要推送或从仓库拉取。
3. 将 `.env.synology.example` 复制为 `.env`，填写群晖 IP/域名、实际访问 URL 和自己的固定随机密钥。可在电脑终端运行 `openssl rand -hex 32` 生成密钥，再填入 `.env`。URL 以 `/` 结尾；经过反向代理访问时，填浏览器实际使用的 HTTPS URL。
4. 在项目目录内建立 `data`、`storage`、`log` 三个子目录。容器使用 UID/GID `1000:1000`，这些目录须允许该身份写入。可用 DSM 权限设置；使用 SSH 的管理员也可在确认目录正确后运行下方命令。
5. Container Manager → 项目 → 新增，选择该项目目录，使用现有 `compose.synology.yaml`（或将其复制为 `compose.yaml`），构建并启动。
6. 手机浏览器访问 `http://群晖IP:8080/mobile.html`，注册/登录后使用。若 8080 已被占用，只修改端口映射左侧，如 `18080:8080`，并同步修改 `.env` 的 URL。

新建目录的 SSH 示例（路径需对应自己的项目目录）：

```sh
cd /volume1/docker/ezbookkeep-mobile
mkdir -p data storage log
sudo chown -R 1000:1000 data storage log
```

如果项目向导未读取 `.env`，可将 Compose 的三个 `${…}` 值替换为自己的实际值；密钥应妥善保存。

## SSH 导入与启动

在上述目录和 `.env` 已准备好后：

```sh
docker load --input ezbookkeeping-synology-amd64.tar
docker image inspect ezbookkeeping:synology-amd64 --format '{{.Os}}/{{.Architecture}}'
docker compose -f compose.synology.yaml config --quiet
docker compose -f compose.synology.yaml up -d
```

架构检查应输出 `linux/amd64`。旧版环境的命令可能是 `docker-compose`。

## 持久化与已有数据

- `data` 存储 SQLite 数据库，`storage` 存储上传图片，`log` 存储日志；三个目录都保存在 NAS 上。
- 更新镜像前，停止旧实例并备份原数据库、图片和配置。迁移时应沿用原来的数据挂载、数据库类型和 `secret_key`；本示例是新建 SQLite 实例的配置，不能直接代替已有 MySQL/PostgreSQL 或自定义配置。
- 避免新旧容器同时写同一个 SQLite 数据库。不要用空目录覆盖原数据挂载，也不要删除原图片目录。
- 图片加载依赖正确的 `EBK_SERVER_ROOT_URL`。更换访问地址后同步更新它。
- 升级后若手机仍显示旧界面，刷新并清除该站点的 PWA/离线缓存，再访问 `mobile.html`。

## 校验与重建

本次交付 tar 的 SHA-256 为：

```text
d2d7a9be608c5e9caa052e6e321af4de7b19768a2655c2965a3164fe9712b18f
```

传输后可计算并与上值核对（重新构建后哈希会改变）：

```sh
sha256sum ezbookkeeping-synology-amd64.tar
```

macOS 可使用 `shasum -a 256 ezbookkeeping-synology-amd64.tar`。

在源码目录重建：

本次验证后已停止临时容器和 Colima 环境以释放内存；在这台 M4 上重建前先运行 `colima start --profile ezbookkeep`。

```sh
docker buildx build --platform linux/amd64 --file Dockerfile.synology \
  --output type=docker,dest=ezbookkeeping-synology-amd64.tar \
  --tag ezbookkeeping:synology-amd64 .
```

若 Homebrew 的 buildx 没注册为 Docker 插件，将 `docker buildx` 换成 `/opt/homebrew/bin/docker-buildx`。构建需要访问 Node、Alpine、npm 和 Go 下载源。

M4 可以构建此 x86 镜像：前端和 Go 编译器在 ARM 原生运行，Go + Zig 将包含 SQLite CGO 的后端交叉编译为静态链接的 x86-64 程序，最终打包为 amd64 Alpine 镜像。源码、下载的基础镜像归档和交付文件位于 `/Users/k/code/ezbookkeep`，基础镜像归档在 `.build-cache/`；Docker/Colima 自身的运行环境和构建层另由容器引擎管理。

已在 M4 上用 amd64 临时容器验证服务启动、SQLite 初始化、图片上传、带图交易保存及图片读回。前端通过类型检查、修改文件的 ESLint 检查及生产构建。尚未在实际群晖设备上运行。
