import { EmotionType } from '@/components/CyberFace';

export interface EmotionResponse {
  content: string;
  emotion?: EmotionType;
}

export class EmotionDetector {
  private static readonly EMOTION_KEYWORDS = {
    happy: [
      'happy', 'joy', 'excited', 'pleased', 'delighted', 'cheerful', 'glad',
      '😊', '😄', '😃', '🙂', '😁', '🥰', '😍', '🤗', '🎉', '✨',
      '开心', '高兴', '愉快', '兴奋', '快乐', '欢喜', '喜悦'
    ],
    sad: [
      'sad', 'sorry', 'disappointed', 'unhappy', 'depressed', 'melancholy',
      '😢', '😭', '😞', '😔', '☹️', '😟', '😰', '💔',
      '伤心', '难过', '失望', '沮丧', '悲伤', '忧郁', '遗憾'
    ],
    angry: [
      'angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated', 'outraged',
      '😠', '😡', '🤬', '👿', '💢', '🔥',
      '愤怒', '生气', '恼火', '烦躁', '愤慨', '激怒', '不满'
    ],
    neutral: [
      'neutral', 'calm', 'okay', 'fine', 'normal', 'steady', 'balanced',
      '😐', '😑', '🙄', '😶',
      '平静', '正常', '还好', '一般', '冷静', '淡然'
    ]
  };

  /**
   * Parse JSON response from LLM to extract emotion
   */
  static parseEmotionFromJSON(jsonResponse: string): EmotionResponse {
    try {
      const parsed = JSON.parse(jsonResponse);
      
      // Direct emotion field
      if (parsed.emotion && this.isValidEmotion(parsed.emotion)) {
        return {
          content: parsed.content || parsed.message || jsonResponse,
          emotion: parsed.emotion as EmotionType
        };
      }

      // Fallback to content analysis
      const content = parsed.content || parsed.message || parsed.text || jsonResponse;
      return {
        content,
        emotion: this.detectEmotionFromText(content)
      };
    } catch (error) {
      // If not valid JSON, treat as plain text
      return {
        content: jsonResponse,
        emotion: this.detectEmotionFromText(jsonResponse)
      };
    }
  }

  /**
   * Detect emotion from text content using keyword analysis
   */
  static detectEmotionFromText(text: string): EmotionType {
    if (!text || typeof text !== 'string') {
      return 'neutral';
    }

    const lowercaseText = text.toLowerCase();
    const scores = {
      happy: 0,
      sad: 0,
      angry: 0,
      neutral: 0
    };

    // Count keyword matches
    Object.entries(this.EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = (lowercaseText.match(regex) || []).length;
        scores[emotion as EmotionType] += matches;
      });
    });

    // Sentiment analysis patterns
    const positivePatterns = [
      /(?:very|really|so|extremely)\s+(?:good|great|awesome|amazing|wonderful|fantastic)/gi,
      /(?:love|enjoy|like)\s+(?:it|this|that)/gi,
      /(?:thank|thanks|appreciate)/gi
    ];

    const negativePatterns = [
      /(?:very|really|so|extremely)\s+(?:bad|terrible|awful|horrible|disappointing)/gi,
      /(?:hate|dislike|can't\s+stand)/gi,
      /(?:wrong|error|problem|issue|trouble)/gi
    ];

    const angryPatterns = [
      /(?:damn|shit|fuck|stupid|ridiculous)/gi,
      /(?:what\s+the\s+hell|what\s+the\s+fuck|are\s+you\s+kidding)/gi,
      /!{2,}/g // Multiple exclamation marks
    ];

    // Apply pattern bonuses
    positivePatterns.forEach(pattern => {
      const matches = (text.match(pattern) || []).length;
      scores.happy += matches * 2;
    });

    negativePatterns.forEach(pattern => {
      const matches = (text.match(pattern) || []).length;
      scores.sad += matches * 2;
    });

    angryPatterns.forEach(pattern => {
      const matches = (text.match(pattern) || []).length;
      scores.angry += matches * 3;
    });

    // Check for mixed emotions (neutral indicator)
    const emotionCount = Object.values(scores).filter(score => score > 0).length;
    if (emotionCount > 1) {
      const maxScore = Math.max(...Object.values(scores));
      if (maxScore < 3) { // Low confidence, default to neutral
        scores.neutral += 1;
      }
    }

    // Find the emotion with the highest score
    const maxEmotion = Object.entries(scores).reduce((max, [emotion, score]) => 
      score > max.score ? { emotion: emotion as EmotionType, score } : max,
      { emotion: 'neutral' as EmotionType, score: 0 }
    );

    return maxEmotion.emotion;
  }

  /**
   * Validate if emotion string is a valid EmotionType
   */
  private static isValidEmotion(emotion: any): boolean {
    return typeof emotion === 'string' && 
           ['happy', 'sad', 'angry', 'neutral'].includes(emotion);
  }

  /**
   * Extract emotion from streaming response chunks
   */
  static extractEmotionFromStream(chunk: string, previousContent: string = ''): {
    emotion: EmotionType | null;
    confidence: number;
  } {
    const fullContent = previousContent + chunk;
    
    // Look for JSON emotion tags in the stream
    const emotionTagMatch = fullContent.match(/\{"emotion":\s*"(happy|sad|angry|neutral)"/i);
    if (emotionTagMatch) {
      return {
        emotion: emotionTagMatch[1].toLowerCase() as EmotionType,
        confidence: 0.9
      };
    }

    // Analyze accumulated content for emotion
    const detectedEmotion = this.detectEmotionFromText(fullContent);
    
    // Calculate confidence based on content length and keyword density
    const wordCount = fullContent.split(/\s+/).length;
    const confidence = Math.min(wordCount / 20, 1) * 0.7; // Max 70% confidence for text analysis

    return {
      emotion: confidence > 0.3 ? detectedEmotion : null,
      confidence
    };
  }

  /**
   * Debug function to show emotion analysis details
   */
  static analyzeEmotionDebug(text: string): {
    detectedEmotion: EmotionType;
    scores: Record<EmotionType, number>;
    matchedKeywords: Record<EmotionType, string[]>;
  } {
    const lowercaseText = text.toLowerCase();
    const scores = { happy: 0, sad: 0, angry: 0, neutral: 0 };
    const matchedKeywords = { happy: [], sad: [], angry: [], neutral: [] } as Record<EmotionType, string[]>;

    Object.entries(this.EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
      keywords.forEach(keyword => {
        if (lowercaseText.includes(keyword.toLowerCase())) {
          scores[emotion as EmotionType]++;
          matchedKeywords[emotion as EmotionType].push(keyword);
        }
      });
    });

    return {
      detectedEmotion: this.detectEmotionFromText(text),
      scores,
      matchedKeywords
    };
  }
}

// Utility function for React components
export const useEmotionDetection = () => {
  const detectEmotion = (response: string): EmotionResponse => {
    return EmotionDetector.parseEmotionFromJSON(response);
  };

  const analyzeText = (text: string): EmotionType => {
    return EmotionDetector.detectEmotionFromText(text);
  };

  return { detectEmotion, analyzeText };
};