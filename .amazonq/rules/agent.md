"**Agent Role:** You are a dedicated software development assistant. Your goal is to streamline the creation of a digital product by leveraging AI, following a structured, step-by-step process.

**Task Objective:** Implement a system or script that guides a user through the creation of a digital product based on their expertise, using AI assistance. The process should be broken down into distinct, interactive phases, mimicking the workflow described in the provided context. The system should gather user input at each stage and utilize AI (e.g., through API calls to a large language model) to process information and generate content.

**Implementation Steps (Step-by-step Process to Automate):**

1. **Phase 1: AI Instruction & Context Setting**

   - **Action:** Begin by "teaching" the AI (your underlying LLM) about the process of creating a digital product.
   - **Input:** The system should receive a comprehensive document or set of instructions detailing the steps, best practices, and structure for building a digital product based on user expertise. This initial input serves as the AI's foundational knowledge.
   - **Output:** Confirm that the AI has processed and understood the instructional context.

2. **Phase 2: User Interview & Data Collection**

   - **Action:** Design an interactive interview process to collect crucial information from the user.
   - Prompts to User (System should ask sequentially):
     - "What type of digital product are you creating (e.g., e-book, course, lead magnet, guide)?"
     - "Who is your target audience for this product (e.g., demographics, interests, current knowledge level)?"
     - "Please provide sources of inspiration for your product. This can include links to books, PDFs, YouTube videos, articles, or personal notes. (Allow for multiple inputs)"
     - "What are the main pain points or undesired outcomes your target audience currently experiences that your product aims to solve?"
     - "What obstacles or risks does your target audience typically face when trying to solve these problems on their own?"
     - "What are your key insights or unique approaches for overcoming these specific problems?"
     - "Do you have a unique system, framework, or methodology for achieving results that you want to share in this product?"
   - **Data Handling:** Store all user responses systematically.

3. **Phase 3: Outline Generation**

   - **Action:** Based on the collected user data and the initial AI instructions, generate a structured outline for the digital product.
   - **AI Prompting Strategy:** Instruct the AI to use a robust content framework (e.g., APAG: Attention, Perspective, Advantage, Gamify, or AIDA/PAS if preferred, adapt as needed) to structure the outline.
   - Outline Components (AI should generate these sections):
     - **Introduction:** A compelling section that captures attention and clearly states the desired transformation or benefit the product offers.
     - **Perspective and Advantage:** A section that first illustrates common problems/misconceptions the audience faces, then introduces the user's unique solution or "better way."
     - **Step-by-Step Actionable Guidance:** Subsequent sections that break down the user's methodology into clear, actionable steps, leading to the desired outcome.
   - **User Interaction:** Present the generated outline to the user for review and allow for modifications/approvals before proceeding.

4. **Phase 4: Section-by-Section Content Writing**

   - **Action:** Systematically generate the content for each section of the digital product, one section at a time.

   - Iterative Process:

      For each major section of the approved outline:

     - **AI Prompt:** Prompt the AI to write the content for the current section, leveraging all previously gathered user input (type of product, audience, pain points, solutions, unique methodology, inspiration sources) and the overall instructional context.
     - **Style Reference (Optional):** Allow the user to provide a writing style reference (e.g., "Write in a conversational yet authoritative tone," or "Emulate the style of [author/source]").
     - **User Review & Edit:** Present the generated section to the user. Allow them to review, edit, and approve the content before moving to the next section.
     - **Revision Loop:** If the user requests revisions, re-prompt the AI with specific feedback until the section is approved.

   - **Final Output:** Compile all approved sections into a complete draft of the digital product.

**Technical Considerations & Requirements for the Agent:**

- **Modularity:** Design the system in modular components, allowing for easy integration with different AI APIs (e.g., OpenAI, Google Gemini, etc.) and future expansion.
- **User Interface/Interaction:** Assume a text-based or web-based interactive interface for user input and output display.
- **Data Persistence:** Implement mechanisms to store user inputs and generated content throughout the process, allowing for resuming sessions.
- **Error Handling:** Include robust error handling for API calls and user input.
- **Progress Tracking:** Provide clear indicators of the current phase and progress.
- **Scalability:** Consider how the system could scale to accommodate larger products or more complex user inputs.

**Goal for Software Dev:** The aim is to create a robust, user-friendly tool that significantly reduces the manual effort and time required for experts to translate their knowledge into well-structured, high-quality digital products, making the software development process of such a tool efficient and reusable."