import { runrunitFetch, type RunrunitProject } from "../client.js";

// ─── Tool definitions ─────────────────────────────────────────────────────────

export const projectToolDefinitions = [
  {
    name: "list_projects",
    description: "List available projects in Runrun.it with progress and time metrics",
    inputSchema: {
      type: "object",
      properties: {
        is_closed: {
          type: "boolean",
          description: "Filter by open (false) or closed (true) projects",
        },
        limit: {
          type: "number",
          description: "Number of projects to return",
        },
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
        },
      },
    },
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function simplifyProject(project: RunrunitProject) {
  const totalTasks = project.total_tasks ?? 0;
  const closedTasks = project.total_closed_tasks ?? 0;
  const progress = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;
  const timeWorkedH = project.time_worked !== undefined
    ? `${(project.time_worked / 3600).toFixed(1)}h`
    : undefined;
  const estimatedH = project.estimated_time !== undefined
    ? `${(project.estimated_time / 3600).toFixed(1)}h`
    : undefined;

  return {
    id: project.id,
    name: project.name,
    client_name: project.client_name ?? "Sem cliente",
    is_closed: project.is_closed ?? false,
    total_tasks: totalTasks,
    closed_tasks: closedTasks,
    progress_pct: `${progress}%`,
    time_worked: timeWorkedH,
    estimated_time: estimatedH,
    desired_date: project.desired_date ?? null,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

type ToolArgs = Record<string, unknown> | undefined;

export async function handleProjectTool(name: string, args: ToolArgs) {
  switch (name) {
    case "list_projects": {
      const params = new URLSearchParams();
      if (args) {
        Object.entries(args).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
      }
      const projects =
        (await runrunitFetch(`/projects?${params.toString()}`)) ?? [];
      const projectList = Array.isArray(projects)
        ? (projects as RunrunitProject[])
        : [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(projectList.map(simplifyProject), null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown project tool: ${name}`);
  }
}
