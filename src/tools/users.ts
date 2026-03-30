import { runrunitFetch, type RunrunitUser, type RunrunitTeam } from "../client.js";

// ─── Tool definitions ─────────────────────────────────────────────────────────

export const userToolDefinitions = [
  {
    name: "get_me",
    description: "Get information about the current authenticated user",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_users",
    description: "List users in the organization, optionally filtered by team",
    inputSchema: {
      type: "object",
      properties: {
        team_id: {
          type: "number",
          description: "Filter users by team ID",
        },
        limit: {
          type: "number",
          description: "Number of users to return",
        },
      },
    },
  },
  {
    name: "list_teams",
    description: "List all teams in the organization, including their members and board",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function simplifyUser(user: RunrunitUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    position: user.position,
    is_manager: user.is_manager,
    team_ids: user.team_ids,
    on_vacation: user.on_vacation,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

type ToolArgs = Record<string, unknown> | undefined;

export async function handleUserTool(name: string, args: ToolArgs) {
  switch (name) {
    case "get_me": {
      const user = (await runrunitFetch("/users/me")) as RunrunitUser;
      return {
        content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
      };
    }

    case "list_users": {
      const params = new URLSearchParams();
      if (args) {
        Object.entries(args).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
      }
      const users = (await runrunitFetch(`/users?${params.toString()}`)) ?? [];
      const userList = Array.isArray(users) ? (users as RunrunitUser[]) : [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(userList.map(simplifyUser), null, 2),
          },
        ],
      };
    }

    case "list_teams": {
      const teams = (await runrunitFetch("/teams")) ?? [];
      const teamList = Array.isArray(teams) ? (teams as RunrunitTeam[]) : [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              teamList.map((t) => ({
                id: t.id,
                name: t.name,
                leader_id: t.leader_id,
                board_id: t.board_id,
                member_ids: t.user_ids ?? [],
              })),
              null,
              2,
            ),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown user tool: ${name}`);
  }
}
