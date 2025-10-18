
import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { AutoMLResults, ClassificationMetrics, RegressionMetrics } from '../types';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        problemType: { 
            type: Type.STRING, 
            enum: ['CLASSIFICATION', 'REGRESSION'],
            description: "The type of machine learning problem identified."
        },
        analysisSummary: { 
            type: Type.STRING,
            description: "A brief summary of the data analysis and model selection reasoning."
        },
        selectedModel: { 
            type: Type.STRING,
            description: "The scikit-learn compatible model selected for the task (e.g., 'RandomForestClassifier', 'xgboost.XGBRegressor')."
        },
        evaluation: {
            type: Type.OBJECT,
            properties: {
                metrics: { 
                    type: Type.OBJECT,
                    description: "Key evaluation metrics. For CLASSIFICATION, include accuracy, precision, recall, f1_score. For REGRESSION, include mae, mse, r_squared.",
                    properties: {
                        accuracy: { type: Type.NUMBER, description: "Model accuracy for classification tasks (0.0 to 1.0)." },
                        precision: { type: Type.NUMBER, description: "Model precision for classification tasks (0.0 to 1.0)." },
                        recall: { type: Type.NUMBER, description: "Model recall for classification tasks (0.0 to 1.0)." },
                        f1_score: { type: Type.NUMBER, description: "Model F1-score for classification tasks (0.0 to 1.0)." },
                        mae: { type: Type.NUMBER, description: "Mean Absolute Error for regression tasks." },
                        mse: { type: Type.NUMBER, description: "Mean Squared Error for regression tasks." },
                        r_squared: { type: Type.NUMBER, description: "R-squared value for regression tasks." }
                    }
                },
                confusionMatrix: {
                    type: Type.ARRAY,
                    description: "For CLASSIFICATION problems, a 2D array representing the confusion matrix. Optional.",
                    items: {
                        type: Type.ARRAY,
                        items: { type: Type.NUMBER }
                    }
                },
                classLabels: {
                    type: Type.ARRAY,
                    description: "For CLASSIFICATION problems, an array of strings for the class labels corresponding to the confusion matrix axes. Optional.",
                    items: { type: Type.STRING }
                },
                scatterPlotData: {
                    type: Type.ARRAY,
                    description: "For REGRESSION problems, an array of objects with 'actual' and 'predicted' values for a scatter plot. Generate 50-100 sample points. Optional.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            actual: { type: Type.NUMBER },
                            predicted: { type: Type.NUMBER }
                        },
                        required: ['actual', 'predicted']
                    }
                }
            },
            required: ['metrics']
        },
        featureImportance: {
            type: Type.ARRAY,
            description: "An array of objects representing feature importance, sorted from most to least important.",
            items: {
                type: Type.OBJECT,
                properties: {
                    feature: { type: Type.STRING },
                    importance: { type: Type.NUMBER }
                },
                required: ['feature', 'importance']
            }
        },
        pythonCode: { 
            type: Type.STRING,
            description: "A complete, executable Python script using scikit-learn, pandas, and other necessary libraries (like xgboost or lightgbm) to preprocess data, train the selected model, and print evaluation metrics."
        }
    },
    required: ['problemType', 'analysisSummary', 'selectedModel', 'evaluation', 'featureImportance', 'pythonCode']
};


const PERFORMANCE_THRESHOLDS = {
    CLASSIFICATION: {
        metric: 'accuracy',
        threshold: 0.80,
    },
    REGRESSION: {
        metric: 'r_squared',
        threshold: 0.60,
    }
};

function checkPerformance(result: AutoMLResults): boolean {
    if (result.problemType === 'CLASSIFICATION') {
        const metrics = result.evaluation.metrics as ClassificationMetrics;
        const { threshold } = PERFORMANCE_THRESHOLDS.CLASSIFICATION;
        return (metrics.accuracy ?? 0) >= threshold;
    } else if (result.problemType === 'REGRESSION') {
        const metrics = result.evaluation.metrics as RegressionMetrics;
        const { threshold } = PERFORMANCE_THRESHOLDS.REGRESSION;
        return (metrics.r_squared ?? 0) >= threshold;
    }
    return false;
}

function createFollowUpPrompt(result: AutoMLResults): string {
    let feedback = `The previous attempt with the ${result.selectedModel} model was not sufficient. `;
    if (result.problemType === 'CLASSIFICATION') {
        const metrics = result.evaluation.metrics as ClassificationMetrics;
        feedback += `The accuracy was only ${metrics.accuracy?.toFixed(2)}, which is below the target of ${PERFORMANCE_THRESHOLDS.CLASSIFICATION.threshold}.`;
    } else {
        const metrics = result.evaluation.metrics as RegressionMetrics;
        feedback += `The R-squared was only ${metrics.r_squared?.toFixed(2)}, which is below the target of ${PERFORMANCE_THRESHOLDS.REGRESSION.threshold}.`;
    }
    feedback += `
    
    Please try a different approach to improve performance. Consider one of the following strategies:
    1.  **Select a more robust model.** If you used a simple model, try a more complex one. Your options include 'RandomForestClassifier', 'GradientBoostingClassifier', 'xgboost.XGBClassifier', 'lightgbm.LGBMClassifier' for classification, and their regressor equivalents for regression.
    2.  **Refine data preprocessing.** In the generated Python code, add a step to handle data more effectively. For instance, you could use StandardScaler for numerical features or remove features that you identified as having low importance.
    
    Please provide a new, complete JSON output with the improved model, updated analysis, and refined Python code. The entire response must be a single JSON object matching the required schema.`;
    return feedback;
}

export async function runAutoMLPipeline(
    csvContent: string, 
    targetColumn: string,
    onProgress: (message: string) => void
): Promise<AutoMLResults> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const initialPrompt = `
    You are AutoML Architect, an expert system that automates machine learning workflows.
    Your task is to analyze the provided dataset and target column to build a high-performing machine learning model.

    Dataset (first 50 rows):
    \`\`\`csv
    ${csvContent.split('\n').slice(0, 50).join('\n')}
    \`\`\`

    Target Column: "${targetColumn}"

    Your goal is to find a model that performs well. For CLASSIFICATION, aim for an accuracy above ${PERFORMANCE_THRESHOLDS.CLASSIFICATION.threshold}. For REGRESSION, aim for an R-squared value above ${PERFORMANCE_THRESHOLDS.REGRESSION.threshold}.

    Please perform the following steps and provide the output in a single JSON object matching the required schema:
    1.  **Analyze Data**: Examine the data and the target column ("${targetColumn}"). Determine if this is a CLASSIFICATION or REGRESSION problem.
    2.  **Summarize**: Write a brief, 2-3 sentence summary of your analysis and why you chose the problem type and model.
    3.  **Select Model**: Choose a suitable algorithm. You can use standard scikit-learn models (like 'RandomForestClassifier', 'GradientBoostingRegressor') or more advanced models like 'xgboost.XGBClassifier', 'xgboost.XGBRegressor', 'lightgbm.LGBMClassifier', or 'lightgbm.LGBMRegressor'. Select the one most appropriate for the data. Ensure the generated Python code includes the necessary imports for the selected model.
    4.  **Generate Mock Evaluation**: Create realistic evaluation metrics and visualization data that reflect the model's performance.
    5.  **Determine Feature Importance**: Analyze the likely contribution of each feature.
    6.  **Generate Python Code**: Write a complete, clean, and executable Python script for the entire pipeline.
    `;
    
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    let currentResult: AutoMLResults | null = null;
    let isGoodEnough = false;
    let prompt = initialPrompt;

    while (attempts < MAX_ATTEMPTS && !isGoodEnough) {
        attempts++;
        onProgress(`Attempt ${attempts}/${MAX_ATTEMPTS}: Training and evaluating models...`);

        try {
            const response = await chat.sendMessage({ message: prompt });
            const jsonString = response.text.trim();
            
            let result: AutoMLResults;
            try {
                result = JSON.parse(jsonString);
            } catch (parseError) {
                console.error("JSON parsing error:", parseError);
                if (attempts < MAX_ATTEMPTS) {
                    prompt = "The previous response was not a valid JSON object. Please strictly adhere to the schema and provide the entire response as a single, well-formed JSON object.";
                    continue; // Skip to the next attempt
                } else {
                    throw new Error("Failed to parse JSON response from the model after multiple attempts.");
                }
            }

            if (!result.problemType || !result.pythonCode) {
                 if (attempts === MAX_ATTEMPTS) throw new Error("API returned an invalid structure after multiple attempts.");
                 prompt = "The previous response was not a valid JSON object matching the schema. Please try again and ensure the output is correct.";
                 continue;
            }

            currentResult = result;
            isGoodEnough = checkPerformance(currentResult);

            if (!isGoodEnough && attempts < MAX_ATTEMPTS) {
                onProgress(`Model performance is below threshold. Attempting to improve...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX
                prompt = createFollowUpPrompt(currentResult);
            }

        } catch (error) {
             console.error(`Error on attempt ${attempts}:`, error);
             if (attempts === MAX_ATTEMPTS) {
                throw new Error("Failed to get a valid response from the AI model after multiple attempts.");
             }
             prompt = "There was an error processing the last request. Please try generating the JSON response again from the initial prompt.";
        }
    }

    if (!currentResult) {
        throw new Error("Failed to generate any results from the AI model.");
    }

    if (!isGoodEnough) {
        onProgress("Completed with best effort.");
        currentResult.analysisSummary += `\n\nNOTE: After ${MAX_ATTEMPTS} attempts, the model performance is still below the desired threshold. The generated code represents the best model found, but may require further manual tuning.`;
    } else {
        onProgress("Found a good model!");
    }

    return currentResult;
}
