import { NextRequest, NextResponse } from 'next/server';
import { analyzeLearningData, calculateImprovementTrend, LearningData } from '@/lib/learning-system';
import { saveTrainingExample, loadTrainingExamples } from '@/lib/server-database';
import { TrainingExample } from '@/lib/ai-training';

interface TrainingFeedback {
  id: string;
  image: string;
  aiResult: any;
  userFeedback: 'correct' | 'incorrect';
  userCorrections?: any;
  timestamp: string;
  provider?: string;
}

export async function POST(request: NextRequest) {
  try {
    const feedback: TrainingFeedback = await request.json();
    
    // Konvertera till TrainingExample och spara permanent
    const trainingExample: TrainingExample = {
      id: feedback.id,
      image: feedback.image,
      aiResult: feedback.aiResult,
      correctResult: feedback.userCorrections || feedback.aiResult, // Använd korrigeringar om tillgängliga
      feedback: feedback.userFeedback,
      provider: feedback.provider || 'Okänd',
      timestamp: new Date(feedback.timestamp),
      confidence: feedback.aiResult.confidence || 0.8
    };
    
    // Spara till databas
    await saveTrainingExample(trainingExample);
    
    // Ladda alla träningsexempel för analys
    const allExamples = await loadTrainingExamples();
    const learningData: LearningData[] = allExamples.map(d => ({
      id: d.id,
      image: d.image,
      aiResult: d.aiResult,
      userFeedback: d.feedback,
      userCorrections: d.correctResult,
      timestamp: d.timestamp,
      provider: d.provider
    }));
    
    const insights = analyzeLearningData(learningData);
    const improvementTrend = calculateImprovementTrend(learningData);
    
    return NextResponse.json({
      success: true,
      message: 'Feedback sparad permanent! AI:n lär sig från din feedback.',
      insights,
      improvementTrend,
      totalExamples: allExamples.length
    });
  } catch (error) {
    console.error('[Training API] Fel:', error);
    return NextResponse.json({
      success: false,
      error: 'Fel vid sparande av feedback'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Ladda träningsexempel från databas
    const allExamples = await loadTrainingExamples();
    const learningData: LearningData[] = allExamples.map(d => ({
      id: d.id,
      image: d.image,
      aiResult: d.aiResult,
      userFeedback: d.feedback,
      userCorrections: d.correctResult,
      timestamp: d.timestamp,
      provider: d.provider
    }));
    
    const insights = analyzeLearningData(learningData);
    const improvementTrend = calculateImprovementTrend(learningData);
    
    const stats = {
      totalInvoices: allExamples.length,
      correctAnswers: allExamples.filter(d => d.feedback === 'correct').length,
      accuracy: allExamples.length > 0 
        ? Math.round((allExamples.filter(d => d.feedback === 'correct').length / allExamples.length) * 100)
        : 0,
      recentFeedback: allExamples.slice(-10),
      insights,
      improvementTrend
    };
    
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('[Training API] Fel vid GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Fel vid hämtning av statistik'
    }, { status: 500 });
  }
}

function analyzeTrainingData(data: TrainingFeedback[]) {
  const total = data.length;
  const correct = data.filter(d => d.userFeedback === 'correct').length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  
  // Analysera vanliga fel
  const incorrectResults = data.filter(d => d.userFeedback === 'incorrect');
  const commonErrors = [];
  
  if (incorrectResults.length > 0) {
    // Här kan du lägga till mer avancerad analys av fel
    commonErrors.push('AI:n behöver förbättras på extra avgifter');
    commonErrors.push('Moms hantering kan förbättras');
  }
  
  return {
    totalInvoices: total,
    accuracy: Math.round(accuracy),
    commonErrors,
    recommendations: generateRecommendations(accuracy, total)
  };
}

function generateRecommendations(accuracy: number, totalInvoices: number): string[] {
  const recommendations = [];
  
  if (totalInvoices < 5) {
    recommendations.push('Träna med fler fakturor för bättre resultat');
  }
  
  if (accuracy < 80) {
    recommendations.push('Överväg att uppdatera AI-prompten');
  } else if (accuracy > 90) {
    recommendations.push('Utmärkt! AI:n presterar bra');
  }
  
  if (totalInvoices > 20) {
    recommendations.push('Tillräckligt med träningsdata för att optimera systemet');
  }
  
  return recommendations;
}
