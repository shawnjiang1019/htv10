from typing import TypedDict, Annotated, Optional, List, Dict
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.checkpoint.memory import MemorySaver
from uuid import uuid4
from elevenlabs.client import ElevenLabs
import json
import os
import google.generativeai as genai
import pygame
import tempfile
import time
from datetime import datetime
from .vector_db import VectorDB
from .elevens_labs import text_to_speech, stop_audio, pause_audio, resume_audio

class State(TypedDict):
    claim: str
    round_number: int
    max_rounds: int
    conversation_history: list
    include_audio: bool
    pro_voice: str
    con_voice: str
    debate_mode: str  # "text_only", "both"

class RAGDebateAgent:

    def __init__(self, name, position, model, db_vector):
        self.name = name
        self.position = position
        self.model = model
        self.db_vector = db_vector

    def retrieve_evidence(self, query, top_k=5):
        """Retrieve evidence from vector database"""
        evidence = []
        
        if self.db_vector:
            try:
                vector_results = self.db_vector.search(query, top_k)
                for docs, score in vector_results:
                    evidence.append({
                        "content": docs.page_content, 
                        "source": docs.metadata.get('source', 'Unknown'),
                        "score": score
                    })
            except Exception as e:
                print(f"Vector DB error: {e}")
                
        return evidence


    def generate_debate_response(self, state: State): 
        """Generate a debate response using evidence"""
        search_query = f"{state['claim']} {self.position} arguments"
        evidence = self.retrieve_evidence(search_query, top_k=5)

        evidence_context = ""
        for i, ev in enumerate(evidence, 1):
            evidence_context += f"Evidence {i} ({ev['source']}): {ev['content']}...\n"

        history_context = ""
        if state['conversation_history']:
            history_context = "Previous exchanges:\n"
            for entry in state['conversation_history']:
                history_context += f"{entry['speaker']}: {entry['response']}...\n"

        prompt = f"""
                    You are {self.name}, a {self.position}ponent in a debate.

                    DEBATE TOPIC: "{state['claim']}"

                    ROUND: {state['round_number']}/{state['max_rounds']}

                    {history_context}

                    EVIDENCE TO SUPPORT YOUR {self.position.upper()} POSITION:
                    {evidence_context}

                    INSTRUCTIONS:
                    1. Use the evidence above to support your {self.position} argument.
                    2. Only state your facts and reasoning, sycophancy should be minimal
                    3. Address any points made by the opponent.
                    4. Be extremely concise.
                    5. Keep response concise and cite evidence where possible.

                    Your {self.position} response:
                    """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating response: {e}"


class DebateService:

    def __init__(self):
        # Configure Google API key
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        genai.configure(api_key=api_key)
        
        self.model = genai.GenerativeModel('gemini-2.5-pro')
        self.pinecone_db = VectorDB("rag-debate-index")

        self.pro_agent = RAGDebateAgent(
            name="Proponent",
            position="pro",
            model=self.model,
            db_vector=self.pinecone_db
        )

        self.con_agent = RAGDebateAgent(
            name="Conponent", 
            position="con",
            model=self.model,
            db_vector=self.pinecone_db
        )
        
        self._build_debate_graph()


    def _build_debate_graph(self):
        """Build the LangGraph debate workflow"""
        graph_builder = StateGraph(State)
        
        # Add nodes
        graph_builder.add_node("pro_agent", self._pro_agent_node)
        graph_builder.add_node("con_agent", self._con_agent_node)
        
        # Add conditional routing
        graph_builder.add_conditional_edges(
            "pro_agent",
            self._should_continue,
            {
                "con_agent": "con_agent",
                "end": END
            }
        )
        
        graph_builder.add_conditional_edges(
            "con_agent", 
            self._should_continue,
            {
                "pro_agent": "pro_agent",
                "end": END
            }
        )
        
        graph_builder.set_entry_point("pro_agent")
        
        self.compiled_graph = graph_builder.compile()

    def _play_agent_audio(self, text: str, voice_name: str):
        """Play audio for agent response"""
        try:
            print(f"🎤 Playing audio for {voice_name}: {text[:50]}...")
            success = text_to_speech(text, voice_name)
            if success:
                print(f"✅ Audio played successfully for {voice_name}")
            else:
                print(f"❌ Failed to play audio for {voice_name}")
        except Exception as e:
            print(f"❌ Error playing audio for {voice_name}: {e}")

    def _should_play_audio(self, state: State) -> bool:
        """Determine if audio should be played based on debate mode"""
        debate_mode = state.get("debate_mode", "both")
        include_audio = state.get("include_audio", False)
        
        if not include_audio:
            return False
            
        return debate_mode == "both"

    def _should_show_text(self, state: State) -> bool:
        """Determine if text should be shown based on debate mode"""
        debate_mode = state.get("debate_mode", "both")
        return debate_mode in ["text_only", "both"]

    def _pro_agent_node(self, state):
        response = self.pro_agent.generate_debate_response(state)
        
        # Play audio if enabled based on debate mode
        if self._should_play_audio(state):
            voice_name = state.get("pro_voice", "Rachel")
            self._play_agent_audio(response, voice_name)
        
        # Update conversation history
        new_entry = {
            "speaker": "Proponent",
            "response": response,
            "round": state["round_number"],
            "show_text": self._should_show_text(state),
            "play_audio": self._should_play_audio(state)
        }

        updated_history = state["conversation_history"] + [new_entry]

        return {
            "conversation_history": updated_history,
            "round_number": state["round_number"] + 1
        }

    def _con_agent_node(self, state):
        response = self.con_agent.generate_debate_response(state)
        
        # Play audio if enabled based on debate mode
        if self._should_play_audio(state):
            voice_name = state.get("con_voice", "Adam")
            self._play_agent_audio(response, voice_name)
        
        # Update conversation history
        new_entry = {
            "speaker": "Conponent",
            "response": response,
            "round": state["round_number"],
            "show_text": self._should_show_text(state),
            "play_audio": self._should_play_audio(state)
        }

        updated_history = state["conversation_history"] + [new_entry]

        return {
            "conversation_history": updated_history,
            "round_number": state["round_number"] + 1
        }

    def _should_continue(self, state: State):
        """Determine if debate should continue"""
        if state["round_number"] >= state["max_rounds"]:
            return "end"
        elif state["round_number"] % 2 == 1:  # Odd rounds go to pro_agent
            return "pro_agent"
        else:  # Even rounds go to con_agent
            return "con_agent"    

    def run_debate(self, claim: str, max_rounds: int = 4, include_audio: bool = False, 
                   pro_voice: str = "Rachel", con_voice: str = "Adam", debate_mode: str = "both"):
        """Run a debate with the given claim"""
        initial_state = {
            "claim": claim,
            "round_number": 1,
            "max_rounds": max_rounds,
            "conversation_history": [],
            "include_audio": include_audio,
            "pro_voice": pro_voice,
            "con_voice": con_voice,
            "debate_mode": debate_mode
        }
        
        try:
            result = self.compiled_graph.invoke(initial_state)
            return result
        except Exception as e:
            raise Exception(f"Error running debate: {e}")        
        
    
    async def run_debate_stream(self, claim: str, max_rounds: int = 4, include_audio: bool = False, 
                           pro_voice: str = "Rachel", con_voice: str = "Adam", debate_mode: str = "both"):
        """Run a debate with streaming responses"""
        initial_state = {
            "claim": claim,
            "round_number": 1,
            "max_rounds": max_rounds,
            "conversation_history": [],
            "include_audio": include_audio,
            "pro_voice": pro_voice,
            "con_voice": con_voice,
            "debate_mode": debate_mode
        }
        
        current_state = initial_state
        
        while current_state["round_number"] <= max_rounds:
            # Determine which agent should respond
            if current_state["round_number"] % 2 == 1:
                # Pro agent turn
                updated_state = self._pro_agent_node(current_state)
                agent_type = "pro"
            else:
                # Con agent turn  
                updated_state = self._con_agent_node(current_state)
                agent_type = "con"
            
            # Update state
            current_state.update(updated_state)
            
            # Get the latest message
            latest_message = current_state["conversation_history"][-1]
            
            # Yield the message for streaming
            yield {
                "type": "message",
                "speaker": agent_type,
                "message": latest_message["response"],
                "round": latest_message["round"],
                "timestamp": str(datetime.now()),
                "show_text": latest_message.get("show_text", True),
                "play_audio": latest_message.get("play_audio", False)
            }
        
        # Send completion message
        yield {
            "type": "complete",
            "total_exchanges": len(current_state["conversation_history"]),
            "conversation_history": current_state["conversation_history"]
        }

debate_service = DebateService()