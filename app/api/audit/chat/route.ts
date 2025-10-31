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
    console.log('[Chat API] Received request');
    const { messages, sessionId: existingSessionId, currentPhase } = await req.json();
    console.log('[Chat API] Parsed request data:', { messages: messages?.length, sessionId: existingSessionId, currentPhase });

    const sessionId = existingSessionId || nanoid();
    console.log('[Chat API] Using session ID:', sessionId);

    // Load previous state from Redis
    const previousState = await redis.get(`session:${sessionId}`);
    console.log('[Chat API] Previous state from Redis:', previousState ? 'Found' : 'Not found');

    const state = {
      ...(previousState || {}),
      messages: deserializeMessages(messages),
      currentPhase,
    };
    console.log('[Chat API] Constructed state:', { messagesCount: state.messages?.length, currentPhase: state.currentPhase });

    console.log('[Chat API] Invoking workflow...');
    const nextState = await app.invoke(state);
    console.log('[Chat API] Workflow completed, next state:', { messagesCount: nextState.messages?.length });

    const serializedMessages = serializeMessages(nextState.messages);
    console.log('[Chat API] Serialized messages:', serializedMessages.length);

    // Save state to Redis
    await redis.set(`session:${sessionId}`, { ...nextState, messages: serializedMessages });
    console.log('[Chat API] Saved state to Redis');

    const response = { ...nextState, sessionId, messages: serializedMessages };
    console.log('[Chat API] Sending response:', { sessionId: response.sessionId, messagesCount: response.messages?.length });
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Chat API] Error occurred:', error);
    console.error('[Chat API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: 'Something went wrong',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}