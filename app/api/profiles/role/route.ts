import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await req.json();

    if (role !== 'consumer' && role !== 'farmer') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const userId = (session.user as any).id as string;

    await prisma.profile.upsert({
      where: { id: userId },
      update: { role },
      create: {
        id: userId,
        name: session.user.name ?? (session.user.email ? session.user.email.split('@')[0] : 'User'),
        role,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error updating profile role', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



