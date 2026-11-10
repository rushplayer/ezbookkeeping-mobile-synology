# 群晖 x86_64 部署

本次镜像：`ezbookkeeping:synology-amd64-20261110-r8`，平台 `linux/amd64`，适用于 Intel/AMD x86_64 群晖的 Container Manager / Docker。基于官方 main 分支 `ec33570`（2.2.0），后端版本标记为 `2.2.0-mobile-ui-r8`。

## 已有 ezBookkeeping：沿用设置，只替换镜像

如果群晖上已经运行 ezBookkeeping，直接使用 `ezbookkeeping-synology-amd64-20261110-r8.tar` 即可。下面的新装 Compose 和 `.env` 示例只供新建实例使用，现有实例无须重新配置。

1. 先停止旧容器并备份原数据库、图片和配置。确认数据和自定义配置已挂载到 NAS 目录；若只存在旧容器内部，先导出再重建。
2. 在 Container Manager → 映像 → 新增 → 从文件新增，导入 tar，得到 `ezbookkeeping:synology-amd64-20261110-r8`。
3. 用该映像重建原服务，沿用原来的端口、目录挂载、环境变量、自定义配置、启动命令和网络。原来的密钥、访问地址和数据库设置都继续使用。
4. 启动后，用原来的地址登录；手机入口为 `/mobile`，桌面入口为 `/desktop`。在容器详情中核对映像标签带有 `20261110-r8`；仅导入映像不会自动替换已经运行的旧容器。

若原服务由 Container Manager「项目」管理，只修改原项目 YAML 的这一项，再重新部署项目：

```yaml
image: ezbookkeeping:synology-amd64-20261110-r8
```

其余项目配置保持原样，使用刚导入的本地映像。不要将本文件的新装示例覆盖到现有项目上。

本镜像沿用官方映像的运行身份 `1000:1000`、内部端口 `8080`、工作目录 `/ezbookkeeping` 和官方启动脚本，继续支持 `EBK_CONF_PATH` 与原有 `EBK_...` 环境变量。数据库、图片和配置的挂载位置与官方映像一致。不同旧版本升级时仍应先保留备份。

## 界面变化

- **r7 手机 dock**：移动端根视图改用动态可视视口高度，避免 iPhone 浏览器界面变化时把底部 dock 裁切。
- **r8 电脑交易详情**：账单分类之后按交易时间、描述、地理位置、图片、账户、标签、交易时区纵向排列；新增和编辑表单沿用原布局。
- **r6 手机首页**：移除首页顶部居中的应用名文字，保留 navbar 容器和固定底部 dock。
- **r4 电脑交易详情**：基本信息、图片、地理位置同页显示，去掉三项分页；分类与账户并排、收紧行距、描述按内容展开。照片直接显示缩略图并保留点击查看大图，有位置显示地图，无位置用短提示。保留交易类型、标签及编辑/删除/复制；手机端和新增/编辑布局沿用 r3。

- 手机交易金额改用普通输入框和系统数字键盘，取消自制计算器弹窗；保留金额精度和转账联动。
- 新增或编辑交易时，原有图片区域直接显示在标签和描述之间，沿用原来的图片上传和交易保存逻辑。服务器开启交易图片功能时显示；首页取消下拉刷新导致的内容位移，并收紧月度支出卡片的顶部留白。
- 新增或编辑交易时隐藏右上角「…」，保留标签栏及保存按钮。
- 手机及桌面交易列表在金额旁显示图片标记，桌面悬停可查看图片数量；首次升级自动开启，之后仍可在偏好设置中关闭。
- 桌面交易列表左侧支持按年、按月切换和年份选择，全年数据继续分页；手机的日期筛选支持今年、去年或自定义全年范围。
- 交易编辑中的账户选择改为全屏，按左右两列展示分组与账户，支持搜索。
- 交易分类选择改为全屏树形列表，支持搜索和一级/二级分类。
- 编辑账户时的「账户类别」改用完整弹窗列表，支持搜索。

## 新建实例：Container Manager 图形界面

1. 在群晖新建一个目录，例如 `/volume1/docker/ezbookkeep-mobile`。将 `ezbookkeeping-synology-amd64-20261110-r8.tar`、`compose.synology.yaml` 和 `.env.synology.example` 复制到该目录。
2. 在 Container Manager → 映像 → 新增 → 从文件新增，导入 tar。导入后映像名应为 `ezbookkeeping:synology-amd64-20261110-r8`。此映像只需本地导入，不需要推送或从仓库拉取。
3. 将 `.env.synology.example` 复制为 `.env`，填写群晖 IP/域名、实际访问 URL 和自己的固定随机密钥。可在电脑终端运行 `openssl rand -hex 32` 生成密钥，再填入 `.env`。URL 以 `/` 结尾；经过反向代理访问时，填浏览器实际使用的 HTTPS URL。
4. 在项目目录内建立 `data`、`storage`、`log` 三个子目录。容器使用 UID/GID `1000:1000`，这些目录须允许该身份写入。可用 DSM 权限设置；使用 SSH 的管理员也可在确认目录正确后运行下方命令。
5. Container Manager → 项目 → 新增，选择该项目目录，使用现有 `compose.synology.yaml`（或将其复制为 `compose.yaml`），构建并启动。
6. 手机浏览器访问 `http://群晖IP:8080/mobile`，注册/登录后使用。若 8080 已被占用，只修改端口映射左侧，如 `18080:8080`，并同步修改 `.env` 的 URL。

新建目录的 SSH 示例（路径需对应自己的项目目录）：

```sh
cd /volume1/docker/ezbookkeep-mobile
mkdir -p data storage log
sudo chown -R 1000:1000 data storage log
```

如果项目向导未读取 `.env`，可将 Compose 的三个 `${…}` 值替换为自己的实际值；密钥应妥善保存。

## 新建实例：SSH 导入与启动

在上述目录和 `.env` 已准备好后：

```sh
docker load --input ezbookkeeping-synology-amd64-20261110-r8.tar
docker image inspect ezbookkeeping:synology-amd64-20261110-r8 --format '{{.Os}}/{{.Architecture}}'
docker compose -f compose.synology.yaml config --quiet
docker compose -f compose.synology.yaml up -d
```

架构检查应输出 `linux/amd64`。旧版环境的命令可能是 `docker-compose`。

## 持久化与已有数据

- `data` 存储 SQLite 数据库，`storage` 存储上传图片，`log` 存储日志；三个目录都保存在 NAS 上。
- 更新镜像前，停止旧实例并备份原数据库、图片和配置。迁移时应沿用原来的数据挂载、数据库类型和 `secret_key`；本示例是新建 SQLite 实例的配置，不能直接代替已有 MySQL/PostgreSQL 或自定义配置。
- 避免新旧容器同时写同一个 SQLite 数据库。不要用空目录覆盖原数据挂载，也不要删除原图片目录。
- 图片加载依赖正确的 `EBK_SERVER_ROOT_URL`。更换访问地址后同步更新它。
- 升级后若手机仍显示旧界面，刷新并清除该站点的 PWA/离线缓存，再访问 `/mobile`。

## 校验与重建

r7 的 393 × 852 移动视口模拟中，页面根视图与可视高度一致（852 px），dock 的 5 个入口及文字标签全部处于可视区域内。尚未在真实 iPhone 或群晖设备上实机验证。

r8 桌面详情使用构建后的 CSS 实测字段布局位置：账单分类、交易时间、描述、地理位置、图片、账户、标签、交易时区，逐项位于上一项下方并占满一行。ESLint、Vue 类型检查和前端/PWA 生产构建通过。

本次交付 tar 的 SHA-256 见对应 GitHub Release 附件的 `digest` 和发布说明。

传输后可计算并与发布说明核对（重新构建后哈希会改变）：

```sh
sha256sum ezbookkeeping-synology-amd64-20261110-r8.tar
```

macOS 可使用 `shasum -a 256 ezbookkeeping-synology-amd64-20261110-r8.tar`。

在源码目录重建：

在这台 M4 上使用本工程的 Colima 构建环境时，重建前先运行 `colima start --profile ezbookkeep`。

```sh
docker buildx build --platform linux/amd64 --file Dockerfile.synology \
  --output type=docker,dest=ezbookkeeping-synology-amd64-20261110-r8.tar \
  --tag ezbookkeeping:synology-amd64-20261110-r8 .
```

若 Homebrew 的 buildx 没注册为 Docker 插件，将 `docker buildx` 换成 `/opt/homebrew/bin/docker-buildx`。构建需要访问 Node、Alpine、npm 和 Go 下载源。

M4 可以构建此 x86 镜像：前端和 Go 编译器在 ARM 原生运行，Go + Zig 将包含 SQLite CGO 的后端交叉编译为静态链接的 x86-64 程序，最终打包为 amd64 Alpine 镜像。源码、下载的基础镜像归档和交付文件位于 `/Users/k/code/ezbookkeep`，基础镜像归档在 `.build-cache/`；Docker/Colima 自身的运行环境和构建层另由容器引擎管理。

r4 验证：r4：类型检查、修改文件的 ESLint、前端/PWA 生产构建通过。最终 linux/amd64 镜像网页显示提交号 2842ac9；在 1280 px 与 820 px 窗口检查同页照片和地图、无图片/位置的空状态、转账双金额与账户、多行描述、只读状态和编辑分页切换。图片上传、保存、读回与大图查看通过；手机端源码及后端业务代码未改。

此前 r3 镜像已在本机 amd64 临时容器中检查交易表单、金额旁照片标记、照片数量提示、全年筛选、上一年切换及全年交易分页。类型检查、修改文件的 ESLint、82 项日期与偏好迁移测试、前端/PWA 生产构建通过；SQLite 与图片上传保存读回流程也已验证。

M4 模拟 x86 运行时曾在 HTTPS 证书处理处崩溃；r3 验证中还出现过 SQLite 调用栈上的运行时崩溃。测试容器使用 `GODEBUG=cpu.all=off` 与 `GOMAXPROCS=1` 后完成界面检查和 12 次全年列表查询。这两个参数只用于本机测试，未加入群晖镜像；尚不能据此判断真实 x86 设备是否会遇到同类问题，未在实际群晖设备上运行。

## 旧配置启动报错

若日志出现 `invalid oauth 2.0 user identifier`，说明当前配置中的 `[auth] oauth2_user_identifier` 缺失、为空或值不受支持。使用普通账号密码登录时，可在原容器环境变量中补充 `EBK_AUTH_OAUTH2_USER_IDENTIFIER=email` 再启动；它不会开启 OAuth，也无需更改原数据挂载。使用第三方登录时，按原身份提供商实际配置选择 `email` 或 `username`。
