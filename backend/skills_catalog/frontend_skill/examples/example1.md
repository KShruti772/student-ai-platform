Example: Skill Activation Panel

- Call `POST /skills/detect` with user intent to get matching skills.
- Render the returned `mentor_explanation` to help the user understand why the skill was selected.
- Allow the user to `activate` the skill via `POST /skills/activate`.