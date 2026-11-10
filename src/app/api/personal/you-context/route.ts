import { NextResponse } from 'next/server'
import { getYouContext } from '@/lib/personal/you-context'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store' }

export async function GET() {
  try {
    const context = await getYouContext()
    return NextResponse.json(context, { headers })
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers })
    }
    if (error instanceof Error && error.message === 'Personal profile not found') {
      return NextResponse.json({ error: 'Personal profile not found' }, { status: 404, headers })
    }
    console.error('Unable to load You context', error)
    return NextResponse.json({ error: 'Unable to load You context' }, { status: 500, headers })
  }
}
