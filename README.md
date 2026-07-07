# La Taste x 3悦 免费电子预订本 + 邀请函系统

这是一个完全免费的静态网页系统，使用纯 HTML + CSS + JavaScript 制作，不需要数据库、不需要登录、不需要收费 API、不需要 Google Sheet API，也不需要服务器费用。正式站点名称：`La Taste e invitation card`。

资料会保存在员工当前手机或电脑浏览器的 `localStorage`。同一台设备再次打开会看到之前保存的预订；换设备不会自动同步。

## 文件说明

- `index.html`：入口页
- `admin.html`：电子预订本、日历、桌位状态、客户运营、营销发券、巡台核餐
- `invitation.html`：顾客打开后看到的电子邀请函页面
- `style.css`：页面设计、颜色、动画、手机版样式
- `script.js`：本机保存、日历筛选、客户分类、纪念日提醒、WhatsApp、分享功能
- `README.md`：使用说明
- `images/placeholder-hero.png`：封面 placeholder 图片
- `images/placeholder-buffet.png`：Buffet / Canapé placeholder 图片
- `images/la-taste-cover.png`：目前使用的真实店面封面图片

## 怎样打开 admin.html

直接用浏览器打开 `admin.html`。

如果已经部署到 Netlify，员工打开的网址会类似：

```text
https://la-taste-e-invitation-card.netlify.app/admin.html
```

## 员工怎样填写资料

员工在 `admin.html` 的 `新增预订` 填写：

1. 顾客姓名
2. 电话号码
3. 日期
4. 时间
5. 人数
6. 活动类型
7. 桌位 / 包厢
8. 状态
9. 纪念日
10. 忌口 / 过敏
11. 备注

点击 `保存预订` 后，资料会保存到这台设备的浏览器里。

## 电子预订本和日历怎样用

打开 `admin.html` 后，先看 `预订日历`。

这里会显示：

- 当日预订数量
- 当日总人数
- 已确认数量
- 近 7 天预订日历
- 包厢 / 桌位空着还是已占用
- 当日预订列表
- 熟客、VIP、沉睡客户、忌口和备注标签

## 客户精细化运营怎样用

进入 `客户运营`。

系统会根据同一个电话号码的预订次数自动整理客户：

- 新客户
- 熟客
- VIP
- 沉睡客户

如果填写了纪念日，系统会在 `纪念日提醒` 里显示未来 30 天快到的客户，并提供 WhatsApp 祝福按钮。

## AI 自动化营销怎样用

进入 `自动营销`。

点击 `生成本月发券名单`，系统会整理适合发券的熟客、VIP 或沉睡客户，并生成 WhatsApp 发券按钮。

免费静态版不会真正自动群发，因为自动发短信、自动 WhatsApp、每月定时任务都需要服务器或第三方 API。这个版本是手动点击发送，避免收费和封号风险。

## 巡台与核餐怎样用

进入 `巡台核餐`。

员工可以选择当天预订，记录餐中情况，例如：

- 加毛巾
- 宝宝椅
- 忌口提醒
- 客人赶时间
- 甜品先上

新增预订页也有 `核餐确认` 按钮，会自动生成 WhatsApp 确认文字给顾客。

系统会自动把资料放进邀请函链接里，例如：

```text
invitation.html?name=Mr%20Tan&phone=0123456789&date=2026-06-20&time=7:00pm&pax=10&type=Birthday&note=需要靠近舞台
```

## 怎样复制邀请函链接

填写资料后，页面下方会出现完整邀请函链接。

点击 `复制链接` 按钮，就可以复制邀请函链接。

## 怎样 WhatsApp 给顾客

填写顾客电话号码后，点击 `WhatsApp 发送` 按钮。

系统会打开 WhatsApp，并自动带出邀请函文字和链接。员工检查内容后再发送给顾客。

## 怎样替换图片

目前页面使用本地 placeholder 图片。要换成真实餐厅照片，可以把新照片放进 `images` 文件夹，然后修改 `style.css` 里的图片路径。

找到这些位置：

```css
.hero-media {
  background: url("images/你的封面照片.jpg") center/cover;
}

.invite-cover {
  background: url("images/你的封面照片.jpg") center/cover;
}

.feature-photo {
  background: url("images/你的Buffet照片.jpg") center/cover;
}
```

如果你的照片名称是 `cover.jpg`，并且放在 `images` 文件夹，可以写成：

```css
url("images/cover.jpg")
```

建议图片尺寸：

- 封面图：竖版或横版都可以，建议至少 1200px 宽
- 菜品图：建议明亮、真实、不要太暗
- 不要使用包厢照片，因为当前版本定位是电子邀请函和 event space 介绍

## 怎样修改文字

品牌、介绍、菜品、Buffet / Canapé 文案主要在 `invitation.html`。

打开 `invitation.html`，直接修改对应中文内容即可。

按钮电话和地图链接在 `script.js` 顶部：

```js
const mapsUrl = "https://maps.google.com/";
const restaurantWhatsapp = "60124633400";
```

把 Google Maps placeholder 换成真实 Google Maps 链接，把 WhatsApp 电话换成餐厅正式号码即可。

## 怎样部署到 Netlify

1. 登录 Netlify
2. 选择 `Add new site`
3. 选择 `Import an existing project`
4. 连接 GitHub repo
5. 选择这个项目
6. Site name 填：`la-taste-e-invitation-card`
7. Publish directory 保持项目根目录
8. 部署完成后，公开网址会是：

```text
https://la-taste-e-invitation-card.netlify.app/
```

完成后，员工使用：

```text
https://la-taste-e-invitation-card.netlify.app/admin.html
```

顾客打开的邀请函链接会是：

```text
https://la-taste-e-invitation-card.netlify.app/invitation.html?name=...
```

本机测试的 `http://127.0.0.1:4173/...` 不能发给顾客。系统已经配置为在本机测试时也生成 Netlify 正式链接。

## 怎样之后升级成 Google Sheet 或数据库版本

当前版本使用浏览器本机保存，不需要服务器。这是最免费、最简单、最容易部署的方式。

之后如果要升级，可以分成三个方向：

1. Google Sheet 版本
   - 员工填写后，把预订资料同步到 Google Sheet
   - 适合需要统计预订记录
   - 可能需要 Apps Script 或 Google API

2. 数据库版本
   - 使用 Supabase、Firebase、MySQL 或其他数据库
   - 邀请函链接只放 booking ID
   - 适合正式 CRM、修改订单、查看历史记录

3. 后台系统版本
   - 加入员工账号、预订列表、状态管理、提醒功能
   - 适合多员工、多分店、多活动管理

4. 真自动营销版本
   - 使用服务器定时任务
   - 串接 WhatsApp Business API、SMS API 或 Email API
   - 自动每月发券、自动生日祝福、自动预订确认
   - 这类功能通常会有平台费用或发送费用

建议先用这个免费静态版本跑实际流程，确认员工和顾客都习惯后，再决定是否升级。
