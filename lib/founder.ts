import { NextRequest, NextResponse } from 'next/server';
export function founderEnabled(){return !!process.env.FOUNDER_API_URL && !!process.env.FOUNDER_BRIDGE_SECRET;}
export function founderCookie(request:NextRequest){return request.cookies.get('sala404_founder')?.value;}
export function setFounderCookie(response:NextResponse,request:NextRequest,session:string){response.cookies.set('sala404_founder',session,{httpOnly:true,secure:request.nextUrl.protocol==='https:',sameSite:'lax',path:'/',maxAge:90*86400});}
export async function founderCall(data:Record<string,unknown>){
 const url=process.env.FOUNDER_API_URL;const secret=process.env.FOUNDER_BRIDGE_SECRET;
 if(!url || !secret)throw new Error('FOUNDER_NOT_CONFIGURED');
 const response=await fetch(`${url.replace(/\/$/,'')}/api/integrations/sala404`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify(data)});
 const result=await response.json();if(!response.ok)throw new Error('FOUNDER_SAVE_FAILED');return result;
}
