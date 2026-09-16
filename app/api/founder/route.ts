import { NextRequest, NextResponse } from 'next/server';
import { founderCall, founderCookie, founderEnabled, setFounderCookie } from '@/lib/founder';
export async function POST(request:NextRequest){
 if(request.headers.get('origin')!==request.nextUrl.origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
 if(!founderEnabled())return NextResponse.json({enabled:false,profile:{}},{headers:{'Cache-Control':'no-store'}});
 try{
  const raw=await request.text();if(raw.length>4000)throw new Error('invalid');const data=JSON.parse(raw);
  if(!['session','exchange','event','reset'].includes(data.action))throw new Error('invalid');
  if(data.action==='exchange'&&!/^[\w-]{43}$/.test(data.handoff))throw new Error('invalid');
  if(data.action==='event'&&!['sala404_lp_view','sala404_quiz_started',...Array.from({length:6},(_,i)=>'sala404_quiz_step_'+(i+1))].includes(data.event_name))throw new Error('invalid');
  const result=await founderCall({action:data.action==='reset'?'session':data.action,session:data.action==='reset'?undefined:founderCookie(request),handoff:data.handoff,event_name:data.event_name,user_agent:request.headers.get('user-agent')||'',...(data.attribution?{attribution:data.attribution}:{})});
  const response=NextResponse.json({enabled:true,profile:result.profile},{headers:{'Cache-Control':'private, no-store'}});setFounderCookie(response,request,result.session);return response;
 }catch{return NextResponse.json({error:'Não foi possível recuperar seu cadastro. Tente novamente.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
