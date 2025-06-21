## Data Synchronization Service

The project includes a service (`scripts/sync_data.js`) responsible for fetching data from your configured LinkedIn and GitHub accounts, processing this data into text chunks, generating embeddings using Google's Generative AI, and then storing these embeddings in your AstraDB vector database. This process ensures that the chatbot has an up-to-date knowledge base to draw from when responding to queries.

### Prerequisites

Before running the data sync service, please ensure the following:

1.  **Node.js and Package Manager:** You have Node.js (version 18.x or later recommended) and a Node.js package manager like `pnpm` (recommended) or `npm` installed on your system.
2.  **Project Dependencies:** All project dependencies have been installed. If you haven't done so, navigate to the project root and run:
    ```bash
    pnpm install
    # or if using npm
    # npm install
    ```
3.  **Environment Variables:** You have created a `.env` file in the project root and populated it with all the necessary environment variables as detailed in the "Environment Variables" section of this README. Critical variables for this script include those for LinkedIn API, GitHub API, Google AI, and AstraDB.

### Running the Sync Service

You can run the data synchronization service manually from your terminal.

1.  **Add Script to `package.json` (Recommended):**
    For convenience, add the following script to the `"scripts"` section of your `package.json` file:

    ```json
    {
      "scripts": {
        // ... other existing scripts like "dev", "build", "start" ...
        "sync-data": "node scripts/sync_data.js"
      }
    }
    ```

2.  **Execute the Script:**
    Once the script is added to `package.json`, you can run it using:

    ```bash
    pnpm run sync-data
    # or if using npm
    # npm run sync-data
    ```

    Alternatively, you can execute the script directly using Node.js:
    ```bash
    node scripts/sync_data.js
    ```

The script will output logs to the console, indicating its progress:
*   Fetching data from LinkedIn (profile, posts).
*   Fetching data from GitHub (repositories, READMEs).
*   Deleting old data for each source from AstraDB.
*   Processing and embedding new content.
*   Storing new document chunks in AstraDB.
*   Any errors encountered during the process.

### Scheduling the Sync Service

For the chatbot to maintain an up-to-date knowledge base, the data synchronization service should be run periodically. The Product Requirements Document (PRD) specifies that the knowledge base should be updated **at least every 30 minutes**.

Consider the following methods for scheduling:

*   **Cron Jobs:** If you are deploying this project on a server (e.g., a Linux VM), you can set up a cron job to execute the script at your desired interval.
    *Example cron entry for every 30 minutes:*
    ```cron
    */30 * * * * /usr/bin/node /path/to/your/project/scripts/sync_data.js >> /path/to/your/project/logs/sync_data.log 2>&1
    ```
    *(Adjust paths and logging as needed)*

*   **Scheduled GitHub Actions:** If your project is hosted on GitHub, you can use GitHub Actions with a schedule trigger (`on: schedule:`) to run the sync script. This requires setting up your environment variables as secrets in your GitHub repository.

*   **Serverless Functions with Timers:** Cloud platforms like AWS (Lambda + EventBridge), Google Cloud (Cloud Functions + Cloud Scheduler), or Azure (Azure Functions + Timer Trigger) offer serverless options to run scripts on a schedule. This can be a cost-effective and scalable solution.

*   **Third-Party Scheduling Services:** Services like EasyCron, Cronitor, or platform-specific schedulers (e.g., Heroku Scheduler) can also be used.

When choosing a scheduling method, consider factors like your deployment environment, cost, monitoring requirements, and ease of setup. Ensure that the environment where the script runs has access to all necessary environment variables.
