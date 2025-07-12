const fs = require('fs/promises');
const { Octokit } = require('@octokit/rest');

async function extractGitHubData() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN is not set.');
    }

    const octokit = new Octokit({ auth: token });

    const repoContext = process.env.GITHUB_REPOSITORY; // e.g., 'owner/repo'
    if (!repoContext) {
      throw new Error('GITHUB_REPOSITORY environment variable is not set.');
    }
    const [owner, repo] = repoContext.split('/');

    console.log(`Fetching data for repository: ${owner}/${repo}`);

    // 1. Get repository details
    const { data: repoDetails } = await octokit.repos.get({
      owner,
      repo,
    });
    console.log('Fetched repository details.');

    // 2. Get README content
    let readmeContent = null;
    try {
      const { data: readme } = await octokit.repos.getReadme({
        owner,
        repo,
      });
      readmeContent = Buffer.from(readme.content, 'base64').toString('utf-8');
      console.log('Fetched README content.');
    } catch (error) {
      if (error.status === 404) {
        console.log('No README found for this repository.');
      } else {
        throw error; // Re-throw other errors
      }
    }

    // 3. Get package.json content
    let packageJsonContent = null;
    try {
      const { data: packageJson } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'package.json',
      });
      if (packageJson.type === 'file') {
        packageJsonContent = JSON.parse(Buffer.from(packageJson.content, 'base64').toString('utf-8'));
        console.log('Fetched package.json content.');
      } else {
        console.log('package.json is not a file.');
      }
    } catch (error) {
      if (error.status === 404) {
        console.log('No package.json found at the root of this repository.');
      } else {
        // It might be a private repo and GITHUB_TOKEN doesn't have contents:read
        console.warn(`Could not fetch package.json: ${error.message}. This might be due to permissions.`);
      }
    }

    // 4. Get last commit details (for the default branch)
    // The default branch is usually 'main' or 'master'. GITHUB_REF_NAME might give the branch name for push events.
    // For simplicity, using repoDetails.default_branch
    const defaultBranch = repoDetails.default_branch;
    let lastCommitMessage = null;
    let lastCommitHash = null;
    let lastCommitDate = null;

    if (defaultBranch) {
        try {
            const { data: commitData } = await octokit.repos.listCommits({
                owner,
                repo,
                sha: defaultBranch, // Get commits from the default branch
                per_page: 1,       // We only need the latest one
            });

            if (commitData && commitData.length > 0) {
                lastCommitMessage = commitData[0].commit.message;
                lastCommitHash = commitData[0].sha;
                lastCommitDate = commitData[0].commit.committer.date; // or author.date
                console.log(`Fetched last commit details for branch ${defaultBranch}.`);
            } else {
                console.log(`No commits found on branch ${defaultBranch}.`);
            }
        } catch (error) {
            console.warn(`Could not fetch commit data for branch ${defaultBranch}: ${error.message}`);
        }
    } else {
        console.warn('Could not determine the default branch to fetch commit data.');
    }


    const extractedData = {
      repo_name: repoDetails.full_name,
      description: repoDetails.description,
      readme_content: readmeContent,
      package_json_content: packageJsonContent,
      last_commit_message: lastCommitMessage,
      last_commit_hash: lastCommitHash,
      topics: repoDetails.topics || [],
      homepage_url: repoDetails.homepage,
      updated_at_repo: repoDetails.pushed_at, // 'pushed_at' is often more relevant than 'updated_at' for "last code update"
    };

    // Output data to a file for the next step in the GitHub Action
    const outputFilePath = process.env.GITHUB_OUTPUT_DATA_PATH || './github_data.json';
    await fs.writeFile(outputFilePath, JSON.stringify(extractedData, null, 2));
    console.log(`Extracted data written to ${outputFilePath}`);

    // Also set it as an output for the GitHub Actions step, if needed later directly
    // This requires GITHUB_OUTPUT environment file to be set
    if (process.env.GITHUB_OUTPUT) {
        await fs.appendFile(process.env.GITHUB_OUTPUT, `extracted_data_path=${outputFilePath}\n`);
    }

  } catch (error) {
    console.error('Error extracting GitHub data:', error.message);
    if (error.stack) {
        console.error(error.stack);
    }
    // Propagate the error so the GitHub Action fails
    // Setting a specific exit code might be useful for action steps
    process.exitCode = 1;
  }
}

extractGitHubData();
