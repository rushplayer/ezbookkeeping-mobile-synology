# ezBookkeeping 移动端与群晖定制版

基于 [mayswind/ezbookkeeping](https://github.com/mayswind/ezbookkeeping) 的移动网页界面定制工程。主要改善交易表单的图片入口、账户与分类选择的使用体验，并提供适用于 **x86_64 群晖 Container Manager** 的镜像构建和部署配置。

本次改动基于上游 `main` 分支提交 `ec335702`，项目版本为 `2.2.0`。保留原项目功能与 MIT 许可证；本工程是个人定制版，与上游官方发布分开维护。

## 界面改动

- **r7 手机 dock**：移动端根视图跟随动态可视视口高度，避免 iPhone 浏览器可视区域变化时底部 dock 被裁切。
- **r6 手机首页**：移除首页顶部居中的应用名文字，保留 navbar 容器和固定底部 dock。
- **r4 电脑交易详情**：基本信息、图片、地理位置同页显示，去掉三项分页；分类与账户并排、收紧行距、描述按内容展开。照片直接显示缩略图并保留点击查看大图，有位置显示地图，无位置用短提示。保留交易类型、标签及编辑/删除/复制；手机端和新增/编辑布局沿用 r3。

- **系统数字键盘**：手机交易金额直接输入，取消自制计算器弹窗；保留金额精度、转账联动和原保存逻辑。
- **交易表单默认显示图片区域**：新增或编辑交易时，原有的图片区域直接显示在标签和描述之间，沿用原来的选图、上传、删除和保存逻辑。服务器开启交易图片功能时显示。首页取消下拉刷新导致的内容位移，并收紧月度支出卡片的顶部留白。
- **简化交易表单导航**：新增或编辑交易时隐藏右上角「…」，保留保存按钮和标签栏；查看交易时保留原菜单。
- **金额旁提示照片**：手机和桌面交易列表均在金额旁显示图片标记，桌面悬停可看图片数量。首次升级自动开启，保留之后手动关闭此显示选项的选择。
- **按年查看交易**：桌面左侧支持「按年 / 按月」切换，点击年份即可查看全年并继续分页；保留月份与日历视图。手机日期筛选中可选择「今年」「去年」及自定义全年日期。
- **账户全屏选择**：分组和账户以左右两列展示，支持搜索、长列表滚动、当前选中提示和关闭返回。搜索其他分组的账户时自动展示匹配分组。
- **交易分类全屏选择**：保留一级/二级分类的树形结构，扩大可见区域，并提供搜索和清晰的导航标题。
- **账户类别列表**：编辑账户时，将底部选择改为完整弹窗列表，支持搜索。

## 群晖部署

完整操作见 **[群晖部署说明](SYNOLOGY.md)**。

**群晖已经运行 ezBookkeeping 时，只需导入定制镜像并替换原服务的映像，原端口、数据目录和配置继续使用，无须新建 `.env` 或重新填写设置。** 项目部署只将原 YAML 中的 `image` 改为 `ezbookkeeping:synology-amd64-20261110-r7`。新装示例仅供从零部署，不能覆盖已有配置。

| 文件 | 用途 |
| --- | --- |
| `Dockerfile.synology` | 在 Apple Silicon 上交叉构建 `linux/amd64` 镜像 |
| `compose.synology.yaml` | 群晖 Container Manager 项目配置，持久化数据库、图片和日志 |
| `.env.synology.example` | 群晖访问地址与固定密钥的配置模板，复制为 `.env` 后填写 |
| `SYNOLOGY.md` | 镜像导入、目录权限、启动、升级与校验说明 |

容器映像名：`ezbookkeeping:synology-amd64-20261110-r7`。容器内端口为 `8080`，运行身份为 UID/GID `1000:1000`。手机入口为 `http://群晖IP:8080/mobile`，桌面入口为 `/desktop`。图片功能需要正确配置浏览器实际访问的 `EBK_SERVER_ROOT_URL`。

现成镜像见 **[最新版本下载](https://github.com/rushplayer/ezbookkeeping-mobile-synology/releases/latest)**，下载附件 `ezbookkeeping-synology-amd64-20261110-r7.tar` 后在 Container Manager 中从文件导入。

源码仓库不包含本地构建的镜像 tar、基础镜像归档、`node_modules`、数据库、上传图片或实际 `.env`。下载源码后可按下文重建；已有的本地交付文件仍保留在开发目录。

## 在 M4 上构建 x86 镜像

前端和 Go 编译器在 ARM 环境原生运行，通过 Go + Zig 将包含 SQLite CGO 的后端交叉编译为静态链接的 x86-64 程序，最终生成 `linux/amd64` 镜像。需要可用的 Docker Buildx 环境和构建依赖下载网络。

```sh
docker buildx build --platform linux/amd64 --file Dockerfile.synology \
  --output type=docker,dest=ezbookkeeping-synology-amd64-20261110-r7.tar \
  --tag ezbookkeeping:synology-amd64-20261110-r7 .
```

若使用本工程开发时的 Colima 环境，先运行 `colima start --profile ezbookkeep`。若 Homebrew 的 Buildx 未注册为 Docker 插件，将 `docker buildx` 替换为 `/opt/homebrew/bin/docker-buildx`。

## 已完成的验证

- r7：前端/PWA 生产构建通过。393 × 852 浏览器视口测试中，将 `html/body` 模拟为 900 px 高、可视区保持 852 px；Framework7 根视图和 dock 仍以 852 px 为底边，五个入口的图标与标签均在可视范围内。此为视口几何模拟，未在真实 iPhone 或群晖设备上实测。
- r4：类型检查、修改文件的 ESLint、前端/PWA 生产构建通过。最终 linux/amd64 镜像网页显示提交号 2842ac9；在 1280 px 与 820 px 窗口检查同页照片和地图、无图片/位置的空状态、转账双金额与账户、多行描述、只读状态和编辑分页切换。图片上传、保存、读回与大图查看通过；手机端源码及后端业务代码未改。

- r3：类型检查、修改文件的 ESLint 和 151 项金额、日期、偏好设置测试通过。最终镜像中实测 `85.27` 保存为 `8527` 最小货币单位，`10.29` 转账两边联动并保存；拒绝超限金额、非数字和多余小数，查看模式保持只读。
- r3：首页没有下拉刷新容器或加载占位，限制首页滚动回弹；月度卡片原来的大块顶部留白已收紧。桌面金额旁照片标记和全年筛选也在最终镜像中确认。
- Vue 类型检查、修改文件的 ESLint 检查及 82 项日期与偏好迁移测试通过。
- 前端生产构建和 PWA 构建通过。
- 在 320 px、390 px 手机宽度下检查金额旁照片标记；交易表单保留标签、直接显示原图片区域，隐藏新增交易右上角的「…」。账户与分类全屏选择器也已检查。
- 最终镜像归档平台为 `linux/amd64`；桌面页面已验证照片数量提示、全年筛选、上一年切换，以及 16 笔全年交易按 15 + 1 分页。
- 在 M4 的 amd64 临时容器中验证服务启动、SQLite 初始化、图片上传、带图交易保存与图片读回，以及 HTTPS 汇率请求。

M4 模拟 x86 运行时曾在 HTTPS 证书处理处崩溃；r3 验证中还出现过 SQLite 调用栈上的运行时崩溃。临时测试容器使用 `GODEBUG=cpu.all=off` 和 `GOMAXPROCS=1` 后完成页面检查和 12 次全年列表查询。这两个参数仅用于本机测试，未写入镜像；尚不能据此判断实际 x86 设备是否会遇到同类问题。

尚未在实际群晖设备上部署验证。迁移已有实例前应备份数据，沿用原来的数据库、图片存储和固定密钥，具体见部署说明。

## 上游与许可

上游项目：[mayswind/ezbookkeeping](https://github.com/mayswind/ezbookkeeping)。原项目说明保存在 [README.upstream.md](README.upstream.md)，官方文档见 [ezbookkeeping.mayswind.net](https://ezbookkeeping.mayswind.net/)。

遵循 [MIT License](LICENSE)，保留 MaysWind 及原贡献者的版权与提交历史。本次定制开发由 Cindy 协助完成。
