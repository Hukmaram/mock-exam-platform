import { PrismaClient, QuestionType, Difficulty, QuestionStatus, ExamStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CertPrep Platform database with official GH-600 41-Question Mock Exam...');

  // 0. Ensure ONLY GH-600 exists
  await prisma.certification.deleteMany({
    where: { slug: { not: 'gh-600' } },
  });

  // 1. Create Admin & Normal User
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  const userPasswordHash = await bcrypt.hash('User@123456', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mockexam.local' },
    update: { role: Role.ADMIN },
    create: {
      email: 'admin@mockexam.local',
      name: 'System Administrator',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@mockexam.local' },
    update: {},
    create: {
      email: 'user@mockexam.local',
      name: 'Alex Developer',
      passwordHash: userPasswordHash,
      role: Role.USER,
    },
  });

  // 2. Create Certification (GH-600)
  const cert = await prisma.certification.upsert({
    where: { slug: 'gh-600' },
    update: {
      name: 'GitHub Agentic AI Developer Certification (GH-600)',
      description:
        'Professional practice examination covering agent architecture & SDLC processes, MCP tool use, execution state, automated evaluation, multi-agent coordination, and guardrail accountability.',
      isPublished: true,
    },
    create: {
      name: 'GitHub Agentic AI Developer Certification (GH-600)',
      code: 'GH-600',
      slug: 'gh-600',
      description:
        'Professional practice examination covering agent architecture & SDLC processes, MCP tool use, execution state, automated evaluation, multi-agent coordination, and guardrail accountability.',
      isPublished: true,
    },
  });

  // 3. Create Official 6 Domains
  const domainData = [
    {
      code: 'DOM-1',
      name: 'Prepare agent architecture & SDLC processes',
      description: 'Agent planning artifacts, SDLC integration, risk-tiered autonomy, and success criteria.',
      weight: 17.0,
    },
    {
      code: 'DOM-2',
      name: 'Tool use & environment interaction',
      description: 'Model Context Protocol (MCP) servers, allow lists, GitHub Action triggers, minimum workflow permissions, and retry policies.',
      weight: 24.0,
    },
    {
      code: 'DOM-3',
      name: 'Memory, state, and execution',
      description: 'Repository-level instructions, context scoping, durable resumption artifacts, context drift, and shared canonical state.',
      weight: 12.0,
    },
    {
      code: 'DOM-4',
      name: 'Evaluation, error analysis, and tuning',
      description: 'Automated evaluation signals, benchmark gates, error root-cause taxonomy, and instruction tuning.',
      weight: 17.0,
    },
    {
      code: 'DOM-5',
      name: 'Multi-agent coordination',
      description: 'Supervisor patterns, branch isolation, conflict reconciliation, handoff audit trails, and shadow-mode rollouts.',
      weight: 17.0,
    },
    {
      code: 'DOM-6',
      name: 'Guardrails & accountability',
      description: 'Action authorization tiers, least-privilege workflow blocks, environment gates, and defense-in-depth for production changes.',
      weight: 13.0,
    },
  ];

  const domains: Record<string, string> = {};
  for (const d of domainData) {
    let existingDomain = await prisma.domain.findFirst({
      where: { certificationId: cert.id, code: d.code },
    });
    if (!existingDomain) {
      existingDomain = await prisma.domain.create({
        data: {
          certificationId: cert.id,
          name: d.name,
          code: d.code,
          description: d.description,
          weight: d.weight,
        },
      });
    } else {
      existingDomain = await prisma.domain.update({
        where: { id: existingDomain.id },
        data: {
          name: d.name,
          description: d.description,
          weight: d.weight,
        },
      });
    }
    domains[d.code] = existingDomain.id;
  }

  // 4. The 41 Official Mock Exam Questions
  const all41Questions = [
    // Domain 1 (Q1-Q7)
    {
      domainCode: 'DOM-1',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Your team is integrating a Copilot custom agent that produces draft refactors. Reviewers complain that they can't tell what the agent intended before code changes appear in a PR. Which configuration most directly addresses the complaint?",
      explanation: "Reviewers' complaint is about visibility before code. A structured plan artifact published before any change addresses that exactly. CODEOWNER counts (C) gate merge but don't show intent earlier; (A) is opposite of the issue; (D) discards capability.",
      options: [
        { key: 'A', text: "Increase the agent's autonomy level so it produces more diff context per PR.", isCorrect: false },
        { key: 'B', text: "Configure the agent to output a structured plan as a workflow artifact before any code changes are written.", isCorrect: true },
        { key: 'C', text: "Require two CODEOWNER approvals on every agent-authored PR.", isCorrect: false },
        { key: 'D', text: "Reduce the agent's tool list to read-only operations.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-1',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Which of the following is an anti-pattern when integrating an agent into the SDLC? (Select all that apply.)",
      explanation: "Acting without an inspectable plan is the canonical anti-pattern. (B) is fine (read-only is safe), (C) is acceptable when the human triggers it, (D) is good practice.",
      options: [
        { key: 'A', text: "The agent acts immediately without producing an inspectable plan.", isCorrect: true },
        { key: 'B', text: "The agent runs in a workflow with permissions: { contents: read }.", isCorrect: false },
        { key: 'C', text: "The agent's commit author is the human who triggered the workflow.", isCorrect: false },
        { key: 'D', text: "The agent operates on a feature branch protected by branch protection rules.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-1',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: 'You are designing a "research → propose → apply" agent flow. Which separation produces the most inspectable workflow?',
      explanation: "Separation of plan/approve/act/evaluate into discrete artifact-producing steps is the inspectability pattern. (A) groups logs but doesn't gate; (C) is identity gating only; (D) sequential jobs alone don't add approval gates.",
      options: [
        { key: 'A', text: "One job that does all three phases sequentially with grouped logs.", isCorrect: false },
        { key: 'B', text: "A planning job that uploads a plan artifact, a reviewer-approved workflow_dispatch to begin the action job, then an evaluation job.", isCorrect: true },
        { key: 'C', text: "A single job with if: github.actor == 'admin' gating the action step.", isCorrect: false },
        { key: 'D', text: "Three sequential jobs in the same workflow with needs: dependencies.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-1',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "A regulated team is concerned about agent autonomy. Which design preserves velocity while controlling risk?",
      explanation: "Risk-tiered autonomy is the published guidance. (A) is approval theater; (B)(D) reduce velocity without proportionate safety gain.",
      options: [
        { key: 'A', text: "Require human approval on every agent-authored PR regardless of change category.", isCorrect: false },
        { key: 'B', text: "Disable agent access during business hours.", isCorrect: false },
        { key: 'C', text: "Categorize actions by operational/security/compliance risk and require approval only for high-risk categories.", isCorrect: true },
        { key: 'D', text: "Run agents only in a dedicated repository disconnected from production.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-1',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.EASY,
      text: 'Which artifact is the most appropriate "inspectable artifact" for an agent\'s plan in a standard GitHub workflow?',
      explanation: "A workflow artifact referenced from the PR is the canonical inspectable artifact. (A) is ephemeral, (C) is off-platform, (D) isn't an artifact.",
      options: [
        { key: 'A', text: "A console log line in the workflow run.", isCorrect: false },
        { key: 'B', text: "An actions/upload-artifact-uploaded JSON or markdown plan document referenced from the PR description.", isCorrect: true },
        { key: 'C', text: "An entry in an external Notion database.", isCorrect: false },
        { key: 'D', text: "A comment in the agent's source code.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-1',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "You want to define success criteria for an agent task that performs a dependency upgrade. Which combination is most robust?",
      explanation: "Multiple objective criteria mirroring human-contributor judgment. (B) is self-reported, (C) measures speed not quality, (D) is subjective.",
      options: [
        { key: 'A', text: "Tests pass; no new code scanning alerts; PR template required fields completed.", isCorrect: true },
        { key: 'B', text: 'The agent reports "success" in its trace log.', isCorrect: false },
        { key: 'C', text: "The PR is opened within 5 minutes of triggering.", isCorrect: false },
        { key: 'D', text: "A human approves the PR description.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-1',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Your agent occasionally takes actions that contradict its earlier plan. What is the most direct architectural fix?",
      explanation: "Plan/action divergence is fixed by making the plan a hard contract, not by upgrading the model or memory.",
      options: [
        { key: 'A', text: "Increase the agent's memory window.", isCorrect: false },
        { key: 'B', text: "Require the agent to re-read and acknowledge its plan artifact at the start of the action phase, and abort if action steps diverge from the plan.", isCorrect: true },
        { key: 'C', text: "Switch to a more capable model.", isCorrect: false },
        { key: 'D', text: "Disable retries.", isCorrect: false },
      ],
    },

    // Domain 2 (Q8-Q17)
    {
      domainCode: 'DOM-2',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.EASY,
      text: "What does an MCP server primarily provide to a Copilot custom agent?",
      explanation: "MCP is the standardized tool-exposure protocol. (A) is wrong (memory is separate), (C) is wrong (MCP doesn't replace runners), (D) is wrong.",
      options: [
        { key: 'A', text: "A vector database for long-term memory.", isCorrect: false },
        { key: 'B', text: "A standardized protocol for exposing external tools, APIs, or data sources the agent can invoke.", isCorrect: true },
        { key: 'C', text: "A replacement for GitHub Actions runners.", isCorrect: false },
        { key: 'D', text: "A static prompt-template registry.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-2',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "You configured an MCP server but the agent will not invoke it in your organization. Other agents in the org work fine. Which check should you perform first?",
      explanation: "Allow-list misses are the most common cause when other agents work. Always check the allow list before deeper debugging.",
      options: [
        { key: 'A', text: "Confirm the server appears on the organization's MCP allow list.", isCorrect: true },
        { key: 'B', text: "Restart the runner.", isCorrect: false },
        { key: 'C', text: "Increase the workflow timeout.", isCorrect: false },
        { key: 'D', text: "Rotate the workflow's GITHUB_TOKEN.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-2',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "What is the purpose of the GitHub remote MCP server?",
      explanation: "The GitHub remote MCP server exposes GitHub's APIs as MCP tools.",
      options: [
        { key: 'A', text: "To replace local MCP servers with cloud-hosted ones for any vendor.", isCorrect: false },
        { key: 'B', text: "To expose GitHub's own APIs (issues, PRs, code search) to agents through MCP.", isCorrect: true },
        { key: 'C', text: "To proxy outbound network calls from the Copilot cloud agent firewall.", isCorrect: false },
        { key: 'D', text: "To synchronize state between multiple Copilot subscriptions.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-2',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.HARD,
      text: "Which of the following statements about MCP allow lists are true? (Select all that apply.)",
      explanation: "(A) is True (MCP allow lists restrict which servers agents can connect to). (B) is False (permissions live in agent/tool config, not allow lists). (C) is True (servers not on allow list are blocked even if configured). (D) is False (per-tool permissions are still required within an allowed server).",
      options: [
        { key: 'A', text: "MCP allow lists restrict which MCP servers an organization's agents may connect to.", isCorrect: true },
        { key: 'B', text: "MCP allow lists set permission levels (read/write) for each MCP tool.", isCorrect: false },
        { key: 'C', text: "Servers not on the allow list are blocked even if explicitly referenced in an agent's config.", isCorrect: true },
        { key: 'D', text: "MCP allow lists eliminate the need for per-tool permissions in the agent's manifest.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-2',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.EASY,
      text: "You want a Copilot custom agent to be invoked from a CI workflow when a PR is opened. Which is the most direct configuration?",
      explanation: "Standard GitHub Actions trigger pattern. (B) is custom plumbing, (C) doesn't run code, (D) is for dependency updates only.",
      options: [
        { key: 'A', text: "Trigger a GitHub Actions workflow on pull_request: [opened] with a step that runs the agent.", isCorrect: true },
        { key: 'B', text: "Configure a webhook in repository settings to call the agent's HTTP endpoint.", isCorrect: false },
        { key: 'C', text: "Add the agent to the repository's CODEOWNERS file.", isCorrect: false },
        { key: 'D', text: "Define the agent in .github/dependabot.yml.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-2',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Your agent must create branches and pull requests autonomously. Which minimum permissions: block in the workflow file is appropriate?",
      explanation: "Minimum needed to create branches and PRs. (A) is read-only, (C) is broader than needed, (D) is for managing workflows.",
      options: [
        { key: 'A', text: "permissions: { contents: read, pull-requests: read }", isCorrect: false },
        { key: 'B', text: "permissions: { contents: write, pull-requests: write }", isCorrect: true },
        { key: 'C', text: "permissions: write-all", isCorrect: false },
        { key: 'D', text: "permissions: { actions: write }", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-2',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "A team wants to allow the Copilot cloud agent to call exactly two external APIs and nothing else. Which control should they configure?",
      explanation: "The Copilot cloud agent firewall is the named control for egress allow-listing.",
      options: [
        { key: 'A', text: "CODEOWNERS for the agent's branch.", isCorrect: false },
        { key: 'B', text: "The Copilot cloud agent firewall, with an allow list of the two API hosts.", isCorrect: true },
        { key: 'C', text: "Repository secret scoping.", isCorrect: false },
        { key: 'D', text: "Branch protection rules on main.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-2',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "An agent's tool call to a flaky external service occasionally fails. Which retry strategy is most appropriate?",
      explanation: "Standard safe-retry pattern: bounded, backoff, idempotency, scoped to transient errors.",
      options: [
        { key: 'A', text: "Retry up to 10 times immediately on any error.", isCorrect: false },
        { key: 'B', text: "Bounded retries with exponential backoff, scoped to transient errors (network, rate-limit), with idempotency keys on the underlying operation.", isCorrect: true },
        { key: 'C', text: "Retry once, then escalate to a human regardless of error type.", isCorrect: false },
        { key: 'D', text: "Disable retries and let the workflow fail.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-2',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "You need to scope an agent so that it can only modify a single repository, not the entire organization. Which token approach is most aligned with least-privilege?",
      explanation: "GITHUB_TOKEN is the textbook least-privilege option for in-repo work. (A) over-scopes by user, (C) over-scopes by org, (D) is far too broad.",
      options: [
        { key: 'A', text: "A classic personal access token with repo scope from the team lead.", isCorrect: false },
        { key: 'B', text: "The workflow's GITHUB_TOKEN, which is automatically scoped to that repository.", isCorrect: true },
        { key: 'C', text: "A GitHub App installation token granted at the organization level on all repositories.", isCorrect: false },
        { key: 'D', text: "An OAuth token from a user with admin rights on all repos.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-2',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Which combination provides traceability and accountability for autonomous agent actions in a GitHub workflow?",
      explanation: "The three-pillar pattern: logs, attribution, and decisional comments.",
      options: [
        { key: 'A', text: "Workflow run logs + signed commits attributed to the bot identity + PR comments documenting key decisions.", isCorrect: true },
        { key: 'B', text: "A single end-of-run summary email to the team.", isCorrect: false },
        { key: 'C', text: "Disabling actions logs to reduce noise.", isCorrect: false },
        { key: 'D', text: "Storing the agent's reasoning in a private Slack channel.", isCorrect: false },
      ],
    },

    // Domain 3 (Q18-Q22)
    {
      domainCode: 'DOM-3',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.EASY,
      text: "Where do long-term, project-stable agent instructions belong?",
      explanation: "Repo-level instructions file is the canonical home for stable long-term agent guidance.",
      options: [
        { key: 'A', text: "Injected into the user prompt each invocation.", isCorrect: false },
        { key: 'B', text: "In .github/copilot-instructions.md (or AGENTS.md) in the repository.", isCorrect: true },
        { key: 'C', text: "In an environment secret.", isCorrect: false },
        { key: 'D', text: "Hard-coded into the agent's source binary.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-3',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "An agent is configured to load the entire repository's documentation into its working context every invocation. Performance is poor and answers are diluted. Which adjustment best applies?",
      explanation: "Scope memory to task-relevant — published Domain 3 bullet. Bigger windows and more retries don't fix dilution.",
      options: [
        { key: 'A', text: "Switch to a larger context window model.", isCorrect: false },
        { key: 'B', text: "Scope memory to task-relevant information only; load only the docs referenced by the current task.", isCorrect: true },
        { key: 'C', text: "Increase retries.", isCorrect: false },
        { key: 'D', text: "Disable memory entirely.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-3',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "An agent is mid-task when its workflow run is canceled. On the next invocation, you need it to resume without repeating completed steps. What pattern enables this?",
      explanation: "Durable progress artifact pattern is the published resumption mechanism.",
      options: [
        { key: 'A', text: "Increase the workflow timeout-minutes.", isCorrect: false },
        { key: 'B', text: "Persist task progress as a durable artifact (PR checklist, state file, or issue comments), and have the agent read it at the start of each run to skip completed steps.", isCorrect: true },
        { key: 'C', text: "Set concurrency: { group: agent-task, cancel-in-progress: false }.", isCorrect: false },
        { key: 'D', text: "Use a larger runner.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-3',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Which of the following describes context drift in an extended agent execution?",
      explanation: "Context drift specifically = action-state divergence; the others are unrelated performance/scale issues.",
      options: [
        { key: 'A', text: "The agent's responses become slower over time as memory grows.", isCorrect: false },
        { key: 'B', text: "The agent acts on cached or stale context that no longer matches the actual repo state.", isCorrect: true },
        { key: 'C', text: "The agent's prompt template becomes too long.", isCorrect: false },
        { key: 'D', text: "The workflow run consumes too much GitHub Actions quota.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-3',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Two agents in a workflow each maintain their own local state and reach conflicting conclusions about the current branch state. What's the fix?",
      explanation: "Single source of truth + serialized writes is the canonical fix.",
      options: [
        { key: 'A', text: "Give one agent priority over the other.", isCorrect: false },
        { key: 'B', text: "Use a single canonical state artifact that both agents read and update through serialized writes.", isCorrect: true },
        { key: 'C', text: "Run the agents in different repositories.", isCorrect: false },
        { key: 'D', text: "Reduce both agents' memory to short-term only.", isCorrect: false },
      ],
    },

    // Domain 4 (Q23-Q29)
    {
      domainCode: 'DOM-4',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.HARD,
      text: "Which of the following are automated evaluation signals you should configure for an agent's output? (Select all that apply.)",
      explanation: "All three (A, B, C) are automated scanners. (D) is human input, not automated.",
      options: [
        { key: 'A', text: "Code scanning (CodeQL) alerts.", isCorrect: true },
        { key: 'B', text: "Secret scanning results.", isCorrect: true },
        { key: 'C', text: "Dependabot dependency review.", isCorrect: true },
        { key: 'D', text: "Reviewer commentary in PR threads.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-4',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "An agent's PRs frequently pass tests but introduce performance regressions on a critical path. The team wants this caught automatically before merge. Which approach is most appropriate?",
      explanation: "Required status check on a benchmark is the standard gate. (A) doesn't scale, (C) over-restricts, (D) hides the regression.",
      options: [
        { key: 'A', text: "Ask reviewers to read every diff carefully.", isCorrect: false },
        { key: 'B', text: "Add a performance benchmark step that produces a required status check; fail the check if regression exceeds threshold.", isCorrect: true },
        { key: 'C', text: "Disable the agent for critical-path files.", isCorrect: false },
        { key: 'D', text: "Increase test timeout values.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-4',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.EASY,
      text: "An agent's failure trace shows that it called the wrong tool for a task. Which root-cause category does this most closely match?",
      explanation: "Wrong tool call = tool misuse by definition.",
      options: [
        { key: 'A', text: "Reasoning error.", isCorrect: false },
        { key: 'B', text: "Tool misuse.", isCorrect: true },
        { key: 'C', text: "Context or environment issue.", isCorrect: false },
        { key: 'D', text: "Network failure.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-4',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "After analyzing failures, you find that the agent consistently misinterprets a custom internal API because its description in the agent's config is ambiguous. What is the most appropriate tuning step?",
      explanation: "Tune by revising tool descriptions/examples. (B)(D) are unrelated; (C) discards capability.",
      options: [
        { key: 'A', text: "Revise the agent's tool descriptions and add usage examples in its config.", isCorrect: true },
        { key: 'B', text: "Increase the agent's max-token budget.", isCorrect: false },
        { key: 'C', text: "Remove the tool from the agent's available list.", isCorrect: false },
        { key: 'D', text: "Switch to a different LLM provider.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-4',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Which of the following best aligns evaluation criteria with development intent?",
      explanation: "Alignment with contributor judgment criteria is the published principle.",
      options: [
        { key: 'A', text: "Use eval signals that mirror the criteria a human contributor would be judged on (tests, scans, review feedback).", isCorrect: true },
        { key: 'B', text: 'Define agent-only metrics like "tool calls per task" as the primary success measure.', isCorrect: false },
        { key: 'C', text: "Disable code review for agent-authored PRs to measure raw agent capability.", isCorrect: false },
        { key: 'D', text: "Use only the LLM's self-reported confidence score.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-4',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.HARD,
      text: "Which artifacts are most useful when diagnosing a failed agent run? (Select all that apply.)",
      explanation: "All four are the listed diagnostic surfaces for troubleshooting failed agent runs.",
      options: [
        { key: 'A', text: "Workflow run logs.", isCorrect: true },
        { key: 'B', text: "The agent's structured plan output.", isCorrect: true },
        { key: 'C', text: "The execution trace (tool calls in order).", isCorrect: true },
        { key: 'D', text: "The uploaded artifacts (intermediate state, evaluations).", isCorrect: true },
      ],
    },
    {
      domainCode: 'DOM-4',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "An agent's reasoning is consistently wrong about the team's preferred coding style. Which tuning is most direct?",
      explanation: "Custom instructions are the canonical home for team conventions.",
      options: [
        { key: 'A', text: "Update the agent's custom instructions in .github/copilot-instructions.md with the team's style conventions.", isCorrect: true },
        { key: 'B', text: "Increase the agent's autonomy level.", isCorrect: false },
        { key: 'C', text: "Add a style-check retry loop.", isCorrect: false },
        { key: 'D', text: "Reduce the agent's memory.", isCorrect: false },
      ],
    },

    // Domain 5 (Q30-Q36)
    {
      domainCode: 'DOM-5',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: 'Which pattern best describes a "supervisor" multi-agent orchestration?',
      explanation: "Supervisor = dispatch + review. (A) is fan-out/fan-in, (C) is debate/critic, (D) is sequential pipeline.",
      options: [
        { key: 'A', text: "All agents act simultaneously and outputs are merged at the end.", isCorrect: false },
        { key: 'B', text: "One agent dispatches sub-tasks to worker agents and reviews their outputs.", isCorrect: true },
        { key: 'C', text: "Two agents debate and a third arbitrates.", isCorrect: false },
        { key: 'D', text: "Agents are arranged in a fixed sequential pipeline.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-5',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "You run three agents in parallel on the same repository. To prevent conflicting code changes, which approach is best?",
      explanation: "Branch isolation + file-scope separation + PR-time conflict detection is the parallel-agent pattern.",
      options: [
        { key: 'A', text: "Run all three agents against the main branch directly.", isCorrect: false },
        { key: 'B', text: "Run each agent on its own feature branch with non-overlapping file scopes, and detect conflicts at PR-merge time.", isCorrect: true },
        { key: 'C', text: "Disable two of the agents and run them sequentially.", isCorrect: false },
        { key: 'D', text: "Increase the runner size to handle merges.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-5',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Two parallel agents produce contradictory PRs that modify the same file. Which recovery pattern is most appropriate?",
      explanation: "Reconciler agent or human-in-the-loop is the published recovery pattern.",
      options: [
        { key: 'A', text: "Auto-merge both PRs.", isCorrect: false },
        { key: 'B', text: "A reconciler (judge agent) with a defined arbitration rule, or human-in-the-loop review if disagreement exceeds threshold.", isCorrect: true },
        { key: 'C', text: "Reject both PRs without review.", isCorrect: false },
        { key: 'D', text: "Force-push to overwrite one of the branches.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-5',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Which artifact best supports post-hoc analysis of a multi-agent workflow?",
      explanation: "Linked orchestration record with handoff logs is the auditable structure.",
      options: [
        { key: 'A', text: "A top-level orchestration record (issue or workflow run) linking every sub-agent's run, with decision logs at handoffs.", isCorrect: true },
        { key: 'B', text: "A summary log message on the orchestrator's exit.", isCorrect: false },
        { key: 'C', text: "Each agent's local debug output, kept only on its runner.", isCorrect: false },
        { key: 'D', text: "A Slack thread between the team's engineers.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-5',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Your orchestrator detects that one of three parallel agents has produced no progress for 30 minutes. What's the most appropriate first response?",
      explanation: "Timeout + fallback path is the standard stalled-execution response.",
      options: [
        { key: 'A', text: "Allow the agent to continue indefinitely.", isCorrect: false },
        { key: 'B', text: "Apply a workflow timeout, mark the run failed, and route the sub-task to a fallback path (rerun, alternative agent, or human).", isCorrect: true },
        { key: 'C', text: "Increase the runner's CPU allocation.", isCorrect: false },
        { key: 'D', text: "Cancel all three agents' runs.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-5',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "You want to introduce a new agent into an existing multi-agent workflow without disrupting current runs. Which deployment is safest?",
      explanation: "Shadow-mode parity check is the safe rollout.",
      options: [
        { key: 'A', text: "Replace the existing agent immediately and roll forward.", isCorrect: false },
        { key: 'B', text: "Deploy the new agent in shadow mode, run it alongside the existing one, compare outputs, then promote once parity is confirmed.", isCorrect: true },
        { key: 'C', text: "Run the new agent only on weekends.", isCorrect: false },
        { key: 'D', text: "Disable the existing agent for one week to validate the new one.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-5',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "A retired agent's audit trail must remain accessible for compliance review. Which approach preserves auditability?",
      explanation: "Archive in git + retain runs + document = audit-trail preservation.",
      options: [
        { key: 'A', text: "Delete the agent's config and all associated workflow runs.", isCorrect: false },
        { key: 'B', text: "Archive the config in git history, retain workflow runs/artifacts per retention policy, and document the retirement in a governance record.", isCorrect: true },
        { key: 'C', text: "Move the workflow runs to a private external storage system not linked to the repository.", isCorrect: false },
        { key: 'D', text: "Disable workflow logging going forward.", isCorrect: false },
      ],
    },

    // Domain 6 (Q37-Q41)
    {
      domainCode: 'DOM-6',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "Which action category most clearly requires explicit human authorization?",
      explanation: "Production CI/CD changes are explicitly the high-risk category.",
      options: [
        { key: 'A', text: "Auto-formatting a markdown file.", isCorrect: false },
        { key: 'B', text: "Renaming a private variable in test code.", isCorrect: false },
        { key: 'C', text: "Modifying a CI/CD pipeline that deploys to production.", isCorrect: true },
        { key: 'D', text: "Adding a comment to an existing issue.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-6',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.EASY,
      text: "Which mechanism most directly enforces least-privilege execution context for an agent in a workflow?",
      explanation: "Workflow permissions: block is the GitHub primitive for least privilege at execution time.",
      options: [
        { key: 'A', text: "A workflow permissions: block scoped to the minimum needed for the task.", isCorrect: true },
        { key: 'B', text: "A team-wide announcement in Slack.", isCorrect: false },
        { key: 'C', text: "A pinned issue describing expected behavior.", isCorrect: false },
        { key: 'D', text: "A README note in the repository root.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-6',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.MEDIUM,
      text: "You want to require approval before an agent can deploy to production but not for routine PRs. Which GitHub feature is most appropriate?",
      explanation: "Environment protection rules with required reviewers are the named gate for deploys.",
      options: [
        { key: 'A', text: "Branch protection rules on main.", isCorrect: false },
        { key: 'B', text: "An environment with required reviewers attached to the production deploy job.", isCorrect: true },
        { key: 'C', text: "CODEOWNERS for the entire src/ directory.", isCorrect: false },
        { key: 'D', text: "A WORKING-HOURS setting on the repository.", isCorrect: false },
      ],
    },
    {
      domainCode: 'DOM-6',
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: Difficulty.HARD,
      text: "Which of the following minimize approval friction without reducing safety? (Select all that apply.)",
      explanation: "All target risk-proportionate approval; (C) is approval theater that adds friction without proportionate safety.",
      options: [
        { key: 'A', text: "Require approval only for irreversible or compliance-sensitive changes.", isCorrect: true },
        { key: 'B', text: "Use CODEOWNERS on sensitive paths so reviews are targeted, not global.", isCorrect: true },
        { key: 'C', text: "Require two reviewers on every PR including doc typos.", isCorrect: false },
        { key: 'D', text: "Use environment protection rules so prod deploys are gated but dev flows freely.", isCorrect: true },
      ],
    },
    {
      domainCode: 'DOM-6',
      type: QuestionType.SINGLE_CHOICE,
      difficulty: Difficulty.HARD,
      text: "An agent is about to perform an irreversible production change (e.g., dropping a database column). Which set of controls is the best combination?",
      explanation: "Defense-in-depth: code-level review (CODEOWNERS) + deploy-gate (environment) + intent review (plan artifact).",
      options: [
        { key: 'A', text: "CODEOWNERS approval on the migration file + environment protection rule with required reviewers on the prod environment + a structured plan artifact reviewed before the action job runs.", isCorrect: true },
        { key: 'B', text: "A retry loop with exponential backoff.", isCorrect: false },
        { key: 'C', text: "A larger workflow timeout-minutes value.", isCorrect: false },
        { key: 'D', text: "Allow the agent to proceed and revert later if needed.", isCorrect: false },
      ],
    },
  ];

  const questionRecords: any[] = [];
  for (let i = 0; i < all41Questions.length; i++) {
    const qData = all41Questions[i];
    const domainId = domains[qData.domainCode];

    let question = await prisma.question.findFirst({
      where: {
        certificationId: cert.id,
        text: qData.text,
      },
      include: { options: true },
    });

    if (!question) {
      question = await prisma.question.create({
        data: {
          certificationId: cert.id,
          domainId,
          text: qData.text,
          type: qData.type,
          difficulty: qData.difficulty,
          status: QuestionStatus.PUBLISHED,
          explanation: qData.explanation,
          options: {
            create: qData.options.map((opt) => ({
              key: opt.key,
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          },
        },
        include: { options: true },
      });
    } else {
      // Ensure question options and status are up to date
      await prisma.questionOption.deleteMany({ where: { questionId: question.id } });
      await prisma.questionOption.createMany({
        data: qData.options.map((opt) => ({
          questionId: question.id,
          key: opt.key,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      });
      question = await prisma.question.update({
        where: { id: question.id },
        data: {
          domainId,
          type: qData.type,
          status: QuestionStatus.PUBLISHED,
          explanation: qData.explanation,
        },
        include: { options: true },
      });
    }

    questionRecords.push(question);
  }

  console.log(`Seeded ${questionRecords.length} questions for GH-600.`);

  // 5. Create the Official 41-Question Mock Exam
  let mockExam = await prisma.exam.findFirst({
    where: { slug: 'gh-600-practice-exam' },
  });

  if (!mockExam) {
    mockExam = await prisma.exam.create({
      data: {
        certificationId: cert.id,
        title: 'GH-600 Official Practice Mock Exam (41 Questions)',
        slug: 'gh-600-practice-exam',
        description:
          '41 scenario-based questions weighted to the official GitHub Agentic AI Developer domains. Time yourself: 90 minutes. Passing target: 29/41 ≈ 70%. Includes complete answer rationales and domain score breakdown.',
        durationMinutes: 90,
        totalQuestions: 41,
        passingPercentage: 70.0,
        status: ExamStatus.PUBLISHED,
        examQuestions: {
          create: questionRecords.map((q, idx) => ({
            questionId: q.id,
            orderIndex: idx + 1,
          })),
        },
      },
    });
  } else {
    // Refresh questions in exam
    await prisma.examQuestion.deleteMany({ where: { examId: mockExam.id } });
    await prisma.examQuestion.createMany({
      data: questionRecords.map((q, idx) => ({
        examId: mockExam.id,
        questionId: q.id,
        orderIndex: idx + 1,
      })),
    });
    mockExam = await prisma.exam.update({
      where: { id: mockExam.id },
      data: {
        title: 'GH-600 Official Practice Mock Exam (41 Questions)',
        description:
          '41 scenario-based questions weighted to the official GitHub Agentic AI Developer domains. Time yourself: 90 minutes. Passing target: 29/41 ≈ 70%. Includes complete answer rationales and domain score breakdown.',
        durationMinutes: 90,
        totalQuestions: 41,
        passingPercentage: 70.0,
        status: ExamStatus.PUBLISHED,
      },
    });
  }

  console.log('Created/Updated Exam 1: GH-600 Official Practice Mock Exam (41 Questions)');

  // 6. Create / Update Exam 2 (60 Questions)
  const exam2Slug = 'gh-600-practice-exam-2';
  const jsonPath = path.join(__dirname, 'exam-2-data.json');
  let mockExam2 = null;

  if (fs.existsSync(jsonPath)) {
    const rawExam2 = fs.readFileSync(jsonPath, 'utf8');
    const exam2Questions: Array<{
      orderIndex: number;
      domainCode: string;
      type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      text: string;
      explanation: string;
      options: Array<{
        key: string;
        text: string;
        explanation: string;
        isCorrect: boolean;
      }>;
    }> = JSON.parse(rawExam2);

    const exam2QuestionRecords = [];

    for (const qData of exam2Questions) {
      const domainId = domains[qData.domainCode] || Object.values(domains)[0];

      let question = await prisma.question.findFirst({
        where: {
          certificationId: cert.id,
          text: qData.text,
        },
      });

      if (!question) {
        question = await prisma.question.create({
          data: {
            certificationId: cert.id,
            domainId,
            text: qData.text,
            type: qData.type as QuestionType,
            difficulty: (qData.difficulty as Difficulty) || Difficulty.MEDIUM,
            status: QuestionStatus.PUBLISHED,
            explanation: qData.explanation,
            options: {
              create: qData.options.map((opt) => ({
                key: opt.key,
                text: opt.text,
                isCorrect: opt.isCorrect,
                explanation: opt.explanation,
              })),
            },
          },
        });
      } else {
        await prisma.questionOption.deleteMany({
          where: { questionId: question.id },
        });
        await prisma.questionOption.createMany({
          data: qData.options.map((opt) => ({
            questionId: question.id,
            key: opt.key,
            text: opt.text,
            isCorrect: opt.isCorrect,
            explanation: opt.explanation,
          })),
        });

        question = await prisma.question.update({
          where: { id: question.id },
          data: {
            domainId,
            type: qData.type as QuestionType,
            status: QuestionStatus.PUBLISHED,
            explanation: qData.explanation,
          },
        });
      }

      exam2QuestionRecords.push(question);
    }

    mockExam2 = await prisma.exam.findFirst({
      where: { slug: exam2Slug },
    });

    if (!mockExam2) {
      mockExam2 = await prisma.exam.create({
        data: {
          certificationId: cert.id,
          title: 'GH-600 Official Practice Mock Exam 2 (60 Questions)',
          slug: exam2Slug,
          description:
            '60 comprehensive scenario-based questions weighted across all 6 official GitHub Agentic AI Developer domains. Time yourself: 120 minutes. Passing target: 42/60 (70%). Includes complete answer rationales, option explanations, and domain score analytics.',
          durationMinutes: 120,
          totalQuestions: 60,
          passingPercentage: 70.0,
          status: ExamStatus.PUBLISHED,
          examQuestions: {
            create: exam2QuestionRecords.map((q, idx) => ({
              questionId: q.id,
              orderIndex: idx + 1,
            })),
          },
        },
      });
    } else {
      await prisma.examQuestion.deleteMany({
        where: { examId: mockExam2.id },
      });
      await prisma.examQuestion.createMany({
        data: exam2QuestionRecords.map((q, idx) => ({
          examId: mockExam2.id,
          questionId: q.id,
          orderIndex: idx + 1,
        })),
      });

      mockExam2 = await prisma.exam.update({
        where: { id: mockExam2.id },
        data: {
          title: 'GH-600 Official Practice Mock Exam 2 (60 Questions)',
          description:
            '60 comprehensive scenario-based questions weighted across all 6 official GitHub Agentic AI Developer domains. Time yourself: 120 minutes. Passing target: 42/60 (70%). Includes complete answer rationales, option explanations, and domain score analytics.',
          durationMinutes: 120,
          totalQuestions: 60,
          passingPercentage: 70.0,
          status: ExamStatus.PUBLISHED,
        },
      });
    }

    console.log('Created/Updated Exam 2: GH-600 Official Practice Mock Exam 2 (60 Questions)');
  }

  // 7. Create / Update Exam 3 (25 Questions)
  const exam3Slug = 'gh-600-practice-exam-3';
  const json3Path = path.join(__dirname, 'exam-3-data.json');
  let mockExam3 = null;

  if (fs.existsSync(json3Path)) {
    const rawExam3 = fs.readFileSync(json3Path, 'utf8');
    const exam3Questions: Array<{
      orderIndex: number;
      domainCode: string;
      type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      text: string;
      explanation: string;
      options: Array<{
        key: string;
        text: string;
        explanation: string;
        isCorrect: boolean;
      }>;
    }> = JSON.parse(rawExam3);

    const exam3QuestionRecords = [];

    for (const qData of exam3Questions) {
      const domainId = domains[qData.domainCode] || Object.values(domains)[0];

      let question = await prisma.question.findFirst({
        where: {
          certificationId: cert.id,
          text: qData.text,
        },
      });

      if (!question) {
        question = await prisma.question.create({
          data: {
            certificationId: cert.id,
            domainId,
            text: qData.text,
            type: qData.type as QuestionType,
            difficulty: (qData.difficulty as Difficulty) || Difficulty.MEDIUM,
            status: QuestionStatus.PUBLISHED,
            explanation: qData.explanation,
            options: {
              create: qData.options.map((opt) => ({
                key: opt.key,
                text: opt.text,
                isCorrect: opt.isCorrect,
                explanation: opt.explanation,
              })),
            },
          },
        });
      } else {
        await prisma.questionOption.deleteMany({
          where: { questionId: question.id },
        });
        await prisma.questionOption.createMany({
          data: qData.options.map((opt) => ({
            questionId: question.id,
            key: opt.key,
            text: opt.text,
            isCorrect: opt.isCorrect,
            explanation: opt.explanation,
          })),
        });

        question = await prisma.question.update({
          where: { id: question.id },
          data: {
            domainId,
            type: qData.type as QuestionType,
            status: QuestionStatus.PUBLISHED,
            explanation: qData.explanation,
          },
        });
      }

      exam3QuestionRecords.push(question);
    }

    mockExam3 = await prisma.exam.findFirst({
      where: { slug: exam3Slug },
    });

    if (!mockExam3) {
      mockExam3 = await prisma.exam.create({
        data: {
          certificationId: cert.id,
          title: 'GH-600 Official Practice Mock Exam 3 (25 Questions)',
          slug: exam3Slug,
          description:
            '25 focused scenario-based questions covering agent observability, multi-agent failure recovery, MCP tool setup, memory strategies, and human-in-the-loop guardrails. Time yourself: 50 minutes. Passing target: 18/25 (70%). Includes full answer rationales and domain breakdowns.',
          durationMinutes: 50,
          totalQuestions: 25,
          passingPercentage: 70.0,
          status: ExamStatus.PUBLISHED,
          examQuestions: {
            create: exam3QuestionRecords.map((q, idx) => ({
              questionId: q.id,
              orderIndex: idx + 1,
            })),
          },
        },
      });
    } else {
      await prisma.examQuestion.deleteMany({
        where: { examId: mockExam3.id },
      });
      await prisma.examQuestion.createMany({
        data: exam3QuestionRecords.map((q, idx) => ({
          examId: mockExam3.id,
          questionId: q.id,
          orderIndex: idx + 1,
        })),
      });

      mockExam3 = await prisma.exam.update({
        where: { id: mockExam3.id },
        data: {
          title: 'GH-600 Official Practice Mock Exam 3 (25 Questions)',
          description:
            '25 focused scenario-based questions covering agent observability, multi-agent failure recovery, MCP tool setup, memory strategies, and human-in-the-loop guardrails. Time yourself: 50 minutes. Passing target: 18/25 (70%). Includes full answer rationales and domain breakdowns.',
          durationMinutes: 50,
          totalQuestions: 25,
          passingPercentage: 70.0,
          status: ExamStatus.PUBLISHED,
        },
      });
    }

    console.log('Created/Updated Exam 3: GH-600 Official Practice Mock Exam 3 (25 Questions)');
  }

  // 8. Create / Update Exam 4 (25 Questions)
  const exam4Slug = 'gh-600-practice-exam-4';
  const json4Path = path.join(__dirname, 'exam-4-data.json');
  let mockExam4 = null;

  if (fs.existsSync(json4Path)) {
    const rawExam4 = fs.readFileSync(json4Path, 'utf8');
    const exam4Questions: Array<{
      orderIndex: number;
      domainCode: string;
      type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      text: string;
      explanation: string;
      options: Array<{
        key: string;
        text: string;
        explanation: string;
        isCorrect: boolean;
      }>;
    }> = JSON.parse(rawExam4);

    const exam4QuestionRecords = [];

    for (const qData of exam4Questions) {
      const domainId = domains[qData.domainCode] || Object.values(domains)[0];

      let question = await prisma.question.findFirst({
        where: {
          certificationId: cert.id,
          text: qData.text,
        },
      });

      if (!question) {
        question = await prisma.question.create({
          data: {
            certificationId: cert.id,
            domainId,
            text: qData.text,
            type: qData.type as QuestionType,
            difficulty: (qData.difficulty as Difficulty) || Difficulty.MEDIUM,
            status: QuestionStatus.PUBLISHED,
            explanation: qData.explanation,
            options: {
              create: qData.options.map((opt) => ({
                key: opt.key,
                text: opt.text,
                isCorrect: opt.isCorrect,
                explanation: opt.explanation,
              })),
            },
          },
        });
      } else {
        await prisma.questionOption.deleteMany({
          where: { questionId: question.id },
        });
        await prisma.questionOption.createMany({
          data: qData.options.map((opt) => ({
            questionId: question.id,
            key: opt.key,
            text: opt.text,
            isCorrect: opt.isCorrect,
            explanation: opt.explanation,
          })),
        });

        question = await prisma.question.update({
          where: { id: question.id },
          data: {
            domainId,
            type: qData.type as QuestionType,
            status: QuestionStatus.PUBLISHED,
            explanation: qData.explanation,
          },
        });
      }

      exam4QuestionRecords.push(question);
    }

    mockExam4 = await prisma.exam.findFirst({
      where: { slug: exam4Slug },
    });

    if (!mockExam4) {
      mockExam4 = await prisma.exam.create({
        data: {
          certificationId: cert.id,
          title: 'GH-600 Official Practice Mock Exam 4 (25 Questions)',
          slug: exam4Slug,
          description:
            '25 scenario-based questions covering memory scoping, least-privilege token permissions, reusable workflow lifecycles, MCP allow-lists, idempotent tool calls, and automated root-cause analysis. Time yourself: 50 minutes. Passing target: 18/25 (70%). Includes full answer rationales and domain breakdowns.',
          durationMinutes: 50,
          totalQuestions: 25,
          passingPercentage: 70.0,
          status: ExamStatus.PUBLISHED,
          examQuestions: {
            create: exam4QuestionRecords.map((q, idx) => ({
              questionId: q.id,
              orderIndex: idx + 1,
            })),
          },
        },
      });
    } else {
      await prisma.examQuestion.deleteMany({
        where: { examId: mockExam4.id },
      });
      await prisma.examQuestion.createMany({
        data: exam4QuestionRecords.map((q, idx) => ({
          examId: mockExam4.id,
          questionId: q.id,
          orderIndex: idx + 1,
        })),
      });

      mockExam4 = await prisma.exam.update({
        where: { id: mockExam4.id },
        data: {
          title: 'GH-600 Official Practice Mock Exam 4 (25 Questions)',
          description:
            '25 scenario-based questions covering memory scoping, least-privilege token permissions, reusable workflow lifecycles, MCP allow-lists, idempotent tool calls, and automated root-cause analysis. Time yourself: 50 minutes. Passing target: 18/25 (70%). Includes full answer rationales and domain breakdowns.',
          durationMinutes: 50,
          totalQuestions: 25,
          passingPercentage: 70.0,
          status: ExamStatus.PUBLISHED,
        },
      });
    }

    console.log('Created/Updated Exam 4: GH-600 Official Practice Mock Exam 4 (25 Questions)');
  }

  // 9. Create / Update Exam 5 (25 Questions)
  const exam5Slug = 'gh-600-practice-exam-5';
  const json5Path = path.join(__dirname, 'exam-5-data.json');
  let mockExam5 = null;

  if (fs.existsSync(json5Path)) {
    const rawExam5 = fs.readFileSync(json5Path, 'utf8');
    const exam5Questions: Array<{
      orderIndex: number;
      domainCode: string;
      type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      text: string;
      explanation: string;
      options: Array<{
        key: string;
        text: string;
        explanation: string;
        isCorrect: boolean;
      }>;
    }> = JSON.parse(rawExam5);

    const exam5QuestionRecords = [];

    for (const qData of exam5Questions) {
      const domainId = domains[qData.domainCode] || Object.values(domains)[0];

      let question = await prisma.question.findFirst({
        where: {
          certificationId: cert.id,
          text: qData.text,
        },
      });

      if (!question) {
        question = await prisma.question.create({
          data: {
            certificationId: cert.id,
            domainId,
            text: qData.text,
            type: qData.type as QuestionType,
            difficulty: (qData.difficulty as Difficulty) || Difficulty.MEDIUM,
            status: QuestionStatus.PUBLISHED,
            explanation: qData.explanation,
            options: {
              create: qData.options.map((opt) => ({
                key: opt.key,
                text: opt.text,
                isCorrect: opt.isCorrect,
                explanation: opt.explanation,
              })),
            },
          },
        });
      } else {
        await prisma.questionOption.deleteMany({
          where: { questionId: question.id },
        });
        await prisma.questionOption.createMany({
          data: qData.options.map((opt) => ({
            questionId: question.id,
            key: opt.key,
            text: opt.text,
            isCorrect: opt.isCorrect,
            explanation: opt.explanation,
          })),
        });

        question = await prisma.question.update({
          where: { id: question.id },
          data: {
            domainId,
            type: qData.type as QuestionType,
            status: QuestionStatus.PUBLISHED,
            explanation: qData.explanation,
          },
        });
      }

      exam5QuestionRecords.push(question);
    }

    mockExam5 = await prisma.exam.findFirst({
      where: { slug: exam5Slug },
    });

    if (!mockExam5) {
      mockExam5 = await prisma.exam.create({
        data: {
          certificationId: cert.id,
          title: 'GH-600 Official Practice Mock Exam 5 (25 Questions)',
          slug: exam5Slug,
          description:
            '25 scenario-based questions covering planning vs. execution boundaries, built-in cloud agent guardrails, end-to-end traceability, evaluation frameworks, concurrency controls, and rollback workflows. Time yourself: 50 minutes. Passing target: 18/25 (70%). Includes full answer rationales and domain breakdowns.',
          durationMinutes: 50,
          totalQuestions: 25,
          passingPercentage: 70.0,
          status: ExamStatus.PUBLISHED,
          examQuestions: {
            create: exam5QuestionRecords.map((q, idx) => ({
              questionId: q.id,
              orderIndex: idx + 1,
            })),
          },
        },
      });
    } else {
      await prisma.examQuestion.deleteMany({
        where: { examId: mockExam5.id },
      });
      await prisma.examQuestion.createMany({
        data: exam5QuestionRecords.map((q, idx) => ({
          examId: mockExam5.id,
          questionId: q.id,
          orderIndex: idx + 1,
        })),
      });

      mockExam5 = await prisma.exam.update({
        where: { id: mockExam5.id },
        data: {
          title: 'GH-600 Official Practice Mock Exam 5 (25 Questions)',
          description:
            '25 scenario-based questions covering planning vs. execution boundaries, built-in cloud agent guardrails, end-to-end traceability, evaluation frameworks, concurrency controls, and rollback workflows. Time yourself: 50 minutes. Passing target: 18/25 (70%). Includes full answer rationales and domain breakdowns.',
          durationMinutes: 50,
          totalQuestions: 25,
          passingPercentage: 70.0,
          status: ExamStatus.PUBLISHED,
        },
      });
    }

    console.log('Created/Updated Exam 5: GH-600 Official Practice Mock Exam 5 (25 Questions)');
  }

  // Ensure ONLY the official mock exams exist for GH-600
  const validExamIds = [mockExam.id];
  if (mockExam2) validExamIds.push(mockExam2.id);
  if (mockExam3) validExamIds.push(mockExam3.id);
  if (mockExam4) validExamIds.push(mockExam4.id);
  if (mockExam5) validExamIds.push(mockExam5.id);

  await prisma.exam.deleteMany({
    where: {
      certificationId: cert.id,
      id: { notIn: validExamIds },
    },
  });

  // 10. Create / Update One-Time Platform All-Access Pass Product
  const passFeatures = [
    'Full access to all present & future mock exams',
    'Official GH-600 Exam 1 (41 questions, 90 minutes, 6 domains)',
    'Official GH-600 Exam 2 (60 questions, 120 minutes, 6 domains)',
    'Official GH-600 Exam 3 (25 questions, 50 minutes, 6 domains)',
    'Official GH-600 Exam 4 (25 questions, 50 minutes, 6 domains)',
    'Official GH-600 Exam 5 (25 questions, 50 minutes, 6 domains)',
    'Server-enforced timer & auto-submission engine',
    'Instant answer auto-saving during attempts',
    'Detailed answer rationales & domain performance breakdowns',
    'Readiness score recommendations (Strong, Borderline, Needs Prep)',
    'Unlimited exam retakes & attempt history tracking',
  ];

  let platformProduct = await prisma.product.findFirst({
    where: { isPlatformAccess: true },
  });

  if (!platformProduct) {
    platformProduct = await prisma.product.create({
      data: {
        name: 'CertPrep All-Access Platform Pass',
        description:
          'One-time fee for full lifetime access to all mock exams across all current and future technical certifications on CertPrep.',
        priceInr: 149,
        isPlatformAccess: true,
        isActive: true,
        features: passFeatures,
      },
    });
  } else {
    platformProduct = await prisma.product.update({
      where: { id: platformProduct.id },
      data: {
        name: 'CertPrep All-Access Platform Pass',
        priceInr: 149,
        description:
          'One-time fee for full lifetime access to all mock exams across all current and future technical certifications on CertPrep.',
        isPlatformAccess: true,
        isActive: true,
        features: passFeatures,
      },
    });
  }

  // 7. Ensure normal user is entitled with Platform All-Access
  await prisma.entitlement.upsert({
    where: {
      userId_productId: {
        userId: normalUser.id,
        productId: platformProduct.id,
      },
    },
    update: {
      isActive: true,
      isPlatformAccess: true,
    },
    create: {
      userId: normalUser.id,
      productId: platformProduct.id,
      isPlatformAccess: true,
      isActive: true,
    },
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
