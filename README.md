# dsh-feng-gu-lite

极简、离线的 DeepSeek Harness 会话输入框下方指示器。正常仅显示 **梁文峰**（警示图标、暖色）或 **梁文谷**（弱化色），日历歧义/缺口在可能峰窗口显示 **时段待确认**（不提醒）；高峰进入和高峰中打开/切换会话时，在窗口顶部显示同名、非阻塞短暂提醒。无声音，无点击，无输入/发送拦截；定时刷新不重复提醒。呼吸仅约 2.7 秒，`prefers-reduced-motion: reduce` 完全关闭动画，静态提醒仍短暂显示。

## 状态与日历

规则来源：[DeepSeek 官方定价页](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)。北京时间周一至周五（不含中国法定节假日）09:00–12:00、14:00–18:00为高峰，其余含周末全天空闲。显示计算使用 `[09:00,12:00)` 与 `[14:00,18:00)` 半开区间；这是本插件边界约定，**不是实际账单保证**。调休上班周末仍依据官方“周一至周五”判为空闲。

`src/calendar.js` 提供离线注入数据：`years` 明确声明完整覆盖年份，`holidays` 日期字符串集合，`uncertain` 为已知歧义日期，`source` 记录证据。`createCalendar(data)` 将输入复制成独立集合；`periodAt(timestamp, calendar)` 接受此接口。不得把未覆盖年份当成无节假日。未覆盖年份/歧义日如果处于工作日可能峰窗口，返回 `unknown`，**仅显示“时段待确认”，不显示误导性的峰或谷，也不提醒**；周末和非峰窗口仍可确定为空闲。没有联网回退，也不在用户 UI 显示日历/规则/来源。

当前离线数据仅覆盖 **2026**。法定本日13天依据[国务院令第795号《全国年节及纪念日放假办法》](https://www.gov.cn/zhengce/content/202411/content_6986380.htm)，完整放假安排依据[国务院办公厅2026年通知](https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm)。春节本日为除夕与正月初一至初三（2026-02-16至19），端午五月初五为06-19，中秋八月十五为09-25；已用 Node Intl 中国农历独立检查映射。放假区间中非法定本日的平日（01-02、02-20、02-23、04-06、05-04、05-05、10-05至07）按用户确认视为歧义：高峰窗口显示“时段待确认”，并非自行认定谷。法定本日为谷，周末不论调休均谷。DeepSeek定价页未定义调休放假与法定本日的细分，故保留不确定性而非承诺账单。未来年份必须人工核实后添加。

## 构建与自检

无需安装依赖。Node.js 18+（本机执行 Node.js v24.19.0）：

```powershell
node scripts/build.mjs
node --check lib/client.js
node --test
```

`src/` 为源码，`scripts/build.mjs` 将纯逻辑与客户端合成无外部本地 import 的 `lib/client.js`；React 由宿主模块系统提供。`lib/index.js` 为无操作服务端入口，`cordis.patch.yml` 为最小 bundle 补丁。`node --test` 覆盖北京时间/UTC跨日跨年、周末、节假日、四个半开边界、未知覆盖、日历注入、提醒去重与会话切换、定时器/监听清理，以及客户端 factory/slot 注册/基本渲染的 VM smoke test。

VM smoke test **不是浏览器或桌面视觉验证**：没有验证真实 React reconciler、DOM布局、桌面路由切换、系统 reduced-motion、动画观感或窗口前后台节流后的端到端效果。需要后续获准安装后在真实 desktop 实测，尤其窄窗口布局和 `useSession` hook 稳定性。

## 安装边界

目标运行时：desktopVersion `0.2.0-rc.2`。已只读检查本机 app.asar 中 `@deepseek-ai/dsh-client-ui-conversation/lib/client.js`：`conversation.composer.dock` 是 `kind=list, scope=session`；`@deepseek-ai/dsh-client-ui-renderer/lib/client.js` 的标准组件 props 中 `useSession` 按 source 缓存，用其稳定引用识别会话，不读取会话正文。客户端用 `ctx.slots.inject` + `ctx.slots.register` 注册，slot disposer 交宿主管理；组件卸载清理间隔、可见性监听和提醒 timeout。

### Windows 手动安装本地包

先保存工作并**完全退出 DeepSeek Harness 桌面版（包括托盘进程）**。将 `dsh-feng-gu-lite-0.1.0.tgz` 下载或复制到当前目录，再在 PowerShell 中执行：

```powershell
$desktop = Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness'
$cli = Join-Path $desktop 'resources\runtime\cli\bin\dsh.cmd'
$package = (Resolve-Path -LiteralPath '.\dsh-feng-gu-lite-0.1.0.tgz').Path
if (-not (Test-Path -LiteralPath $cli)) {
  throw '未找到桌面自带 CLI；请将 $desktop 改为实际桌面安装目录。'
}
& $cli plugin --profile desktop add $package
if ($LASTEXITCODE -ne 0) { throw '插件安装失败，请检查 CLI 输出。' }
```

以上使用桌面自带运行时；默认 Windows 安装位置已在本机核对，非默认安装需要调整 `$desktop`。不要对 desktop profile 使用 npm 版 CLI，不要手改运行中的 profile。安装命令会修改 desktop profile，须由用户主动执行；本次发布准备不会执行它。安装后重新打开桌面，在会话输入框下方检查指示器，并切换会话、调整窗口宽度、开启系统减少动态效果设置进行人工检查。

已有用户反馈安装操作完成，但本次自动验收没有复查 desktop profile，也没有完成真实桌面的视觉/交互验收。安装反馈不等同于装载兼容或视觉通过；上面的 VM smoke test 局限仍然适用。

## 公开发布（v0.1.0）

许可证为 [MIT](./LICENSE)，版权标注为 `dsh-feng-gu-lite contributors`。源码仓库：[linglanxin/dsh-feng-gu-lite](https://github.com/linglanxin/dsh-feng-gu-lite)；[v0.1.0 Release](https://github.com/linglanxin/dsh-feng-gu-lite/releases/tag/v0.1.0) 提供源码及 [tgz 安装包](https://github.com/linglanxin/dsh-feng-gu-lite/releases/download/v0.1.0/dsh-feng-gu-lite-0.1.0.tgz)，SHA-256 见 Release 说明。问题反馈：[Issues](https://github.com/linglanxin/dsh-feng-gu-lite/issues)。**未执行 npm 发布，未提交插件市场申请，也不表示市场已收录。**

在项目根目录重新验证并打包（无依赖，无需 `npm install`）：

```powershell
node scripts/build.mjs
node --check lib/client.js
node --test
npm pack --ignore-scripts --cache .\.npm-cache
# 检查发布附件内容及 SHA-256，保存哈希用于下载校验
tar -tzf .\dsh-feng-gu-lite-0.1.0.tgz
Get-FileHash .\dsh-feng-gu-lite-0.1.0.tgz -Algorithm SHA256
```

`package.json` 的 `files` 白名单只包含 `lib/`、`src/`、`scripts/`、`test/`、`cordis.patch.yml`、`README.md`、`LICENSE`；npm 另自动包含 `package.json`。缓存与本地 tgz 不进入安装包。`.gitignore` 排除本地 npm 缓存、账户配置、环境文件、依赖和临时输出；它不会删除已有文件，也不能替代公开前的暂存区检查。

发布源码时应检查暂存清单，避免提交 `.npm-cache/`、`.npmrc`、`.env*`、日志、账户资料或其他本地文件。本项目的 GitHub Release 不等同于 npm 或插件市场发布；若以后申报插件市场，需等待仓库创建满 24 小时，再单独按市场流程提交并核实收录结果。

## 复用检索与最小权限

已加载 `dsh-reuse-first`，用附带 `search-catalog.mjs pricing --limit 4` 查询 awesome-dsh-plugin 目录，并只读取得 GitHub `ZhangBo-cmd/dsh-pricing-badge` 的 `package.json`、`lib/client.js`、`cordis.patch.yml` 参考接口。目录候选 `dsh-pricing-badge` 0.1.3 标注 `network, credentials, env`，还显示价格、规则、余额，不符合需求；`dsh-peak-pricing-warning` 也有 network/倒计时/费用。采用独立实现，仅参考模块工厂与 slot 接口，没有复制整份插件。

运行时代码不请求网络、不读取密钥/环境变量/账户、不声明 network 或 credentials 权限、不持久化任何数据，不调用模型。无 npm dependencies；没有构建期网络请求。检索阶段的网络访问不属于插件运行时能力。
