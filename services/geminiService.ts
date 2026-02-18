import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

/**
 * Enhances an image using Gemini to simulate high-res Sony A1 processing.
 * Since direct image-to-image editing isn't fully standard in the basic generateContent without Imagen,
 * we will use the model to analyze the image and return a description, 
 * OR if the specific model supports editing, we use that.
 * 
 * For this demo, we will use a prompt that instructs the model to describe the necessary edits,
 * effectively simulating the "AI Processing" step.
 * 
 * Ideally, we would use `gemini-2.5-flash-image` with an editing prompt if supported by the environment,
 * or `imagen-3.0-generate-001` if we were generating from scratch.
 * 
 * Given the constraint to strictly follow guidelines, we will use `gemini-2.5-flash-image` to
 * analyze the image to provide "Professional Photographer Insights" which we display,
 * while the visual stacking happens in Canvas (in imageProcessingService).
 */
export const analyzeImageScene = async (base64Image: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key missing");
    return "API Key missing. AI features disabled.";
  }

  try {
    const model = ai.models.getGenerativeModel({ model: 'gemini-2.5-flash-image' }); // Using the vision capable model

    // Extract base64 data (remove header if present)
    const base64Data = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg'
            }
          },
          {
            text: "Analyze this image as a professional photographer using a Sony A1. Suggest the optimal EXIF settings (ISO, Shutter, Aperture) used to take this shot and provide a 1-sentence critique on composition."
          }
        ]
      }
    });

    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Could not analyze scene.";
  }
};
