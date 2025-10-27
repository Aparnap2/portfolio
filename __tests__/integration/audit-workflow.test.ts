import { discoveryNode, painPointsNode, qualificationNode } from '@/lib/audit-workflow';
import { HumanMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

jest.mock('@langchain/google-genai');

describe('Audit Workflow Nodes', () => {
  it('discoveryNode should extract industry and company size', async () => {
    const mockInvoke = jest.fn().mockResolvedValue({
      industry: 'tech',
      companySize: '50',
    });
    const mockWithStructuredOutput = jest.fn().mockReturnValue({
      invoke: mockInvoke,
    });
    const mockModel = new ChatGoogleGenerativeAI({});
    (mockModel.withStructuredOutput as jest.Mock).mockImplementation(mockWithStructuredOutput);

    const initialState = {
      messages: [new HumanMessage('I am in the tech industry and I have 50 employees')],
      currentPhase: 'discovery',
    };

    const response = await discoveryNode(initialState as any, mockModel);

    expect(response.discoveryData).toBeDefined();
    expect(response.discoveryData?.industry).toBe('tech');
    expect(response.discoveryData?.companySize).toBe('50');
  });

  it('painPointsNode should extract pain points', async () => {
    const mockInvoke = jest.fn().mockResolvedValue({
      manualTasks: 'a lot of manual data entry',
      bottlenecks: 'reporting takes a long time',
      dataSilos: 'sales and marketing data are separate',
    });
    const mockWithStructuredOutput = jest.fn().mockReturnValue({
      invoke: mockInvoke,
    });
    const mockModel = new ChatGoogleGenerativeAI({});
    (mockModel.withStructuredOutput as jest.Mock).mockImplementation(mockWithStructuredOutput);

    const initialState = {
      messages: [new HumanMessage('We do a lot of manual data entry, reporting takes a long time, and sales and marketing data are separate')],
      currentPhase: 'pain_points',
    };

    const response = await painPointsNode(initialState as any, mockModel);

    expect(response.painPointsData).toBeDefined();
    expect(response.painPointsData?.manualTasks).toBe('a lot of manual data entry');
    expect(response.painPointsData?.bottlenecks).toBe('reporting takes a long time');
    expect(response.painPointsData?.dataSilos).toBe('sales and marketing data are separate');
  });

  it('qualificationNode should extract budget and timeline', async () => {
    const mockInvoke = jest.fn().mockResolvedValue({
      budget: '$10,000',
      timeline: '3 months',
    });
    const mockWithStructuredOutput = jest.fn().mockReturnValue({
      invoke: mockInvoke,
    });
    const mockModel = new ChatGoogleGenerativeAI({});
    (mockModel.withStructuredOutput as jest.Mock).mockImplementation(mockWithStructuredOutput);

    const initialState = {
      messages: [new HumanMessage('Our budget is $10,000 and we want to do this in 3 months')],
      currentPhase: 'qualification',
    };

    const response = await qualificationNode(initialState as any, mockModel);

    expect(response.qualificationData).toBeDefined();
    expect(response.qualificationData?.budget).toBe('$10,000');
    expect(response.qualificationData?.timeline).toBe('3 months');
  });
});