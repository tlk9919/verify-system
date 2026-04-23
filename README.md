# Vercel + Supabase 部署指南

## 步骤 1：创建 Supabase 数据库

1. 访问 https://supabase.com/
2. 用 GitHub 登录
3. 点击 "New project"
4. 填写：
   - Name: `verify-system`
   - Database Password: 设置密码并记住
   - Region: 选择 `Tokyo` 或 `Singapore`
5. 等待创建完成（2分钟）

## 步骤 2：导入数据库结构

1. 在 Supabase 项目中，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase-schema.sql` 的内容
4. 粘贴并点击 "Run"

## 步骤 3：获取 Supabase 连接信息

1. 点击左侧 "Settings" → "API"
2. 复制：
   - Project URL（例如：https://xxx.supabase.co）
   - anon public key（很长的字符串）

## 步骤 4：推送到 GitHub

```bash
cd /Users/macbookair/develop/hp/code/简易验证系统/vercel-deploy
git init
git add .
git commit -m "Vercel 部署"
git remote add origin https://github.com/tlk9919/verify-system-vercel.git
git push -u origin main
```

## 步骤 5：部署到 Vercel

1. 访问 https://vercel.com/
2. 用 GitHub 登录
3. 点击 "Add New..." → "Project"
4. 选择 `verify-system-vercel` 仓库
5. 点击 "Import"
6. 添加环境变量：
   - `SUPABASE_URL`: 你的 Project URL
   - `SUPABASE_KEY`: 你的 anon public key
7. 点击 "Deploy"

## 步骤 6：获取域名

部署完成后会得到域名，如：`https://verify-system-vercel.vercel.app`

## 步骤 7：测试

访问：`https://你的域名.vercel.app/server.php?id=ini`

应该返回加密的 JSON 数据。
