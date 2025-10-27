import { NextRequest, NextResponse } from 'next/server';
import { app } from '@/lib/audit-workflow';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { redis } from '@/lib/redis';
import { nanoid } from 'nanoid';

// Helper to serialize messages
const serializeMessages = (messages: BaseMessage[]) => {
  return messages.map(msg => ({
    type: msg._getType(),
    content: msg.content,
  }));
};

// Helper to deserialize messages
const deserializeMessages = (messages: any[]): BaseMessage[] => {
  return messages.map(msg => {
    if (msg.type === 'human') {
      return new HumanMessage({ content: msg.content });
    } else if (msg.type === 'ai') {
      return new AIMessage({ content: msg.content });
    }
    return new AIMessage({ content: msg.content });
  });
};

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId: existingSessionId, currentPhase } = await req.json();

    const sessionId = existingSessionId || nanoid();

    // Load previous state from Redis
    const previousState = await redis.get(`session:${sessionId}`);

    const state = {
      ...(previousState || {}),
      messages: deserializeMessages(messages),
      currentPhase,
    };

    const nextState = await app.invoke(state);

    const serializedMessages = serializeMessages(nextState.messages);

    // Save state to Redis
    await redis.set(`session:${sessionId}`, { ...nextState, messages: serializedMessages });

    return NextResponse.json({ ...nextState, sessionId, messages: serializedMessages });
  } catch (error) {
    console.error('[Chat API]', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}