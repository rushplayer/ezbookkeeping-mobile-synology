# ezBookkeeping 移动端与群晖定制版

基于 [mayswind/ezbookkeeping](https://github.com/mayswind/ezbookkeeping) 的移动网页界面定制工程。主要改善首页添加图片、账户与分类选择的使用体验，并提供适用于 **x86_64 群晖 Container Manager** 的镜像构建和部署配置。

本次改动基于上游 `main` 分支提交 `ec335702`，项目版本为 `2.2.0`。保留原项目功能与 MIT 许可证；本工程是个人定制版，与上游官方发布分开维护。

## 界面改动

- **首页添加图片**：首页顶部直接显示「添加图片」。选图后进入新增交易，自动将图片上传到该交易；填写其余信息后保存。入口随服务器的交易图片功能开关显示。
- **账户全屏选择**：分组和账户以左右两列展示，支持搜索、长列表滚动、当前选中提示和关闭返回。搜索其他分组的账户时自动展示匹配分组。
- **交易分类全屏选择**：保留一级/二级分类的树形结构，扩大可见区域，并提供搜索和清晰的导航标题。
- **账户类别列表**：编辑账户时，将底部选择改为完整弹窗列表，支持搜索。

## 群晖部署

完整操作见 **[群晖部署说明](SYNOLOGY.md)**。

| 文件 | 用途 |
| --- | --- |
| `Dockerfile.synology` | 在 Apple Silicon 上交叉构建 `linux/amd64` 镜像 |
| `compose.synology.yaml` | 群晖 Container Manager 项目配置，持久化数据库、图片和日志 |
| `.env.synology.example` | 群晖访问地址与固定密钥的配置模板，复制为 `.env` 后填写 |
| `SYNOLOGY.md` | 镜像导入、目录权限、启动、升级与校验说明 |

容器映像名：`ezbookkeeping:synology-amd64`。容器内端口为 `8080`，运行身份为 UID/GID `1000:1000`。手机入口为 `http://群晖IP:8080/mobile.html`。图片功能需要正确配置浏览器实际访问的 `EBK_SERVER_ROOT_URL`。

源码仓库不包含本地构建的镜像 tar、基础镜像归档、`node_modules`、数据库、上传图片或实际 `.env`。下载源码后可按下文重建；已有的本地交付文件仍保留在开发目录。

## 在 M4 上构建 x86 镜像

前端和 Go 编译器在 ARM 环境原生运行，通过 Go + Zig 将包含 SQLite CGO 的后端交叉编译为静态链接的 x86-64 程序，最终生成 `linux/amd64` 镜像。需要可用的 Docker Buildx 环境和构建依赖下载网络。

```sh
docker buildx build --platform linux/amd64 --file Dockerfile.synology \
  --output type=docker,dest=ezbookkeeping-synology-amd64.tar \
  --tag ezbookkeeping:synology-amd64 .
```

若使用本工程开发时的 Colima 环境，先运行 `colima start --profile ezbookkeep`。若 Homebrew 的 Buildx 未注册为 Docker 插件，将 `docker buildx` 替换为 `/opt/homebrew/bin/docker-buildx`。

## 已完成的验证

- Vue 类型检查及修改过的界面文件的 ESLint 检查通过。
- 前端生产构建和 PWA 构建通过。
- 在 320 px、390 px 手机宽度下检查账户与分类选择器的布局和交互。
- 最终镜像已成功导入，架构检查为 `linux/amd64`。
- 在 M4 的 amd64 临时容器中验证服务启动、SQLite 初始化、账户与类别创建、图片上传、带图交易保存以及交易和图片读回。

尚未在实际群晖设备上部署验证。迁移已有实例前应备份数据，沿用原来的数据库、图片存储和固定密钥，具体见部署说明。

## 上游与许可

上游项目：[mayswind/ezbookkeeping](https://github.com/mayswind/ezbookkeeping)。原项目说明保存在 [README.upstream.md](README.upstream.md)，官方文档见 [ezbookkeeping.mayswind.net](https://ezbookkeeping.mayswind.net/)。

遵循 [MIT License](LICENSE)，保留 MaysWind 及原贡献者的版权与提交历史。本次定制开发由 Cindy 协助完成。
