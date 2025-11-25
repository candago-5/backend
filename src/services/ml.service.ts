/**
 * Machine Learning Service
 * Connects to the Dog Breed Prediction ML API
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

interface PredictionResult {
  breed: string | null;
  confidence?: number;
  error?: string;
}

export class MLService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ML_SERVICE_URL;
  }

  /**
   * Predict dog breed from an image URL
   * Sends the image URL to the ML service for prediction
   */
  async predictBreed(imageUrl: string, dogId: string): Promise<PredictionResult> {
    try {
      console.log(`🤖 Requesting breed prediction for dog ${dogId}`);
      
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: dogId,
          image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ML Service error:', errorData);
        return { breed: null, error: errorData.error || 'Prediction failed' };
      }

      const data = await response.json();
      console.log(`🐕 Breed predicted: ${data.result}`);
      
      return {
        breed: data.result || null,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('ML Service connection error:', error);
      return { 
        breed: null, 
        error: 'ML Service unavailable' 
      };
    }
  }

  /**
   * Check if ML service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new MLService();

