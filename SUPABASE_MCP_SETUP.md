# Supabase MCP Setup Guide for Claude Code

This guide provides step-by-step instructions for connecting Supabase MCP (Model Context Protocol) to Claude Code, enabling you to manage your Supabase project directly through Claude.

## Prerequisites

Before starting, ensure you have:

-   **Node.js** (v18 or newer) installed - verify with `node --version`
-   **Claude Code** CLI installed and working
-   A **Supabase project** with database access
-   Your Supabase project credentials

## Step 1: Create a Supabase Access Token

1. Navigate to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your profile picture (top right) → **Account Settings**
3. Go to **Access Tokens** section
4. Click **Generate New Token**
5. Name it descriptively (e.g., "Claude Code MCP")
6. **Copy the token immediately** - you won't see it again!

## Step 2: Get Your Project Reference ID

1. In your Supabase Dashboard, select your project
2. Go to **Project Settings** (gear icon in sidebar)
3. Find and copy your **Reference ID** (format: `xxxxxxxxxxxxxxxxxxxx`)

## Step 3: Configure Claude Code with Supabase MCP

### Option A: Project Configuration (Recommended)

Create a `.mcp.json` file in your project root:

```json
{
    "mcpServers": {
        "supabase": {
            "command": "npx",
            "args": [
                "-y",
                "@supabase/mcp-server-supabase@latest",
                "--read-only",
                "--project-ref=YOUR_PROJECT_REF_HERE"
            ],
            "env": {
                "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN_HERE"
            }
        }
    }
}
```

Replace:

-   `YOUR_PROJECT_REF_HERE` with your actual project reference ID
-   `YOUR_ACCESS_TOKEN_HERE` with your access token from Step 1

### Option B: Command Line Setup

Run this command in your terminal (from your project directory):

```bash
claude mcp add supabase -s local -e SUPABASE_ACCESS_TOKEN=sbp_9c7893e98952eeca72339b109820be9fdd574388 -- npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=astifupgjqyddksmazrr
```

## Step 4: Configure Features (Optional)

You can enable specific tool groups by modifying the `--features` flag:

```json
{
    "mcpServers": {
        "supabase": {
            "command": "npx",
            "args": [
                "-y",
                "@supabase/mcp-server-supabase@latest",
                "--read-only",
                "--project-ref=YOUR_PROJECT_REF_HERE",
                "--features=database,docs,storage"
            ],
            "env": {
                "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN_HERE"
            }
        }
    }
}
```

Available feature groups:

-   `account` - Account management
-   `docs` - Documentation access
-   `database` - Database operations
-   `debugging` - Debugging tools
-   `development` - Development utilities
-   `functions` - Edge Functions management
-   `storage` - Storage bucket operations
-   `branching` - Branch management

## Step 5: Restart Claude Code

After configuration:

1. Close Claude Code completely
2. Reopen Claude Code
3. The MCP server should connect automatically

## Step 6: Verify Connection

Test the connection by asking Claude:

-   "Show me my Supabase tables"
-   "List the columns in the users table"
-   "What Supabase features are available?"

You should see Claude using MCP tools prefixed with `mcp__supabase__`

## Security Best Practices

### 1. Use Read-Only Mode

Always include the `--read-only` flag unless you specifically need write access:

```json
"args": ["--read-only", "--project-ref=..."]
```

### 2. Use Development Projects Only

**Never connect MCP to production databases!** Create a separate development project for MCP usage.

### 3. Store Credentials Securely

Instead of hardcoding tokens in `.mcp.json`, use environment variables:

Create a `.env` file:

```env
SUPABASE_ACCESS_TOKEN=your_token_here
SUPABASE_PROJECT_REF=your_project_ref_here
```

Then reference in `.mcp.json`:

```json
{
    "mcpServers": {
        "supabase": {
            "command": "npx",
            "args": [
                "-y",
                "@supabase/mcp-server-supabase@latest",
                "--read-only",
                "--project-ref=${SUPABASE_PROJECT_REF}"
            ],
            "env": {
                "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
            }
        }
    }
}
```

### 4. Add to .gitignore

Ensure sensitive files are not committed:

```gitignore
.mcp.json
.env
```

## Available Commands

Once connected, you can ask Claude to:

### Database Operations

-   Create/modify tables and schemas
-   Run SQL queries
-   Generate and apply migrations
-   Manage indexes and constraints
-   View table structures and relationships

### Project Management

-   Configure authentication settings
-   Manage API keys and secrets
-   Set up Row Level Security (RLS) policies
-   Configure realtime subscriptions

### Storage Operations

-   Create and manage storage buckets
-   Upload/download files
-   Set storage policies

### Edge Functions

-   Create and deploy Edge Functions
-   Manage function secrets
-   View function logs

## Troubleshooting

### MCP Server Not Connecting

1. Verify Node.js version: `node --version` (must be v18+)
2. Check token validity in Supabase dashboard
3. Ensure project reference ID is correct
4. Try clearing npm cache: `npm cache clean --force`

### Permission Errors

-   Verify your access token has necessary permissions
-   Check if you're using the correct project reference
-   Ensure you're not trying write operations in read-only mode

### Tools Not Available

-   Check if required features are enabled in configuration
-   Verify MCP server version is up to date
-   Restart Claude Code after configuration changes

### Connection Timeouts

-   Check internet connectivity
-   Verify Supabase project is active (not paused)
-   Try using a different region if available

## Example Usage

After setup, you can interact naturally:

```
You: "Create a new table called 'products' with id, name, price, and created_at columns"

Claude: I'll create the products table for you using Supabase MCP...
[Uses mcp__supabase__execute_sql tool]

You: "Add a row level security policy so users can only see their own products"

Claude: I'll create an RLS policy for the products table...
[Uses mcp__supabase__create_rls_policy tool]
```

## Important Notes

-   **Version**: The Supabase MCP server is pre-1.0, expect potential breaking changes
-   **Manual Approval**: Always review tool calls before execution
-   **Rate Limits**: Be aware of Supabase API rate limits
-   **Costs**: Some operations may affect your Supabase usage/billing

## Additional Resources

-   [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
-   [Claude Code MCP Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
-   [Supabase MCP GitHub Repository](https://github.com/supabase-community/supabase-mcp)

## Support

For issues:

-   Supabase MCP: File issues at [GitHub](https://github.com/supabase-community/supabase-mcp/issues)
-   Claude Code: Report at [Claude Code Issues](https://github.com/anthropics/claude-code/issues)
-   Supabase: Contact through [Supabase Support](https://supabase.com/support)
