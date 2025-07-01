## Environment Variables

To run this project, you need to configure several environment variables. Create a `.env` file in the root directory of the project and populate it with the following:

*   **`GOOGLE_API_KEY`**:
    *   **Purpose**: Used for generating text embeddings via Google's Generative AI models and for powering the Gemini chat model.
    *   **Obtain from**: [Google AI Studio](https://aistudio.google.com/app/apikey).

*   **`GITHUB_ACCESS_TOKEN`**:
    *   **Purpose**: A GitHub Personal Access Token (PAT). This is necessary for the data sync service to fetch your repository data and README files from GitHub.
    *   **Obtain from**: GitHub Developer Settings ([Personal access tokens](https://github.com/settings/tokens)).
    *   **Permissions**: If accessing private repositories, the token needs the `repo` scope. For public repositories only, the `public_repo` scope is sufficient.

*   **`GITHUB_USERNAME`**:
    *   **Purpose**: The GitHub username whose repositories and profile information will be fetched and indexed by the data sync service.
    *   **Value**: Your GitHub username.

*   **`ASTRA_DB_API_ENDPOINT`**:
    *   **Purpose**: The unique API endpoint URL for your DataStax AstraDB database.
    *   **Obtain from**: Your AstraDB dashboard, typically found in the connection details for your database. Example format: `https://<database-id>-<region>.apps.astra.datastax.com`.

*   **`ASTRA_DB_APPLICATION_TOKEN`**:
    *   **Purpose**: An Application Token for authenticating with your AstraDB database. This token should have appropriate permissions to read, write, and delete data in the specified collection.
    *   **Obtain from**: Your AstraDB dashboard, under "Organization Settings" > "Token Management" or database-specific connection details. It usually starts with `AstraCS:...`.

*   **`ASTRA_DB_COLLECTION`**:
    *   **Purpose**: The name of the collection within your AstraDB database where the processed text chunks and their embeddings will be stored and queried.
    *   **Value**: e.g., `portfolio_chatbot_embeddings` or any name you've configured. (Note: The application code might have a default or expect a specific name if not explicitly configured in `astradb.js` to use this variable directly for collection selection. Ensure consistency.)

*   **`UPSTASH_REDIS_REST_URL`**:
    *   **Purpose**: The REST URL for your Upstash Redis database. This is used by LangChain to cache chat model responses, improving performance and reducing redundant API calls.
    *   **Obtain from**: Your Upstash Redis database console, under "Details".

*   **`UPSTASH_REDIS_REST_TOKEN`**:
    *   **Purpose**: The REST token (password) for your Upstash Redis database, providing authentication for the cache.
    *   **Obtain from**: Your Upstash Redis database console, under "Details".

*   **`GEMINI_MODEL_NAME`**:
    *   **Purpose**: Specifies the primary Gemini model to be used for chat interactions.
    *   **Example**: `gemini-1.5-flash` (default used in the application)
    *   **Note**: Ensure this model is available for your `GOOGLE_API_KEY`.

*   **`HISTORY_MODEL_NAME`**:
    *   **Purpose**: Specifies the Gemini model used for rephrasing history-aware search queries.
    *   **Example**: `gemini-1.0-pro-latest` (or the default `gemini-2.0-flash-lite` used in the application)

**Important Security Note:**
Always ensure your `.env` file is included in your project's `.gitignore` file to prevent accidental commitment of sensitive credentials to version control.

Example `.env` structure:
```
GOOGLE_API_KEY="AIz..."
GITHUB_ACCESS_TOKEN="ghp_..."
GITHUB_USERNAME="yourusername"
ASTRA_DB_API_ENDPOINT="https://<dbid>-<region>.apps.astra.datastax.com"
ASTRA_DB_APPLICATION_TOKEN="AstraCS:..."
ASTRA_DB_COLLECTION="portfolio_chatbot_embeddings"
UPSTASH_REDIS_REST_URL="https://<region>-<instanceName>-<uniqueId>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AYx..."
GEMINI_MODEL_NAME="gemini-1.5-flash"
HISTORY_MODEL_NAME="gemini-1.0-pro-latest"
```
