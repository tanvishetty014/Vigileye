const natural = require('natural');
const Sentiment = require('sentiment');
const nlp = require('compromise');
const logger = require('../utils/logger');

class NLPService {
  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Initialize security-related keywords
    this.securityKeywords = [
      'breach', 'hack', 'attack', 'vulnerability', 'exploit', 'malware',
      'phishing', 'ransomware', 'ddos', 'intrusion', 'compromise',
      'data leak', 'unauthorized access', 'security incident',
      'threat', 'risk', 'alert', 'suspicious', 'anomaly'
    ];
    
    this.threatLevels = ['low', 'medium', 'high', 'critical'];
  }

  /**
   * Analyze text for security-related content and sentiment
   * @param {string} text - Text to analyze
   * @returns {Object} Analysis results
   */
  analyzeSecurityText(text) {
    try {
      const words = this.tokenizer.tokenize(text.toLowerCase());
      const doc = nlp(text);
      
      // Sentiment analysis
      const sentimentResult = this.sentiment.analyze(text);
      
      // Extract security-related keywords
      const foundKeywords = this.securityKeywords.filter(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Extract entities (companies, dates, numbers)
      const entities = this.extractEntities(text);
      
      // Calculate threat score based on keywords and sentiment
      const threatScore = this.calculateThreatScore(words, sentimentResult, foundKeywords);
      
      // Extract key phrases
      const keyPhrases = this.extractKeyPhrases(text);
      
      // Determine threat level
      const threatLevel = this.determineThreatLevel(threatScore);
      
      return {
        sentiment: {
          score: sentimentResult.score,
          comparative: sentimentResult.comparative,
          positive: sentimentResult.positive,
          negative: sentimentResult.negative,
          neutral: sentimentResult.neutral
        },
        security: {
          keywords: foundKeywords,
          threatScore,
          threatLevel,
          confidence: this.calculateConfidence(foundKeywords, sentimentResult)
        },
        entities: entities,
        keyPhrases: keyPhrases,
        metadata: {
          wordCount: words.length,
          analyzedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error in analyzeSecurityText:', error);
      throw new Error('Failed to analyze security text');
    }
  }

  /**
   * Extract entities from text
   * @param {string} text - Text to analyze
   * @returns {Object} Extracted entities
   */
  extractEntities(text) {
    const doc = nlp(text);
    
    return {
      organizations: doc.organizations().out('array'),
      dates: doc.dates().out('array'),
      numbers: doc.numbers().out('array'),
      emails: text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [],
      urls: text.match(/https?:\/\/[^\s]+/g) || [],
      ipAddresses: text.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g) || [],
      phoneNumbers: text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || []
    };
  }

  /**
   * Extract key phrases from text
   * @param {string} text - Text to analyze
   * @returns {Array} Key phrases
   */
  extractKeyPhrases(text) {
    const words = this.tokenizer.tokenize(text.toLowerCase());
    const stopWords = natural.stopwords;
    
    // Filter out stop words and short words
    const filteredWords = words.filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
    
    // Get word frequency
    const wordFreq = {};
    filteredWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Sort by frequency and return top phrases
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, freq]) => ({ word, frequency: freq }));
  }

  /**
   * Calculate threat score based on various factors
   * @param {Array} words - Tokenized words
   * @param {Object} sentiment - Sentiment analysis result
   * @param {Array} keywords - Found security keywords
   * @returns {number} Threat score (0-100)
   */
  calculateThreatScore(words, sentiment, keywords) {
    let score = 0;
    
    // Base score from sentiment (negative sentiment increases threat)
    score += Math.abs(sentiment.score) * 2;
    
    // Score from security keywords
    score += keywords.length * 5;
    
    // Score from urgency indicators
    const urgencyWords = ['urgent', 'critical', 'immediate', 'emergency', 'asap'];
    const urgencyCount = words.filter(word => urgencyWords.includes(word)).length;
    score += urgencyCount * 8;
    
    // Score from threat indicators
    const threatWords = ['attack', 'breach', 'hack', 'exploit', 'malware'];
    const threatCount = words.filter(word => threatWords.includes(word)).length;
    score += threatCount * 10;
    
    // Cap the score at 100
    return Math.min(score, 100);
  }

  /**
   * Determine threat level based on score
   * @param {number} score - Threat score
   * @returns {string} Threat level
   */
  determineThreatLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence score for the analysis
   * @param {Array} keywords - Found keywords
   * @param {Object} sentiment - Sentiment result
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(keywords, sentiment) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence if security keywords found
    if (keywords.length > 0) {
      confidence += Math.min(keywords.length * 0.1, 0.3);
    }
    
    // Increase confidence if sentiment is strong (positive or negative)
    if (Math.abs(sentiment.comparative) > 0.1) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Classify text into security categories
   * @param {string} text - Text to classify
   * @returns {Object} Classification results
   */
  classifySecurityText(text) {
    const categories = {
      breach: ['breach', 'data leak', 'unauthorized access', 'compromise'],
      malware: ['malware', 'virus', 'trojan', 'ransomware', 'botnet'],
      phishing: ['phishing', 'spoofing', 'social engineering', 'fake'],
      ddos: ['ddos', 'denial of service', 'flood', 'overload'],
      vulnerability: ['vulnerability', 'exploit', 'cve', 'patch', 'update'],
      insider: ['insider', 'employee', 'internal', 'privilege abuse']
    };

    const scores = {};
    const textLower = text.toLowerCase();

    Object.entries(categories).forEach(([category, keywords]) => {
      scores[category] = keywords.reduce((score, keyword) => {
        return score + (textLower.includes(keyword) ? 1 : 0);
      }, 0);
    });

    const topCategory = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    );

    return {
      primaryCategory: topCategory[1] > 0 ? topCategory[0] : 'general',
      scores,
      confidence: topCategory[1] / Object.keys(categories).length
    };
  }

  /**
   * Generate summary of security text
   * @param {string} text - Text to summarize
   * @returns {string} Generated summary
   */
  generateSummary(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) {
      return text;
    }

    // Simple extractive summarization - take first and most important sentences
    const importantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return this.securityKeywords.some(keyword => 
        lowerSentence.includes(keyword)
      );
    });

    if (importantSentences.length > 0) {
      return importantSentences.slice(0, 2).join('. ') + '.';
    }

    return sentences[0] + '.';
  }

  /**
   * Detect language of the text
   * @param {string} text - Text to analyze
   * @returns {string} Detected language code
   */
  detectLanguage(text) {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of'];
    const words = this.tokenizer.tokenize(text.toLowerCase());
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    
    const ratio = englishWordCount / words.length;
    
    if (ratio > 0.1) {
      return 'en';
    }
    
    return 'unknown';
  }
}

module.exports = new NLPService();
