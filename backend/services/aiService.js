const OpenAI = require('openai');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.systemPrompts = {
      threatAnalysis: `You are a cybersecurity expert AI assistant specializing in threat analysis and risk assessment. 
      Your role is to analyze security incidents, breaches, and potential threats to provide accurate assessments, 
      risk scores, and actionable recommendations. Always prioritize accuracy and provide evidence-based analysis.`,
      
      breachAnalysis: `You are an expert in data breach analysis and incident response. Analyze breach data to 
      identify attack vectors, assess impact, and provide remediation strategies. Focus on practical, 
      implementable solutions.`,
      
      riskAssessment: `You are a cybersecurity risk assessment specialist. Evaluate security risks based on 
      available data and provide detailed risk scores, threat levels, and mitigation strategies. 
      Consider both technical and business impact.`,
      
      reportGeneration: `You are a cybersecurity report generator. Create comprehensive, professional security 
      reports that are clear, actionable, and suitable for both technical and executive audiences.`
    };
  }

  /**
   * Analyze threat data using AI
   * @param {Object} threatData - Threat data to analyze
   * @param {string} analysisType - Type of analysis to perform
   * @returns {Object} AI analysis results
   */
  async analyzeThreat(threatData, analysisType = 'threatAnalysis') {
    try {
      if (!process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured, using fallback analysis');
        return this.fallbackAnalysis(threatData, analysisType);
      }

      const prompt = this.buildThreatAnalysisPrompt(threatData, analysisType);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: this.systemPrompts[analysisType] },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const analysis = response.choices[0].message.content;
      return this.parseAIResponse(analysis, analysisType);
      
    } catch (error) {
      logger.error('Error in AI threat analysis:', error);
      return this.fallbackAnalysis(threatData, analysisType);
    }
  }

  /**
   * Build prompt for threat analysis
   * @param {Object} threatData - Threat data
   * @param {string} analysisType - Type of analysis
   * @returns {string} Formatted prompt
   */
  buildThreatAnalysisPrompt(threatData, analysisType) {
    const basePrompt = `Analyze the following cybersecurity data and provide a structured assessment:

    Threat Data:
    - Type: ${threatData.type || 'Unknown'}
    - Description: ${threatData.description || 'No description provided'}
    - Severity: ${threatData.severity || 'Unknown'}
    - Source: ${threatData.source || 'Unknown'}
    - Timestamp: ${threatData.timestamp || 'Unknown'}
    ${threatData.metadata ? `- Additional Data: ${JSON.stringify(threatData.metadata)}` : ''}

    Please provide:
    1. Risk Score (0-100)
    2. Threat Level (low/medium/high/critical)
    3. Key Findings
    4. Recommendations
    5. Confidence Score (0-1)
    `;

    switch (analysisType) {
      case 'breachAnalysis':
        return basePrompt + `
        
        Focus specifically on:
        - Attack vector identification
        - Data exposure assessment
        - Impact analysis
        - Immediate response actions
        `;
        
      case 'riskAssessment':
        return basePrompt + `
        
        Focus specifically on:
        - Business impact assessment
        - Technical risk evaluation
        - Compliance implications
        - Mitigation priority
        `;
        
      default:
        return basePrompt;
    }
  }

  /**
   * Parse AI response into structured format
   * @param {string} response - Raw AI response
   * @param {string} analysisType - Type of analysis
   * @returns {Object} Parsed response
   */
  parseAIResponse(response, analysisType) {
    try {
      // Extract structured data from AI response
      const riskScoreMatch = response.match(/risk score[:\s]*(\d+)/i);
      const threatLevelMatch = response.match(/threat level[:\s]*(low|medium|high|critical)/i);
      const confidenceMatch = response.match(/confidence[:\s]*(\d+\.?\d*)/i);
      
      // Extract recommendations
      const recommendations = this.extractRecommendations(response);
      
      // Extract key findings
      const keyFindings = this.extractKeyFindings(response);
      
      return {
        riskScore: riskScoreMatch ? parseInt(riskScoreMatch[1]) : 50,
        threatLevel: threatLevelMatch ? threatLevelMatch[1].toLowerCase() : 'medium',
        confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7,
        recommendations,
        keyFindings,
        rawResponse: response,
        analysisType,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      return {
        riskScore: 50,
        threatLevel: 'medium',
        confidence: 0.5,
        recommendations: ['Manual review required'],
        keyFindings: ['AI analysis failed'],
        rawResponse: response,
        analysisType,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Extract recommendations from AI response
   * @param {string} response - AI response text
   * @returns {Array} Array of recommendations
   */
  extractRecommendations(response) {
    const recommendations = [];
    const lines = response.split('\n');
    
    let inRecommendations = false;
    lines.forEach(line => {
      if (line.toLowerCase().includes('recommendation')) {
        inRecommendations = true;
        return;
      }
      
      if (inRecommendations && line.trim().startsWith('-')) {
        recommendations.push(line.trim().substring(1).trim());
      }
    });
    
    return recommendations.length > 0 ? recommendations : ['Review incident details'];
  }

  /**
   * Extract key findings from AI response
   * @param {string} response - AI response text
   * @returns {Array} Array of key findings
   */
  extractKeyFindings(response) {
    const findings = [];
    const lines = response.split('\n');
    
    let inFindings = false;
    lines.forEach(line => {
      if (line.toLowerCase().includes('finding')) {
        inFindings = true;
        return;
      }
      
      if (inFindings && line.trim().startsWith('-')) {
        findings.push(line.trim().substring(1).trim());
      }
    });
    
    return findings.length > 0 ? findings : ['Analysis completed'];
  }

  /**
   * Generate security report using AI
   * @param {Object} reportData - Data for report generation
   * @returns {Object} Generated report
   */
  async generateSecurityReport(reportData) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return this.generateFallbackReport(reportData);
      }

      const prompt = this.buildReportPrompt(reportData);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: this.systemPrompts.reportGeneration },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.4
      });

      return {
        content: response.choices[0].message.content,
        generatedAt: new Date().toISOString(),
        type: 'ai-generated'
      };
      
    } catch (error) {
      logger.error('Error generating security report:', error);
      return this.generateFallbackReport(reportData);
    }
  }

  /**
   * Build prompt for report generation
   * @param {Object} reportData - Report data
   * @returns {string} Formatted prompt
   */
  buildReportPrompt(reportData) {
    return `Generate a comprehensive security report based on the following data:

    Report Type: ${reportData.type || 'General Security Report'}
    Time Period: ${reportData.timePeriod || 'Recent'}
    
    Data Summary:
    - Total Incidents: ${reportData.totalIncidents || 0}
    - Critical Issues: ${reportData.criticalIssues || 0}
    - Resolved Issues: ${reportData.resolvedIssues || 0}
    - Pending Issues: ${reportData.pendingIssues || 0}
    
    ${reportData.incidents ? `Recent Incidents: ${JSON.stringify(reportData.incidents)}` : ''}
    
    Please generate a professional security report including:
    1. Executive Summary
    2. Key Metrics and Trends
    3. Incident Analysis
    4. Risk Assessment
    5. Recommendations
    6. Next Steps
    
    Format the report for both technical and executive audiences.`;
  }

  /**
   * Fallback analysis when AI is not available
   * @param {Object} threatData - Threat data
   * @param {string} analysisType - Analysis type
   * @returns {Object} Fallback analysis
   */
  fallbackAnalysis(threatData, analysisType) {
    logger.info('Using fallback analysis - AI service unavailable');
    
    // Simple rule-based analysis
    let riskScore = 50;
    let threatLevel = 'medium';
    let recommendations = ['Manual review recommended'];
    let keyFindings = ['Automated analysis completed'];

    // Adjust based on severity
    if (threatData.severity === 'critical') {
      riskScore = 90;
      threatLevel = 'critical';
      recommendations = ['Immediate action required', 'Escalate to security team'];
    } else if (threatData.severity === 'high') {
      riskScore = 75;
      threatLevel = 'high';
      recommendations = ['Priority review needed'];
    } else if (threatData.severity === 'low') {
      riskScore = 25;
      threatLevel = 'low';
      recommendations = ['Standard monitoring'];
    }

    return {
      riskScore,
      threatLevel,
      confidence: 0.6,
      recommendations,
      keyFindings,
      rawResponse: 'Fallback analysis - AI service unavailable',
      analysisType,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate fallback report when AI is not available
   * @param {Object} reportData - Report data
   * @returns {Object} Fallback report
   */
  generateFallbackReport(reportData) {
    return {
      content: `
# Security Report - ${new Date().toLocaleDateString()}

## Executive Summary
This report covers security incidents and metrics for the specified period.

## Key Metrics
- Total Incidents: ${reportData.totalIncidents || 0}
- Critical Issues: ${reportData.criticalIssues || 0}
- Resolved Issues: ${reportData.resolvedIssues || 0}

## Recommendations
1. Continue monitoring security metrics
2. Review and update security policies
3. Conduct regular security assessments

*Note: This report was generated using fallback analysis. AI services are currently unavailable.*
      `,
      generatedAt: new Date().toISOString(),
      type: 'fallback-generated'
    };
  }

  /**
   * Analyze breach data specifically
   * @param {Object} breachData - Breach data to analyze
   * @returns {Object} Breach analysis results
   */
  async analyzeBreach(breachData) {
    return await this.analyzeThreat(breachData, 'breachAnalysis');
  }

  /**
   * Assess risk level
   * @param {Object} riskData - Risk data to assess
   * @returns {Object} Risk assessment results
   */
  async assessRisk(riskData) {
    return await this.analyzeThreat(riskData, 'riskAssessment');
  }
}

module.exports = new AIService();
