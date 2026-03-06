from __future__ import annotations

import operator
import os
import re
from datetime import date
from pathlib import Path
from typing import TypedDict, List, Optional, Literal, Annotated, AsyncIterator, Dict, Any

from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, START, END
from langgraph.types import Send

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.tools.tavily_search import TavilySearchResults

# -----------------------------
# Schemas
# -----------------------------
class Task(BaseModel):
    id: int
    title: str
    goal: str = Field(
        ...,
        description="One sentence describing what the reader should be able to do/understand after this section.",
    )
    bullets: List[str] = Field(
        ...,
        min_length=3,
        max_length=6,
        description="3–6 concrete, non-overlapping subpoints to cover in this section.",
    )
    target_words: int = Field(..., description="Target word count for this section (120–550).")
    tags: List[str] = Field(default_factory=list)
    requires_research: bool = False
    requires_citations: bool = False
    requires_code: bool = False


class Plan(BaseModel):
    blog_title: str
    audience: str
    tone: str
    blog_kind: Literal["explainer", "tutorial", "news_roundup", "comparison", "system_design"] = "explainer"
    constraints: List[str] = Field(default_factory=list)
    tasks: List[Task]


class EvidenceItem(BaseModel):
    title: str
    url: str
    published_at: Optional[str] = None
    snippet: Optional[str] = None
    source: Optional[str] = None


class RouterDecision(BaseModel):
    needs_research: bool
    mode: Literal["closed_book", "hybrid", "open_book"]
    queries: List[str] = Field(default_factory=list)


class EvidencePack(BaseModel):
    evidence: List[EvidenceItem] = Field(default_factory=list)


class ImageSpec(BaseModel):
    placeholder: str = Field(..., description="e.g. [[IMAGE_1]]")
    filename: str = Field(..., description="Save under images/, e.g. qkv_flow.png")
    alt: str
    caption: str
    prompt: str = Field(..., description="Prompt to send to the image model.")
    size: Literal["1024x1024", "1024x1536", "1536x1024"] = "1024x1024"
    quality: Literal["low", "medium", "high"] = "medium"


class GlobalImagePlan(BaseModel):
    md_with_placeholders: str
    images: List[ImageSpec] = Field(default_factory=list)


class State(TypedDict):
    topic: str
    mode: str
    needs_research: bool
    queries: List[str]
    evidence: List[EvidenceItem]
    plan: Optional[Plan]
    sections: Annotated[List[tuple[int, str]], operator.add]
    merged_md: str
    md_with_placeholders: str
    image_specs: List[dict]
    final: str


# -----------------------------
# Agent with Streaming
# -----------------------------
class BlogAgent:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
        self.graph = self._build_graph()
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        g = StateGraph(State)
        
        # Add nodes
        g.add_node("router", self._router_node)
        g.add_node("research", self._research_node)
        g.add_node("orchestrator", self._orchestrator_node)
        g.add_node("worker", self._worker_node)
        g.add_node("reducer", self._reducer_node)
        
        # Add edges
        g.add_edge(START, "router")
        g.add_conditional_edges("router", self._route_next, {"research": "research", "orchestrator": "orchestrator"})
        g.add_edge("research", "orchestrator")
        g.add_conditional_edges("orchestrator", self._fanout, ["worker"])
        g.add_edge("worker", "reducer")
        g.add_edge("reducer", END)
        
        return g.compile()
    
    async def run_streaming(self, topic: str) -> AsyncIterator[Dict[str, Any]]:
        """Run the agent and stream updates"""
        initial_state = {
            "topic": topic,
            "mode": "",
            "needs_research": False,
            "queries": [],
            "evidence": [],
            "plan": None,
            "sections": [],
            "merged_md": "",
            "md_with_placeholders": "",
            "image_specs": [],
            "final": "",
        }
        
        # Stream events from the graph
        async for event in self.graph.astream(initial_state):
            for node_name, node_output in event.items():
                if node_name == "router":
                    yield {
                        "type": "workflow",
                        "data": {
                            "node": "router",
                            "status": "in-progress"
                        }
                    }
                    yield {
                        "type": "workflow",
                        "data": {
                            "node": "router",
                            "status": "completed",
                            "mode": node_output.get("mode"),
                            "needs_research": node_output.get("needs_research"),
                            "queries": node_output.get("queries", [])
                        }
                    }
                elif node_name == "research":
                    yield {
                        "type": "workflow",
                        "data": {
                            "node": "research",
                            "status": "in-progress"
                        }
                    }
                    evidence = node_output.get("evidence", [])
                    yield {
                        "type": "workflow",
                        "data": {
                            "node": "research",
                            "status": "completed",
                            "evidence_count": len(evidence)
                        }
                    }
                elif node_name == "orchestrator":
                    yield {
                        "type": "workflow",
                        "data": {
                            "node": "orchestrator",
                            "status": "in-progress"
                        }
                    }
                    plan = node_output.get("plan")
                    if plan:
                        yield {
                            "type": "plan",
                            "data": plan.model_dump() if hasattr(plan, "model_dump") else plan
                        }
                        yield {
                            "type": "workflow",
                            "data": {
                                "node": "orchestrator",
                                "status": "completed",
                                "sections_count": len(plan.tasks) if hasattr(plan, "tasks") else 0
                            }
                        }
                elif node_name == "worker":
                    sections = node_output.get("sections", [])
                    if sections:
                        task_id, section_md = sections[-1]
                        yield {
                            "type": "workflow",
                            "data": {
                                "node": "worker",
                                "status": "in-progress",
                                "task_id": task_id
                            }
                        }
                        yield {
                            "type": "section",
                            "data": {
                                "task_id": task_id,
                                "content": section_md
                            }
                        }
                        yield {
                            "type": "workflow",
                            "data": {
                                "node": "worker",
                                "status": "completed",
                                "task_id": task_id
                            }
                        }
                elif node_name == "reducer":
                    yield {
                        "type": "workflow",
                        "data": {
                            "node": "reducer",
                            "status": "in-progress"
                        }
                    }
                    final_md = node_output.get("final", "")
                    image_specs = node_output.get("image_specs", [])
                    
                    if image_specs:
                        yield {
                            "type": "images",
                            "data": {
                                "images": [spec.get("filename") for spec in image_specs]
                            }
                        }
                    
                    yield {
                        "type": "workflow",
                        "data": {
                            "node": "reducer",
                            "status": "completed"
                        }
                    }
                    
                    print(f"[COMPLETE] Blog generated, markdown length: {len(final_md)} chars")
                    print(f"[COMPLETE] Images: {[spec.get('filename') for spec in image_specs]}")
                    
                    yield {
                        "type": "complete",
                        "data": {
                            "markdown": final_md,
                            "images": [spec.get("filename") for spec in image_specs],
                            "message": "Blog generation completed successfully!"
                        }
                    }
    
    # Node implementations
    def _router_node(self, state: State) -> dict:
        ROUTER_SYSTEM = """You are a routing module for a technical blog planner.
Decide whether web research is needed BEFORE planning.
Modes:
- closed_book (needs_research=false): Evergreen topics where correctness does not depend on recent facts.
- hybrid (needs_research=true): Mostly evergreen but needs up-to-date examples/tools/models.
- open_book (needs_research=true): Mostly volatile: weekly roundups, "this week", "latest", rankings.
If needs_research=true: Output 3–10 high-signal queries."""
        
        topic = state["topic"]
        decider = self.llm.with_structured_output(RouterDecision)
        decision = decider.invoke([
            SystemMessage(content=ROUTER_SYSTEM),
            HumanMessage(content=f"Topic: {topic}"),
        ])
        
        return {
            "needs_research": decision.needs_research,
            "mode": decision.mode,
            "queries": decision.queries,
        }
    
    def _route_next(self, state: State) -> str:
        return "research" if state["needs_research"] else "orchestrator"
    
    def _research_node(self, state: State) -> dict:
        queries = state.get("queries", []) or []
        max_results = 6
        raw_results: List[dict] = []
        
        for q in queries[:10]:
            try:
                tool = TavilySearchResults(max_results=max_results)
                results = tool.invoke({"query": q})
                for r in results or []:
                    raw_results.append({
                        "title": r.get("title") or "",
                        "url": r.get("url") or "",
                        "snippet": r.get("content") or r.get("snippet") or "",
                        "published_at": r.get("published_date") or r.get("published_at"),
                        "source": r.get("source"),
                    })
            except Exception:
                continue
        
        if not raw_results:
            return {"evidence": []}
        
        RESEARCH_SYSTEM = """You are a research synthesizer. Produce a deduplicated list of EvidenceItem objects from web search results."""
        extractor = self.llm.with_structured_output(EvidencePack)
        pack = extractor.invoke([
            SystemMessage(content=RESEARCH_SYSTEM),
            HumanMessage(content=f"Raw results:\n{raw_results}"),
        ])
        
        dedup = {}
        for e in pack.evidence:
            if e.url:
                dedup[e.url] = e
        
        return {"evidence": list(dedup.values())}
    
    def _orchestrator_node(self, state: State) -> dict:
        ORCH_SYSTEM = """You are a senior technical writer. Produce a highly actionable outline for a technical blog post.
Requirements:
- Create 5–9 sections (tasks)
- Each task: goal (1 sentence), 3–6 bullets, target word count (120–550)
- Include code examples, edge cases, performance considerations
Output must match Plan schema."""
        
        evidence = state.get("evidence", [])
        mode = state.get("mode", "closed_book")
        
        planner = self.llm.with_structured_output(Plan)
        plan = planner.invoke([
            SystemMessage(content=ORCH_SYSTEM),
            HumanMessage(content=f"Topic: {state['topic']}\nMode: {mode}\n\nEvidence:\n{[e.model_dump() for e in evidence][:16]}"),
        ])
        
        return {"plan": plan}
    
    def _fanout(self, state: State):
        return [
            Send("worker", {
                "task": task.model_dump(),
                "topic": state["topic"],
                "mode": state["mode"],
                "plan": state["plan"].model_dump(),
                "evidence": [e.model_dump() for e in state.get("evidence", [])],
            })
            for task in state["plan"].tasks
        ]
    
    def _worker_node(self, payload: dict) -> dict:
        WORKER_SYSTEM = """You are a senior technical writer. Write ONE section of a technical blog in Markdown.
- Follow Goal and cover ALL Bullets
- Stay close to Target words
- Output ONLY section content (start with ## heading)
- Include code if requires_code=true
- Cite Evidence URLs as [Source](URL)"""
        
        task = Task(**payload["task"])
        plan = Plan(**payload["plan"])
        evidence = [EvidenceItem(**e) for e in payload.get("evidence", [])]
        
        bullets_text = "\n- " + "\n- ".join(task.bullets)
        evidence_text = "\n".join(f"- {e.title} | {e.url}" for e in evidence[:20])
        
        section_md = self.llm.invoke([
            SystemMessage(content=WORKER_SYSTEM),
            HumanMessage(content=f"Blog: {plan.blog_title}\nSection: {task.title}\nGoal: {task.goal}\n"
                                f"Bullets:{bullets_text}\n\nEvidence:\n{evidence_text}"),
        ]).content.strip()
        
        return {"sections": [(task.id, section_md)]}
    
    def _reducer_node(self, state: State) -> dict:
        # Merge sections
        plan = state["plan"]
        ordered_sections = [md for _, md in sorted(state["sections"], key=lambda x: x[0])]
        body = "\n\n".join(ordered_sections).strip()
        merged_md = f"# {plan.blog_title}\n\n{body}\n"
        
        # Check if image generation should be attempted
        enable_images = os.environ.get("ENABLE_IMAGE_GENERATION", "false").lower() == "true"
        
        if not enable_images:
            # Skip image generation
            return {"final": merged_md, "merged_md": merged_md, "md_with_placeholders": merged_md, "image_specs": []}
        
        # Image generation (simplified - decide only, actual generation in separate step)
        DECIDE_IMAGES_SYSTEM = """You are an expert technical editor.
Decide if images/diagrams are needed for THIS blog.

Rules:
- Max 3 images total.
- Each image must materially improve understanding (diagram/flow/table-like visual).
- Insert placeholders exactly: [[IMAGE_1]], [[IMAGE_2]], [[IMAGE_3]].
- If no images needed: md_with_placeholders must equal input and images=[].
- Avoid decorative images; prefer technical diagrams with short labels.
Return strictly GlobalImagePlan.
"""
        
        planner = self.llm.with_structured_output(GlobalImagePlan)
        try:
            print(f"[IMAGE DECISION] Checking if images needed for: {state['topic']}")
            image_plan = planner.invoke([
                SystemMessage(content=DECIDE_IMAGES_SYSTEM),
                HumanMessage(content=(
                    f"Blog kind: {plan.blog_kind}\n"
                    f"Topic: {state['topic']}\n\n"
                    "Insert placeholders + propose image prompts.\n\n"
                    f"{merged_md}"
                )),
            ])
            
            print(f"[IMAGE DECISION] LLM decided: {len(image_plan.images)} images")
            for img in image_plan.images:
                print(f"  - {img.filename}: {img.caption[:60]}...")
            
            # Generate images
            final_md = self._generate_images(image_plan)
            
            return {
                "final": final_md,
                "merged_md": merged_md,
                "md_with_placeholders": image_plan.md_with_placeholders,
                "image_specs": [img.model_dump() for img in image_plan.images]
            }
        except Exception as e:
            # Fallback without images
            print(f"Image generation failed: {e}")
            return {"final": merged_md, "merged_md": merged_md, "md_with_placeholders": merged_md, "image_specs": []}
    
    def _generate_images(self, image_plan: GlobalImagePlan) -> str:
        """Generate images using Gemini"""
        md = image_plan.md_with_placeholders
        
        # Ensure images are stored in backend/images directory
        backend_dir = Path(__file__).parent
        images_dir = backend_dir / "images"
        images_dir.mkdir(exist_ok=True)
        
        print(f"[IMAGE] Images directory: {images_dir.absolute()}")
        print(f"[IMAGE] Generating {len(image_plan.images)} images")
        
        for spec in image_plan.images:
            placeholder = spec.placeholder
            filename = spec.filename
            out_path = images_dir / filename
            
            print(f"[IMAGE] Processing: {filename}")
            
            if not out_path.exists():
                try:
                    print(f"[IMAGE] Generating image: {filename}")
                    img_bytes = self._gemini_generate_image(spec.prompt)
                    out_path.write_bytes(img_bytes)
                    print(f"[IMAGE] Saved: {out_path.absolute()}")
                except Exception as e:
                    # Gracefully handle quota/API errors
                    error_msg = str(e)
                    if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                        prompt_block = (
                            f"> **[IMAGE GENERATION SKIPPED - API Quota Exceeded]**\n"
                            f">\n"
                            f"> **Caption:** {spec.caption}\n"
                            f">\n"
                            f"> **Alt Text:** {spec.alt}\n"
                            f">\n"
                            f"> To enable image generation, ensure your Google AI API has sufficient quota.\n"
                        )
                    else:
                        prompt_block = (
                            f"> **[IMAGE GENERATION FAILED]**\n"
                            f">\n"
                            f"> **Caption:** {spec.caption}\n"
                            f">\n"
                            f"> **Alt Text:** {spec.alt}\n"
                            f">\n"
                            f"> **Error:** {error_msg[:200]}\n"
                        )
                    md = md.replace(placeholder, prompt_block)
                    continue
            else:
                print(f"[IMAGE] Image already exists: {filename}")
            
            img_md = f"![{spec.alt}](images/{filename})\n*{spec.caption}*"
            md = md.replace(placeholder, img_md)
            print(f"[IMAGE] Inserted image reference: {filename}")
        
        return md
    
    def _gemini_generate_image(self, prompt: str) -> bytes:
        """Generate image using Gemini with response_modalities approach"""
        from google import genai
        from google.genai import types
        
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY is not set.")
        
        client = genai.Client(api_key=api_key)
        
        resp = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                safety_settings=[
                    types.SafetySetting(
                        category="HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold="BLOCK_ONLY_HIGH",
                    )
                ],
            ),
        )
        
        # Depending on SDK version, parts may hang off resp.candidates[0].content.parts
        parts = getattr(resp, "parts", None)
        if not parts and getattr(resp, "candidates", None):
            try:
                parts = resp.candidates[0].content.parts
            except Exception:
                parts = None
        
        if not parts:
            raise RuntimeError("No image content returned (safety/quota/SDK change).")
        
        for part in parts:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                return inline.data
        
        raise RuntimeError("No inline image bytes found in response.")
