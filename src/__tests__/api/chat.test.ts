import { POST } from '@/app/api/chat/route';

// Mock OpenAI
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

// Mock console.error för att undvika spam i tester
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('/api/chat', () => {
  let mockChatCompletions: jest.Mocked<any>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    consoleSpy.mockClear();

    // Setup OpenAI mock
    mockChatCompletions = {
      create: jest.fn(),
    };

    const OpenAI = require('openai').default;
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: mockChatCompletions,
      },
    }));
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('POST /api/chat', () => {
    it('should return error when OpenAI API key is missing', async () => {
      // Arrange
      const originalApiKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test message' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'OpenAI API-nyckel saknas'
      });

      // Cleanup
      if (originalApiKey) {
        process.env.OPENAI_API_KEY = originalApiKey;
      }
    });

    it('should return error when message is missing', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Meddelande saknas'
      });
    });

    it('should return error when message is empty string', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Meddelande saknas'
      });
    });

    it('should successfully process chat message without context', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const mockResponse = {
        choices: [{
          message: {
            content: 'Detta är ett test-svar från AI:n.'
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockResponse as any);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Hur mycket kan jag spara på el?' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        reply: 'Detta är ett test-svar från AI:n.'
      });

      // Verify OpenAI was called correctly
      expect(mockChatCompletions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('Du är en expert på svenska elmarknaden')
          },
          {
            role: 'user',
            content: 'Hur mycket kan jag spara på el?'
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
    });

    it('should successfully process chat message with context', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const mockResponse = {
        choices: [{
          message: {
            content: 'Baserat på din faktura kan du spara cirka 100 kr/månad.'
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockResponse as any);

      const context = {
        totalAmount: 1000,
        extraFeesTotal: 80,
        totalKWh: 500
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Vad betyder mina extra avgifter?',
          context: context
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        reply: 'Baserat på din faktura kan du spara cirka 100 kr/månad.'
      });

      // Verify OpenAI was called with context
      expect(mockChatCompletions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('Du är en expert på svenska elmarknaden')
          },
          {
            role: 'assistant',
            content: `Kontext från faktura: ${JSON.stringify(context)}`
          },
          {
            role: 'user',
            content: 'Vad betyder mina extra avgifter?'
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const openAIError = new Error('OpenAI API rate limit exceeded');
      mockChatCompletions.create.mockRejectedValue(openAIError);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Test message' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Kunde inte skapa svar'
      });

      expect(consoleSpy).toHaveBeenCalledWith('[chat] Error:', openAIError);
    });

    it('should handle malformed JSON in request body', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Kunde inte skapa svar'
      });
    });

    it('should handle empty response from OpenAI', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const mockResponse = {
        choices: [{
          message: {
            content: null
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockResponse as any);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Test message' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Kunde inte skapa svar'
      });
    });

    it('should validate system prompt contains required elements', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const mockResponse = {
        choices: [{
          message: {
            content: 'Test response'
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockResponse as any);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Test message' 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      await POST(request);

      // Assert
      const systemMessage = mockChatCompletions.create.mock.calls[0][0].messages[0];
      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toContain('svenska elmarknaden');
      expect(systemMessage.content).toContain('svenska');
      expect(systemMessage.content).toContain('kortfattad');
      expect(systemMessage.content).toContain('elnätkostnader');
      expect(systemMessage.content).toContain('spotpris');
    });

    it('should handle very long messages appropriately', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const longMessage = 'A'.repeat(10000); // 10k characters
      const mockResponse = {
        choices: [{
          message: {
            content: 'Response to long message'
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockResponse as any);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: longMessage 
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify the long message was passed through
      const userMessage = mockChatCompletions.create.mock.calls[0][0].messages[1];
      expect(userMessage.content).toBe(longMessage);
    });

    it('should handle complex context objects', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key';

      const mockResponse = {
        choices: [{
          message: {
            content: 'Complex context response'
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockResponse as any);

      const complexContext = {
        billData: {
          totalAmount: 1500,
          extraFeesDetailed: [
            { label: 'Avgift 1', amount: 50, confidence: 0.9 },
            { label: 'Avgift 2', amount: 30, confidence: 0.8 }
          ]
        },
        savings: {
          potentialSavings: 100,
          percentage: 6.7
        },
        metadata: {
          timestamp: '2025-01-15T10:30:00Z',
          version: 'v1.0'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Förklara mina besparingar',
          context: complexContext
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify context was properly serialized
      const assistantMessage = mockChatCompletions.create.mock.calls[0][0].messages[1];
      expect(assistantMessage.role).toBe('assistant');
      expect(assistantMessage.content).toContain('Kontext från faktura:');
      expect(assistantMessage.content).toContain('"totalAmount":1500');
    });
  });
});
