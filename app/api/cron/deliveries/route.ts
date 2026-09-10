import {NextRequest,NextResponse} from 'next/server';
import {deliverPending} from '@/lib/delivery';
export const maxDuration=60;
export async function GET(req:NextRequest){if(!process.env.CRON_SECRET||req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:'Unauthorized'},{status:401});try{return NextResponse.json(await deliverPending())}catch{return NextResponse.json({error:'Delivery unavailable'},{status:503})}}
