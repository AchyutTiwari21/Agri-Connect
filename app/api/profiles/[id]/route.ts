import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(profile);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, phone, address, role } = body ?? {};

    if (
      name === undefined &&
      phone === undefined &&
      address === undefined &&
      role === undefined
    ) {
      return NextResponse.json({ error: 'No fields provided' }, { status: 400 });
    }

    const profile = await prisma.profile.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
      },
    });

    return NextResponse.json(profile);
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}

