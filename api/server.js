// Vercel Serverless Function - 验证系统
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const RC4_KEY = 'bizinb_secret_key_2026';

// RC4 加密/解密
function rc4(data, key) {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    [s[i], s[j]] = [s[j], s[i]];
  }
  
  let i = 0;
  j = 0;
  const result = [];
  
  for (let y = 0; y < data.length; y++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    [s[i], s[j]] = [s[j], s[i]];
    const k = s[(s[i] + s[j]) % 256];
    result.push(String.fromCharCode(data.charCodeAt(y) ^ k));
  }
  
  return result.join('');
}

function rc4Encrypt(data, key) {
  return Buffer.from(rc4(data, key)).toString('base64');
}

function rc4Decrypt(data, key) {
  return rc4(Buffer.from(data, 'base64').toString('binary'), key);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  
  // 连接 Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  
  try {
    switch(id) {
      case 'ini':
      case 'notice':
        return await getAnnouncement(supabase, res);
      case 'kmlogon':
      case 'kmlogin':
        return await loginVerify(supabase, req, res);
      default:
        return res.send(rc4Encrypt(JSON.stringify({ code: -1, msg: '无效的请求' }), RC4_KEY));
    }
  } catch (error) {
    return res.send(rc4Encrypt(JSON.stringify({ code: -1, msg: error.message }), RC4_KEY));
  }
}

async function getAnnouncement(supabase, res) {
  const { data: announcement } = await supabase
    .from('config')
    .select('value')
    .eq('name', 'announcement')
    .single();

  const { data: version } = await supabase
    .from('config')
    .select('value')
    .eq('name', 'version')
    .single();

  const response = {
    code: 200,
    msg: {
      app_gg: announcement?.value || '欢迎使用！',
      app_ver: version?.value || '1.0',
      app_update_url: 'http://your-domain.com/update.apk',
      app_update_must: 'false',
      app_update_show: '修复已知问题'
    }
  };

  return res.send(rc4Encrypt(JSON.stringify(response), RC4_KEY));
}

async function loginVerify(supabase, req, res) {
  const body = req.body;
  if (!body || !body.data) {
    return res.send(rc4Encrypt(JSON.stringify({ code: 0, msg: '参数错误' }), RC4_KEY));
  }
  
  const decrypted = rc4Decrypt(body.data, RC4_KEY);
  const params = new URLSearchParams(decrypted);
  
  const kami = params.get('kami');
  const markcode = params.get('markcode');
  const timestamp = parseInt(params.get('t'));
  
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) {
    return res.send(rc4Encrypt(JSON.stringify({ code: 0, msg: '请求已过期' }), RC4_KEY));
  }
  
  const { data: row, error } = await supabase
    .from('kami')
    .select('*')
    .eq('kami', kami)
    .single();
  
  if (error || !row) {
    return res.send(rc4Encrypt(JSON.stringify({ code: 0, msg: '卡密不存在' }), RC4_KEY));
  }
  
  if (row.status != 1) {
    return res.send(rc4Encrypt(JSON.stringify({ code: 0, msg: '卡密已被禁用' }), RC4_KEY));
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  if (row.endtime < now) {
    return res.send(rc4Encrypt(JSON.stringify({ code: 0, msg: '卡密已到期' }), RC4_KEY));
  }
  
  if (row.markcode && row.markcode !== markcode) {
    return res.send(rc4Encrypt(JSON.stringify({ code: 0, msg: '设备码不匹配' }), RC4_KEY));
  }
  
  if (!row.markcode) {
    await supabase
      .from('kami')
      .update({ markcode, last_login: now })
      .eq('kami', kami);
  } else {
    await supabase
      .from('kami')
      .update({ last_login: now })
      .eq('kami', kami);
  }
  
  const checkString = now + 'bizinb_key_2026' + markcode;
  const checkSign = crypto.createHash('md5').update(checkString).digest('hex');

  const response = {
    'xb34091862aa9871328c6ca74875063c1': 72267,
    'p645ee9de7bd65595884d4a38b53ddbeb': now,
    'nb73d7ed95d1b6ba7223df7d8661fcfdb': {
      'w43fad5f47dd4266441df9b659318a09e': checkSign,
      'h3e272e62cf9e1b9013b8c849a0cdbd29': row.endtime,
      'p85ea6ca424b265392a4fcd30c527a817': row.id
    },
    'ea681092c8e0332fbd8a83e2ce6cf04dd': checkSign
  };

  return res.send(rc4Encrypt(JSON.stringify(response), RC4_KEY));
}
