import { NextResponse } from 'next/server';
import { CircuitBreaker } from '@/lib/error-handling';

// Global circuit breaker registry for monitoring
const circuitBreakerRegistry = new Map<string, CircuitBreaker>();

export function registerCircuitBreaker(name: string, breaker: CircuitBreaker) {
  circuitBreakerRegistry.set(name, breaker);
}

export function getCircuitBreaker(name: string): CircuitBreaker | undefined {
  return circuitBreakerRegistry.get(name);
}

export async function GET() {
  try {
    const breakers: Record<string, any> = {};

    for (const [name, breaker] of circuitBreakerRegistry.entries()) {
      breakers[name] = breaker.getState();
    }

    return NextResponse.json({
      circuitBreakers: breakers,
      total: circuitBreakerRegistry.size,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to retrieve circuit breaker states',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, state } = body;

    if (!name || !circuitBreakerRegistry.has(name)) {
      return NextResponse.json(
        { error: 'Circuit breaker not found' },
        { status: 404 }
      );
    }

    const breaker = circuitBreakerRegistry.get(name)!;

    switch (action) {
      case 'reset':
        breaker.reset();
        break;
      case 'force_state':
        if (!state || !['CLOSED', 'OPEN', 'HALF_OPEN'].includes(state)) {
          return NextResponse.json(
            { error: 'Invalid state. Must be CLOSED, OPEN, or HALF_OPEN' },
            { status: 400 }
          );
        }
        breaker.forceState(state);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: reset, force_state' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      name,
      newState: breaker.getState(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to execute circuit breaker action',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}