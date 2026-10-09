import {portableApi} from '@/lib/portable-api';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request:Request){return portableApi(request)}
export async function POST(request:Request){return portableApi(request)}
