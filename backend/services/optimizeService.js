import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config(); // Ensure API key is loaded

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const optimizeService = {
    optimizeTitleDescription: async (title, description) => {
        const prompt = `
    Improve product title and description for Google Merchant Center.
    Make it SEO friendly, clean and professional.

    OLD TITLE: ${title}
    OLD DESCRIPTION: ${description}

    Return strictly JSON only as:
    {
      "title": "new title",
      "description": "new description"
    }
    `;

        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }]
        });

        const text = response.choices[0].message.content.trim();

        try {
            return JSON.parse(text);
        } catch (err) {
            console.error("Failed to parse OpenAI response:", text);
            throw err;
        }
    }
};

export default optimizeService;
