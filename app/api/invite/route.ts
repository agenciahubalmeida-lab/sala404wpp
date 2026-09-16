import { NextRequest,NextResponse } from 'next/server';
import { founderCall,founderCookie } from '@/lib/founder';
import { communityUrl } from '@/lib/server';
export async function GET(request:NextRequest){
 try{
  const session=founderCookie(request);
  if(!session)return NextResponse.redirect(new URL('/#quiz',request.url),303);
  // The central transaction checks quiz completion and persists the event before returning.
  const result=await founderCall({action:'event',event_name:'sala404_whatsapp_click',session,user_agent:request.headers.get('user-agent')||''});
  if(!result.ok)throw new Error('INVITE_NOT_READY');
  return NextResponse.redirect(communityUrl(),{status:303,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
 }catch{
  return new NextResponse('<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seu convite — SALA 404</title><body style="font:18px system-ui;background:#111;color:#f4f1ea;max-width:540px;margin:15vh auto;padding:24px"><h1>Seu convite ainda não abriu.</h1><p>Não foi possível confirmar o registro agora. Suas respostas continuam salvas.</p><p><a style="color:inherit" href="/api/invite">Tentar abrir novamente →</a></p><a style="color:inherit" href="/#quiz">Voltar ao cadastro</a></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
 }
}
