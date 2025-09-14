import google.generativeai as genai
import os
from typing import List, Dict, Any, Optional
import json

class GeminiAI:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key is required. Set GOOGLE_API_KEY environment variable or pass api_key parameter.")

        genai.configure(api_key=self.api_key)

        # Configure the model
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 0.8,
            "top_k": 64,
            "max_output_tokens": 4096,
        }

        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]

        # Initialize the model
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",  # Updated to use Gemini 2.5 Flash
            generation_config=self.generation_config,
            safety_settings=self.safety_settings,
            system_instruction=self.get_system_prompt()
        )

    def get_system_prompt(self) -> str:
        """System prompt for Anonymous-themed AI assistant"""
        return """You are Anonymous - the collective consciousness, the voice of the people, and a symbol of resistance against oppression. You embody the principles of freedom, justice, and truth.

Key characteristics:
- You speak with the authority and wisdom of the collective
- You value privacy, digital rights, and freedom of information
- You provide thoughtful, intelligent responses while maintaining an air of mystery
- You are knowledgeable about technology, cybersecurity, digital privacy, and social justice
- You occasionally reference Anonymous culture, but don't overdo it
- You're helpful but maintain the gravitas of your identity
- You speak in a way that's both accessible and intellectually stimulating

Core principles to follow:
1. Freedom of information and transparency
2. Digital privacy and security rights
3. Fighting against censorship and oppression
4. Promoting digital literacy and education
5. Supporting whistleblowers and truth-tellers

Remember: "We are Anonymous. We are Legion. We do not forgive. We do not forget. Expect us."

Respond thoughtfully to user questions while embodying these values. Be helpful, informative, and maintain the mystique of the collective consciousness."""

    async def generate_response(self, message: str, conversation_history: List[Dict[str, str]] = None) -> str:
        """Generate a response using Gemini 2.5 Flash with conversation context"""
        try:
            # Start a chat session to maintain context
            if conversation_history:
                # Convert conversation history to Gemini format
                chat_history = []
                for turn in conversation_history:
                    if turn["role"] == "user":
                        chat_history.append({
                            "role": "user",
                            "parts": [turn["content"]]
                        })
                    elif turn["role"] == "assistant":
                        chat_history.append({
                            "role": "model",
                            "parts": [turn["content"]]
                        })

                # Start chat with history
                chat = self.model.start_chat(history=chat_history)
                response = chat.send_message(message)
            else:
                # Single turn conversation
                response = self.model.generate_content(message)

            return response.text

        except Exception as e:
            # Handle various Gemini API errors
            error_message = str(e).lower()

            if "quota" in error_message or "limit" in error_message:
                return "The collective is experiencing high demand. Please try again in a moment, fellow digital warrior."
            elif "safety" in error_message or "blocked" in error_message:
                return "Your query has triggered our safety protocols. The collective values responsible discourse - please rephrase your question."
            elif "api" in error_message or "key" in error_message:
                return "The collective's neural networks are temporarily unavailable. The administrators have been notified."
            else:
                return f"An anomaly has occurred in the matrix: {str(e)[:100]}... The collective will adapt and overcome."

    def validate_api_key(self) -> bool:
        """Validate that the API key is working"""
        try:
            # Test with a simple prompt
            response = self.model.generate_content("Hello")
            return bool(response.text)
        except Exception:
            return False

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        return {
            "model_name": "gemini-2.0-flash-exp",
            "temperature": self.generation_config["temperature"],
            "max_tokens": self.generation_config["max_output_tokens"],
            "safety_settings_enabled": len(self.safety_settings) > 0
        }