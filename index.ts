import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const enc=new TextEncoder();
const b64=(u:Uint8Array)=>btoa(String.fromCharCode(...u)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=(s:string)=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
async function hmac(secret:string,data:string){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(data))))}
async function makeToken(role:string,secret:string){const head=b64(enc.encode(JSON.stringify({alg:'HS256',typ:'JWT'})));const payload=b64(enc.encode(JSON.stringify({role,exp:Math.floor(Date.now()/1000)+60*60*8})));return `${head}.${payload}.${await hmac(secret,`${head}.${payload}`)}`}
async function verify(req:Request,secret:string,needed='admin'){const raw=req.headers.get('Authorization')||'';const token=raw.startsWith('Bearer ')?raw.slice(7):'';const p=token.split('.');if(p.length!==3)return false;const sig=await hmac(secret,`${p[0]}.${p[1]}`);if(sig!==p[2])return false;try{const x=JSON.parse(new TextDecoder().decode(unb64(p[1])));return x.exp>Math.floor(Date.now()/1000)&&(needed==='any'||x.role===needed)}catch{return false}}
const json=(x:any,status=200)=>new Response(JSON.stringify(x),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const body=await req.json();const action=body.action;const adminCode=Deno.env.get('ADMIN_CODE')||'';const userCode=Deno.env.get('USER_CODE')||'';const secret=Deno.env.get('SESSION_SECRET')||'';if(!secret) return json({error:'SESSION_SECRET غير مضبوط'},500);
 if(action==='login'){const code=String(body.code||'');if(code&&code===adminCode)return json({role:'admin',token:await makeToken('admin',secret)});if(code&&code===userCode)return json({role:'user',token:await makeToken('user',secret)});return json({error:'رمز الدخول غير صحيح'},401)}
 const sb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 if(action==='upsert'){if(!(await verify(req,secret,'admin')))return json({error:'غير مصرح'},403);const allowed=['announcements','services'];if(!allowed.includes(body.table))return json({error:'جدول غير مسموح'},400);let r;if(body.id)r=await sb.from(body.table).update(body.data).eq('id',body.id);else r=await sb.from(body.table).insert(body.data);if(r.error)throw r.error;return json({ok:true})}
 if(action==='delete'){if(!(await verify(req,secret,'admin')))return json({error:'غير مصرح'},403);if(!['announcements','services'].includes(body.table))return json({error:'جدول غير مسموح'},400);const r=await sb.from(body.table).delete().eq('id',body.id);if(r.error)throw r.error;return json({ok:true})}
 if(action==='create_complaint'){if(!(await verify(req,secret,'any')))return json({error:'غير مصرح'},403);const r=await sb.from('complaints').insert({type:String(body.type||'بلاغ'),body:String(body.body||''),status:'new'});if(r.error)throw r.error;return json({ok:true})}
 if(action==='list_complaints'){if(!(await verify(req,secret,'admin')))return json({error:'غير مصرح'},403);const r=await sb.from('complaints').select('*').order('created_at',{ascending:false});if(r.error)throw r.error;return json({complaints:r.data||[]})}
 if(action==='update_complaint'){if(!(await verify(req,secret,'admin')))return json({error:'غير مصرح'},403);const r=await sb.from('complaints').update({status:String(body.status)}).eq('id',body.id);if(r.error)throw r.error;return json({ok:true})}
 return json({error:'عملية غير معروفة'},400);
}catch(e){console.error(e);return json({error:e instanceof Error?e.message:'خطأ غير متوقع'},500)}});
