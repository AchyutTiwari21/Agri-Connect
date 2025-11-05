import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, role } = body;
    if (!id || !name || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const profile = await prisma.profile.upsert({
      where: { id },
      update: { name, role },
      create: { id, name, role },
    });
    return NextResponse.json(profile, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}


