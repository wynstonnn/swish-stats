import { createHmac,createHash,randomBytes,timingSafeEqual } from 'node:crypto';
export type Identity={id:string;email:string;role:'community'|'player'|'coach'|'volunteer';player:string|null;admin:boolean};
export class ApiError extends Error{constructor(message:string,public status=400){super(message)}}
export const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export function cookies(request:Request){return Object.fromEntries((request.headers.get('cookie')||'').split(';').map(c=>{const i=c.indexOf('=');return [c.slice(0,i).trim(),c.slice(i+1)]}))}
export function sameOrigin(request:Request){if(request.method==='GET')return;if(request.headers.get('origin')!==new URL(request.url).origin)throw new ApiError('Open this form from SWISH.',403)}
function secret(){const s=process.env.CLUBHOUSE_SESSION_SECRET||process.env.STAFF_SESSION_SECRET;if(!s||s.length<32)throw new ApiError('Shared predictions need a server session secret configured.',503);return s;}
const equal=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
function sign(value:string){return createHmac('sha256',secret()).update(value).digest('hex')}
export async function identity(_request:Request):Promise<Identity>{return {id:'clubhouse',email:'SWISH Clubhouse',role:'community',player:null,admin:false}}
export function cookie(response:Response,name:string,value:string,request:Request,age=28800){response.headers.append('Set-Cookie',`${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${value?age:0}${new URL(request.url).protocol==='https:'?'; Secure':''}`);return response}
export function device(request:Request){const token=cookies(request).swish_device||'',parts=token.split('.');if(parts.length===2&&/^[a-f0-9]{32}$/.test(parts[0]))try{if(equal(parts[1],sign(parts[0])))return {id:createHash('sha256').update(parts[0]).digest('hex'),token,new:false}}catch{}const id=randomBytes(16).toString('hex');return {id:createHash('sha256').update(id).digest('hex'),token:id+'.'+sign(id),new:true}}
