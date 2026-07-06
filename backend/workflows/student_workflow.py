"""
Simple workflow orchestration that demonstrates multi-agent collaboration.

Purpose:
- Show how planner, mentor and explainer can be composed to answer student queries.

Design:
- This is intentionally synchronous and linear to be easy to follow.
"""
from agents.planner_agent import PlannerAgent
from agents.mentor_agent import MentorAgent
from agents.explainer_agent import ExplainerAgent
from memory.session_memory import SessionMemory


class StudentWorkflow:
    def __init__(self):
        self.planner = PlannerAgent()
        self.mentor = MentorAgent()
        self.explainer = ExplainerAgent()

    def run(self, user_message: str, session: SessionMemory = None) -> dict:
        """Run a simple pipeline:

        1) Planner creates a plan
        2) Mentor explains concepts
        3) Explainer justifies choices and gives debugging tips
        4) Return combined response
        """
        if session is None:
            session = SessionMemory()

        session.add_message("user", user_message)

        plan = self.planner.generate(user_message)
        session.add_message("assistant:planner", plan)

        mentor_reply = self.mentor.generate(plan)
        session.add_message("assistant:mentor", mentor_reply)

        explainer_reply = self.explainer.generate(plan)
        session.add_message("assistant:explainer", explainer_reply)

        combined = {
            "plan": plan,
            "mentor": mentor_reply,
            "explainer": explainer_reply,
        }
        return combined
