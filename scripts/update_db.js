const fs = require('fs/promises');
const { Client } = require('pg');

async function updateDatabase() {
  const dataFilePath = process.env.EXTRACTED_DATA_PATH || './github_data.json';
  let extractedData;

  try {
    console.log(`Reading extracted data from: ${dataFilePath}`);
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    extractedData = JSON.parse(fileContent);
    console.log('Successfully parsed extracted data.');
  } catch (error) {
    console.error(`Error reading or parsing data file ${dataFilePath}:`, error);
    process.exitCode = 1;
    return;
  }

  const {
    repo_name,
    description,
    readme_content,
    package_json_content,
    last_commit_message,
    last_commit_hash,
    topics,
    homepage_url,
    updated_at_repo,
  } = extractedData;

  // Validate essential data
  if (!repo_name) {
    console.error('repo_name is missing from extracted data. Cannot update database.');
    process.exitCode = 1;
    return;
  }

  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    // Consider adding SSL configuration if your Neon DB requires it
    // ssl: {
    //   rejectUnauthorized: process.env.NODE_ENV === 'production', // Or true, depending on your cert setup
    // },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    const query = `
      INSERT INTO projects (
        repo_name, description, readme_content, package_json_content,
        last_commit_message, last_commit_hash, topics, homepage_url,
        updated_at_repo, last_fetched_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (repo_name) DO UPDATE SET
        description = EXCLUDED.description,
        readme_content = EXCLUDED.readme_content,
        package_json_content = EXCLUDED.package_json_content,
        last_commit_message = EXCLUDED.last_commit_message,
        last_commit_hash = EXCLUDED.last_commit_hash,
        topics = EXCLUDED.topics,
        homepage_url = EXCLUDED.homepage_url,
        updated_at_repo = EXCLUDED.updated_at_repo,
        last_fetched_at = NOW();
    `;

    const values = [
      repo_name,
      description,
      readme_content,
      package_json_content ? JSON.stringify(package_json_content) : null, // Ensure package_json_content is stringified if it's an object
      last_commit_message,
      last_commit_hash,
      topics, // Assumes topics is already an array of strings
      homepage_url,
      updated_at_repo ? new Date(updated_at_repo) : null, // Ensure it's a valid timestamp
    ];

    await client.query(query, values);
    console.log(`Database updated successfully for repository: ${repo_name}`);

  } catch (err) {
    console.error('Error updating database:', err.message);
    if(err.stack) {
        console.error(err.stack);
    }
    process.exitCode = 1;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

updateDatabase();
