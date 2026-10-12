const fs = require('fs');
const path = require('path');

const exam5Questions = [
  {
    orderIndex: 1,
    domainCode: 'DOM-1',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: "An engineer needs to make a substantial architectural change and wants a reviewable plan before any code is written. She would like to explore approaches, argue about trade-offs, and revise the sequence of steps, and only then have the work executed autonomously. Which way of dividing the work across GitHub Copilot's surfaces best matches this planning-then-execution boundary?",
    explanation: "Separating planning from action is partly a configuration question and partly a question of which surface a task belongs on. Interactive Copilot sessions keep a human in the loop for every turn, which is what exploratory design work requires, while the cloud agent is built to execute a defined task without step-by-step supervision. Moving the agreed plan into the issue body creates a durable, reviewable specification that becomes the agent's input, so the transition from reasoning to execution happens at a visible, deliberate point. This also means the plan can be revised and re-approved before any branch exists, rather than being corrected after code has been written. Choosing the right surface for each phase is often more effective than adding approval gates to a single surface that is doing both jobs.\n\nDomain: Defining planning and action boundaries (Prepare agent architecture & SDLC processes)",
    options: [
      {
        key: 'A',
        text: 'Have each developer plan the change privately in their editor and rely on code review to catch any divergence between the plan and the implementation.',
        explanation: 'This answer is incorrect. Private planning leaves no shared artifact for the agent to work from, so the implementation has no authoritative definition of done. Relying on review to detect divergence pushes the check to the latest and most expensive point.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Work with Copilot interactively to produce and refine the plan, then record the agreed plan as the body of an issue and assign that issue to the cloud agent for execution.',
        explanation: "This answer is correct. Interactive Copilot sessions are suited to exploration and revision, where a human is present to challenge each option before anything is committed. Once the plan is settled, writing it into the issue turns it into the agent's task definition, so the boundary between deciding and doing is explicit and recorded.",
        isCorrect: true,
      },
      {
        key: 'C',
        text: 'Ask the cloud agent to open a pull request that contains only a written plan, then assign a second issue asking it to implement the plan from that pull request.',
        explanation: 'This answer is incorrect. Using an autonomous run to produce a document adds a full agent session and a pull request for something a conversation resolves faster, and the plan cannot be argued over interactively as it forms. It also splits one task across two sessions with no benefit.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Assign the architectural change to the cloud agent immediately and use pull request comments to redirect it whenever its approach turns out to be wrong.',
        explanation: 'This answer is incorrect. Assigning the work first means execution begins before the approach has been agreed, and correcting course through comments is slower and noisier than settling the plan up front. The planning phase still happens, just after code has already been written.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 2,
    domainCode: 'DOM-6',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: "A development team has just enabled the GitHub Copilot cloud agent on a repository and is documenting the controls that apply to it before writing any additional policy. A team member asks what the agent is and is not permitted to do out of the box, so the team can decide which extra guardrails are genuinely needed. Which statement accurately describes the built-in constraints on the cloud agent's work?",
    explanation: "Effective guardrail design starts with an accurate picture of the controls that already apply, because duplicating existing protections adds process cost without reducing risk. The cloud agent is confined to a branch it creates, submits its work as a pull request, and is barred from approving or merging that pull request, which preserves separation of duties between the actor and the reviewer. Because the agent authors the change and a different account must approve and merge it, unreviewed agent-authored merges are not possible under the repository's existing review rules. Additional policy is therefore best spent on areas these defaults do not reach, such as which paths the agent may touch and which environments it may deploy to. Teams that skip this inventory typically over-gate low-risk work and under-gate the changes that actually matter.\n\nDomain: Implementing guardrails and human-in-the-loop controls (Guardrails & accountability)",
    options: [
      {
        key: 'A',
        text: 'The agent runs with full administrative permissions on the repository, so restricting it requires removing it from the repository entirely.',
        explanation: 'This answer is incorrect. The agent operates with scoped permissions rather than administrative rights, and it cannot change repository settings. Removing it entirely is not the only way to constrain it.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'The agent can merge its own pull requests once all required status checks pass, so the team must add a rule to prevent self-merging.',
        explanation: 'This answer is incorrect. The agent cannot approve or merge its own pull request, which is a deliberate separation-of-duties control rather than something the team has to add. A rule preventing self-merge would be redundant.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'The agent works on a branch it creates rather than committing to an existing branch, it opens a pull request for review, and it cannot approve or merge that pull request itself.',
        explanation: 'This answer is correct. Branch isolation and the inability to self-approve or self-merge are enforced by default rather than being something the team configures. Knowing these baseline controls lets the team add only the guardrails that address real gaps instead of duplicating protections that already exist.',
        isCorrect: true,
      },
      {
        key: 'D',
        text: 'The agent commits directly to the branch the issue was filed against, so the team must redirect its work to a separate branch through custom instructions.',
        explanation: 'This answer is incorrect. The agent creates its own branch for the work and does not commit to the branch the issue relates to. The team does not need custom instructions to obtain that behavior.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 3,
    domainCode: 'DOM-6',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A security team is reviewing how their organization uses the GitHub Copilot cloud agent to autonomously implement features and fix bugs across multiple repositories. They want to ensure that every action taken by the agent — including file edits, tool calls, and API interactions — is traceable and attributable to a specific user or workflow trigger. Which combination of GitHub features provides the most comprehensive traceability and accountability for agent actions?',
    explanation: "Traceability for autonomous work has two halves: a record of what the agent did, and an attribution trail identifying the humans at each end of the action. Session logs supply the first, while commit and pull request metadata identify who assigned the task and who reviewed and merged the result. Organization audit events extend the record beyond the retention of individual runs and can be streamed to an external platform where longer retention applies. Approaches that auto-approve agent output, cripple the agent with read-only access, or treat ephemeral development environments as an audit store fail to produce that combination.\n\nDomain: Observing and validating autonomous behavior (Guardrails & accountability)",
    options: [
      {
        key: 'A',
        text: 'Enable GitHub Advanced Security on all repositories and configure Copilot code review to automatically approve pull requests created by the cloud agent, ensuring all changes are scanned before merge.',
        explanation: 'This answer is incorrect. While GitHub Advanced Security and Copilot code review are valuable security tools, auto-approving pull requests created by the cloud agent undermines accountability rather than strengthening it. This option focuses on scanning and review automation but does not address traceability of agent actions back to a specific user or workflow trigger.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Use GitHub Actions workflows with the GITHUB_TOKEN to run the cloud agent, and store all workflow run logs in a GitHub Codespaces environment for long-term audit retention.',
        explanation: 'This answer is incorrect. While GitHub Actions workflows and the GITHUB_TOKEN are appropriate mechanisms for running the cloud agent, storing logs in GitHub Codespaces is not a supported or recommended audit retention strategy — Codespaces are ephemeral cloud development environments, not audit log stores. This option conflates a development environment tool with an audit and compliance function.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: "Review the agent's session logs, the commit and pull request metadata that ties each agent-authored change to the user who assigned the task and the reviewer who approved it, and the organization audit log for agent-related events, streamed to the security team's own platform for retention.",
        explanation: 'This answer is correct. Session logs record the tool calls and steps of a run, commit and pull request metadata identify the person who directed the work and the person who approved it, and audit log events preserve the organization-wide record beyond the life of a single run. Together these answer both what the agent did and which humans are accountable for it.',
        isCorrect: true,
      },
      {
        key: 'D',
        text: 'Configure branch protection rules to prevent direct pushes to the default branch and use the GITHUB_TOKEN with read-only permissions so the cloud agent cannot make any changes without manual intervention.',
        explanation: 'This answer is incorrect. Configuring branch protection rules and restricting the GITHUB_TOKEN to read-only permissions effectively prevents the cloud agent from performing any meaningful autonomous work, which is counterproductive. This approach limits agent capability entirely rather than enabling safe, traceable execution with appropriate accountability mechanisms.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 4,
    domainCode: 'DOM-1',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: "A platform engineering team has deployed the GitHub Copilot cloud agent to autonomously resolve issues in their monorepo. After one month, the team lead wants to establish a formal evaluation framework to determine whether the agent is performing effectively. Which combination of signals provides the most comprehensive evaluation of the agent's performance?",
    explanation: "Effective evaluation of an AI agent requires pairing outcome-oriented quantitative signals (such as pull request merge rate without major revision) with qualitative signals that assess the quality of the agent's reasoning and decision-making (such as correct change scoping). Together, these signals measure both the result and the process, giving teams a comprehensive view of agent performance. Signals tied only to activity volume or superficial formatting compliance fail to reveal whether the agent is genuinely solving problems correctly and safely.\n\nDomain: Defining success criteria (Prepare agent architecture & SDLC processes)",
    options: [
      {
        key: 'A',
        text: "Track the number of times the agent requests clarification on an issue (quantitative) and assess whether the agent's commit messages follow the team's style guide (qualitative).",
        explanation: "This answer is incorrect. While clarification requests can indicate ambiguity handling, counting them alone does not measure whether the agent ultimately succeeds at its tasks. Commit message style adherence is a low-signal qualitative measure that evaluates formatting compliance rather than the correctness or impact of the agent's work.",
        isCorrect: false,
      },
      {
        key: 'B',
        text: "Track the number of issues assigned to the agent per sprint (quantitative) and review whether developers find the agent's pull request descriptions well-written (qualitative).",
        explanation: "This answer is incorrect. Counting issues assigned per sprint measures workload distribution, not agent effectiveness or task quality. Evaluating pull request description quality is a superficial qualitative signal that does not assess whether the agent actually solved the underlying problem correctly.",
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Track the total number of GitHub Actions workflow runs triggered by the agent (quantitative) and review whether the agent uses the correct branch naming convention (qualitative).',
        explanation: "This answer is incorrect. The number of GitHub Actions workflow runs triggered is an activity metric that reflects volume but not success or quality of the agent's work. Adherence to branch naming conventions is a minor process compliance check, not a meaningful indicator of whether the agent is solving problems effectively.",
        isCorrect: false,
      },
      {
        key: 'D',
        text: "Track the percentage of agent-opened pull requests that are merged without significant human revision (quantitative) and assess whether the agent correctly scopes changes to the relevant files without unintended side effects (qualitative).",
        explanation: "This answer is correct. The merge rate of agent-opened pull requests without significant revision is a strong quantitative signal of task completion quality, directly measuring whether the agent's output is production-ready. Assessing whether changes are correctly scoped is a meaningful qualitative signal that evaluates the agent's reasoning and precision, which is critical for autonomous operation in a monorepo where unintended side effects can be costly.",
        isCorrect: true,
      },
    ],
  },
  {
    orderIndex: 5,
    domainCode: 'DOM-5',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A GitHub Copilot cloud agent introduced a breaking change to a shared authentication library, which downstream integration tests only caught after the pull request had been merged. The team has already reverted the change. The team lead now wants to reduce the chance that a similar agent-introduced regression reaches the default branch again. Which action best addresses this?',
    explanation: "Responding to an agent failure well means asking which signal would have caught it and moving that signal earlier. In this incident the breaking change was detectable, but only by a suite that ran after the merge, so the useful change is to make that suite a required check on pull requests touching the affected path. Scoping the requirement to the shared library keeps the added run time off unrelated pull requests. Broader controls such as extra reviewers or reduced autonomy impose ongoing cost across all work while leaving the specific detection gap open. Turning each incident into an enforced, path-scoped check is how a team's guardrails improve in proportion to what it has actually experienced.\n\nDomain: Responding to multi-agent failures (Multi-agent coordination)",
    options: [
      {
        key: 'A',
        text: "Reduce the agent's autonomy so it only proposes changes as comments and a human applies them by hand.",
        explanation: 'This answer is incorrect. Removing autonomy trades away the throughput the agent provides to address a gap in automated verification. A human applying the same change by hand would have introduced the same regression.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Add the downstream integration test suite as a required status check on pull requests that modify the shared library, so the regression that was missed is now detected before merge.',
        explanation: 'This answer is correct. The failure was detected by a test suite that ran too late, so promoting it to a required check on the relevant path moves the detection before the merge point. Converting a past incident into an enforced check is what stops the same class of failure from recurring.',
        isCorrect: true,
      },
      {
        key: 'C',
        text: 'Require an additional human approver on all agent-authored pull requests, so more reviewers see each change before it merges.',
        explanation: 'This answer is incorrect. More reviewers on the same pull request would not have caught a breaking change that only surfaced when downstream services ran their integration tests. Human review is not a substitute for the missing automated signal.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Configure the agent to open pull requests as drafts so they cannot be merged accidentally while work is still in progress.',
        explanation: 'This answer is incorrect. Draft status controls when a pull request becomes mergeable but says nothing about whether the change is correct. The pull request in this incident was ready and still contained the regression.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 6,
    domainCode: 'DOM-5',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A platform team triggers a GitHub Actions workflow that invokes agent tasks whenever a pull request is updated. Contributors often push several commits in quick succession, so multiple runs of the same workflow execute simultaneously against the same pull request, each pushing its own agent-generated commit and overwriting the previous one. Which change stops the simultaneous runs from interfering with each other?',
    explanation: 'Parallel agent execution creates correctness problems whenever two runs write to the same resource, and in this case the shared resource is the pull request branch. Concurrency groups let a workflow declare that runs sharing a key must not overlap, and choosing the pull request reference as the key scopes the constraint to exactly the runs that conflict. Cancelling in-progress runs is appropriate when only the newest commit matters, because superseded runs would write stale results. Runs for other pull requests continue in parallel, so the fix does not reduce overall throughput. Declaring the shared resource and serializing on it is the standard way to make concurrent agent work safe.\n\nDomain: Orchestrating multi-agent workflows (Multi-agent coordination)',
    options: [
      {
        key: 'A',
        text: 'Define a concurrency group keyed on the pull request reference in the workflow, with in-progress runs cancelled so only the newest run for that pull request continues.',
        explanation: 'This answer is correct. A concurrency group serializes runs that share the same key, and cancelling in-progress runs ensures only the latest state of the pull request is acted on. That removes the race between overlapping runs writing to the same branch.',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Change the workflow trigger so it runs on a schedule instead of on pull request updates.',
        explanation: 'This answer is incorrect. Moving to a schedule breaks the connection between a push and its validation, delaying feedback and still allowing a run to act on a branch that has since moved. It changes the trigger without addressing concurrent writes.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Add a random delay at the start of the workflow so overlapping runs are unlikely to write at the same moment.',
        explanation: 'This answer is incorrect. A delay reduces the probability of a collision without eliminating it, so the same corruption still occurs intermittently. Timing-based workarounds are unreliable under load.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Increase the number of available runners so each queued run gets its own runner and completes faster.',
        explanation: 'This answer is incorrect. More runners let more conflicting runs execute at once, which makes the interference worse rather than better. Capacity is not the constraint here.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 7,
    domainCode: 'DOM-3',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A GitHub Copilot cloud agent session ends unexpectedly partway through a task. A developer asks what the agent will still know if the task is picked up again later, so the team can decide what the agent should be instructed to record as it works. Which statement correctly describes what persists beyond the end of a session?',
    explanation: "Deciding what an agent should record depends on knowing which parts of its work outlive a single session. Commits on the branch and comments on the issue or pull request are stored in the repository, so they are readable by any later session or person. The context the agent accumulates while running, including its reasoning about approaches it considered and rejected, exists only for the duration of that session. Anything from that second category that later work depends on has to be deliberately written into the first, which is why progress notes and decision records are committed rather than left implicit. Understanding this boundary is what makes durable state persistence an explicit design choice rather than an assumption.\n\nDomain: Persisting agent state (Memory, state, and execution)",
    options: [
      {
        key: 'A',
        text: "The agent's full working context is retained and restored automatically whenever the same task is picked up again, so nothing needs to be written down.",
        explanation: 'This answer is incorrect. Accumulated context is not restored automatically, which is why an interrupted task can otherwise resume without knowledge of decisions already made. Relying on automatic restoration is what produces contradictory work after a break.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: "Work the agent committed to its branch and anything it wrote into the issue or pull request thread persists and can be read later, while the session's accumulated working context does not survive the session.",
        explanation: 'This answer is correct. Commits and thread content are stored in the repository and survive independently of any session, whereas the reasoning and intermediate context the agent built up during the run does not. That distinction is what determines which decisions have to be written down deliberately as the work proceeds.',
        isCorrect: true,
      },
      {
        key: 'C',
        text: 'Nothing persists from an interrupted session, so any task that does not complete must be started again from the original issue.',
        explanation: 'This answer is incorrect. Commits, comments, and the pull request itself remain available after an interrupted session, so completed work is not lost. Starting over would discard progress that is still present.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Only the final pull request description persists, since branches created by an interrupted session are removed when the session ends.',
        explanation: 'This answer is incorrect. A branch created during a session remains in the repository along with its commits after the session ends. Committed work is not discarded.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 8,
    domainCode: 'DOM-2',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A development team wants GitHub Copilot to have access to their organization’s GitHub repositories, issues, and pull requests when generating responses in agent mode. A team lead decides to configure the GitHub MCP Server for the team. Which approach best describes how the GitHub MCP Server enables GitHub Copilot to access these GitHub resources?',
    explanation: "The GitHub MCP Server implements the Model Context Protocol to expose GitHub's capabilities — such as reading repository contents, listing issues, and reviewing pull requests — as discrete tools that GitHub Copilot can invoke during agent mode interactions. This on-demand tool-calling architecture allows Copilot to access live, up-to-date GitHub data without requiring pre-loading or special model training. Understanding this tool-based integration model is central to configuring and using the GitHub MCP Server effectively.\n\nDomain: Working with MCP servers (Tool use & environment interaction)",
    options: [
      {
        key: 'A',
        text: 'The GitHub MCP Server replaces the standard GitHub Copilot extension and provides a separate AI model that has been pre-trained exclusively on the organization’s private repository data.',
        explanation: 'This answer is incorrect. The GitHub MCP Server does not replace the GitHub Copilot extension or provide a separately trained AI model. It is a tool-integration layer that works alongside the existing GitHub Copilot, not a substitute for it or its underlying model.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'The GitHub MCP Server acts as a bridge that exposes GitHub APIs as tools, allowing GitHub Copilot to query and interact with GitHub resources such as repositories, issues, and pull requests during a conversation.',
        explanation: "This answer is correct. The GitHub MCP Server works by exposing GitHub APIs as a set of callable tools through the Model Context Protocol, which allows GitHub Copilot (in agent mode) to dynamically fetch and interact with GitHub resources such as repositories, issues, and pull requests as needed during a conversation. This is the fundamental purpose and mechanism of MCP servers — extending an AI assistant's capabilities by providing access to external tools and data sources.",
        isCorrect: true,
      },
      {
        key: 'C',
        text: "The GitHub MCP Server creates a direct database connection between GitHub Copilot and GitHub's internal storage, bypassing the GitHub REST API to improve response latency.",
        explanation: "This answer is incorrect. The GitHub MCP Server does not create a direct database connection to GitHub's internal storage. It uses GitHub's public APIs (such as the REST API and GraphQL API) to retrieve data, operating within the standard authentication and authorization framework.",
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'The GitHub MCP Server synchronizes repository content into the GitHub Copilot context window at startup, so all repository data is embedded in memory before any conversation begins.',
        explanation: 'This answer is incorrect. The GitHub MCP Server does not pre-load or synchronize all repository data into memory at startup. MCP servers respond to on-demand tool calls made by the AI during a conversation, fetching only the specific data requested rather than bulk-loading content upfront.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 9,
    domainCode: 'DOM-3',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A team runs a multi-phase migration in which each phase is a separate GitHub Copilot cloud agent session, sometimes weeks apart. Each session currently writes its record of applied scripts and schema decisions into a file uploaded as a workflow artifact. Six weeks into the project a session cannot find the record from an earlier phase. What is the most likely reason, and how should the team persist this state instead?',
    explanation: "Choosing where to persist agent state is mainly a question of how long the state must survive and who needs to read it. Workflow artifacts are scoped to a run and expire after their retention period, which makes them suitable for logs and intermediate outputs that matter during an investigation but not for a project record spanning months. State that later sessions must treat as authoritative belongs in the repository, where it is versioned alongside the code it describes and available to any session that checks out the branch. Committing the record also means changes to it are reviewable, so a mistaken entry can be traced and corrected like any other change. Matching the storage lifetime to the state's lifetime is what prevents an agent from resuming work with a gap in its history.\n\nDomain: Persisting agent state (Memory, state, and execution)",
    options: [
      {
        key: 'A',
        text: "The artifact was overwritten by a later run with the same name; the team should give each run's artifact a unique name and continue using artifacts.",
        explanation: "This answer is incorrect. Artifacts from separate runs do not overwrite one another, since each belongs to its own run. Unique naming would not extend how long any of them survive.",
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'The artifact exceeded the maximum size for a workflow artifact; the team should compress the record before uploading it.',
        explanation: 'This answer is incorrect. A record of applied scripts and decisions is small text and nowhere near the artifact size limit. Compression would not change its retention.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'The artifact was stored in the wrong workflow; the team should move the upload step into the workflow that triggers the agent.',
        explanation: 'This answer is incorrect. Artifacts are retrievable regardless of which workflow produced them, so location is not what made the record unavailable. The record would have expired in either workflow.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'The artifact passed its retention period and was deleted; the team should commit the migration record to the repository so it persists for the life of the project and is versioned with the code.',
        explanation: 'This answer is correct. Workflow artifacts are retained for a limited period and are removed when it expires, which is why a record from weeks earlier is gone. State that must outlive individual runs belongs in the repository, where it is versioned, reviewable, and readable by any later session.',
        isCorrect: true,
      },
    ],
  },
  {
    orderIndex: 10,
    domainCode: 'DOM-2',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A team has configured an MCP server for the GitHub Copilot cloud agent that exposes both read operations and destructive write operations against an internal issue tracker. The team wants the agent to be able to query the tracker during its tasks but must prevent it from invoking any of the server’s write operations. Which configuration achieves this?',
    explanation: "Restricting an agent's tool surface is most reliable when the unwanted tools are never offered in the first place. MCP server entries in the cloud agent's configuration accept an explicit list of the tools to expose, which lets a team admit the read operations from a server while withholding its destructive ones. This differs from an organization-wide policy about which servers may be used at all, and both controls are often needed: one decides which servers are trusted, the other decides which of a trusted server's tools the agent may call. Approaches based on downstream credential rejection or written instruction leave the tool visible and depend on something else to say no. Narrowing the exposed tool list keeps the boundary in the agent's own configuration where it can be reviewed alongside the rest of the setup.\n\nDomain: Working with MCP servers (Tool use & environment interaction)",
    options: [
      {
        key: 'A',
        text: "Instruct the agent in the issue body not to call the server's write tools during the task.",
        explanation: 'This answer is incorrect. Instructions shape behavior but are not an enforced boundary, and a single ambiguous task can lead the agent to call a tool it was told to avoid. Guardrails should not rely on the agent choosing to comply.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Remove the MCP server from the agent’s configuration and have the agent query the tracker through its public web interface instead.',
        explanation: 'This answer is incorrect. Removing the server takes away the query capability the team wants to keep, and browsing a web interface is not a substitute for structured tool access. The requirement is to narrow the tool set, not eliminate it.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Configure the MCP server with read-only credentials and leave every tool exposed, relying on the credential to reject write calls.',
        explanation: 'This answer is incorrect. Read-only credentials cause write attempts to fail rather than preventing them, so the agent still spends turns calling tools that cannot work. It also depends entirely on the downstream system enforcing the restriction correctly.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Specify the allowed tools for that MCP server in the agent’s configuration, listing only the read operations so the write tools are not made available to the agent.',
        explanation: "This answer is correct. The agent's MCP configuration accepts an explicit list of tools to expose from a given server, and tools omitted from that list are not available to the agent. Listing only the read operations means the write tools are never presented as callable options.",
        isCorrect: true,
      },
    ],
  },
  {
    orderIndex: 11,
    domainCode: 'DOM-4',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A GitHub Copilot cloud agent was assigned an issue reporting that a scheduled export job silently produces empty files. The agent opened a pull request that adds extensive logging to the export job and updates the job’s documentation, but changes nothing about how the export writes its output. The session log shows the agent read the issue, searched for the job’s entry point, and then moved directly to adding logging without ever reproducing the reported behavior. Which root cause category best describes this failure, and what is the appropriate corrective action?',
    explanation: 'Root cause analysis for agent runs starts by asking whether the agent was blocked or simply aimed at the wrong target. Blocked runs leave evidence such as failed tool calls, permission errors, or unreachable hosts, and none of that appears when an agent completes its steps cleanly and delivers off-target work. Output that is adjacent to the goal, such as adding observability instead of fixing the defect, points to a comprehension failure driven by an underspecified task. The corrective action belongs upstream in the task definition, and a failing test that encodes the expected behavior is the strongest form because it is both a specification and an automatic check. Categorizing correctly matters because permission and environment remedies do nothing for a task that was never clearly defined.\n\nDomain: Performing root-cause analysis (Evaluation, error analysis, and tuning)',
    options: [
      {
        key: 'A',
        text: 'A task comprehension failure, because the agent addressed the visibility of the problem rather than the problem itself; the corrective action is to state a verifiable acceptance criterion in the issue, such as a test that fails on the current code and passes once the export writes correct output.',
        explanation: 'This answer is correct. The agent produced work that is plausible and adjacent to the goal but leaves the reported defect untouched, which is characteristic of misunderstanding what would count as done. Writing an acceptance criterion that fails on current code gives the agent an objective target and makes the same mistake detectable automatically.',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'A tool availability failure, because the agent lacked a tool for writing files; the corrective action is to grant additional write permissions to its credential.',
        explanation: 'This answer is incorrect. The agent successfully wrote code and opened a pull request, so file writing plainly worked. Adding permissions addresses a constraint that was never binding.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'An environment configuration failure, because the agent could not reach the scheduled job’s runtime; the corrective action is to allow the agent to trigger the job directly in production.',
        explanation: 'This answer is incorrect. Nothing in the session indicates a blocked or failed environment operation, and the agent proceeded through its steps without error. Granting an agent the ability to run jobs in production would also introduce risk unrelated to this failure.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'A model capability failure, because the task exceeds what a cloud agent can do; the corrective action is to stop assigning export-related issues to the agent.',
        explanation: 'This answer is incorrect. Declaring the whole task class out of reach after one poorly specified run discards a capability without evidence. The session shows an unclear target rather than an unreachable one.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 12,
    domainCode: 'DOM-2',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A development team is configuring the GitHub Copilot cloud agent for their repository. They want to ensure the agent can read and write code, create commits, and push branches, but they are concerned about limiting its blast radius if something goes wrong. When evaluating the execution context for the agent, which combination of controls best restricts the agent’s permissions to only what is necessary for these tasks while preventing it from modifying repository settings or accessing other repositories in the organization?',
    explanation: "The cloud agent already operates under credentials scoped to the repository where the work was assigned, with enough access to push to its own branch and open pull requests and no access to repository administration or to other repositories. Introducing an additional broad credential would widen the blast radius the team is trying to contain, so the correct move is to rely on the existing boundary and add review at the merge point. A ruleset requiring pull requests on the default branch ensures nothing the agent produces reaches protected code without human review. Workflow tokens apply to Actions runs rather than to the agent, and organization-wide credentials contradict the requirement outright.\n\nDomain: Configuring agent tools and permissions (Tool use & environment interaction)",
    options: [
      {
        key: 'A',
        text: 'Rely on the agent’s built-in credentials, which are scoped to the single repository where it was assigned work and let it push to its own branch and open pull requests but not change repository settings or reach other repositories, and add a ruleset on the default branch requiring pull requests so nothing merges without review.',
        explanation: 'This answer is correct. The agent’s credentials are already confined to the repository where it works and carry no administrative scope, so the smallest blast radius is achieved by relying on that boundary rather than introducing a broader credential. A ruleset requiring pull requests on the default branch adds the review step that keeps agent-authored changes from landing unexamined.',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Create a fine-grained personal access token with organization-level access and all repository permissions enabled, then use branch protection rules on the default branch as the sole guardrail against unintended changes.',
        explanation: 'This answer is incorrect. A fine-grained personal access token with organization-level access and all repository permissions enabled grants far more access than necessary, including the ability to modify repository settings and access every repository in the organization. Using branch protection rules on the default branch as the sole guardrail does not compensate for the excessive token scope granted to the agent.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Grant the agent an organization-level GITHUB_TOKEN with write permissions across all repositories so it can create branches and commits without restriction, and rely on audit logs to review its actions after the fact.',
        explanation: 'This answer is incorrect. Granting an organization-level GITHUB_TOKEN with write permissions across all repositories is the opposite of least-privilege and directly violates the requirement to prevent the agent from accessing other repositories in the organization. Relying solely on audit logs is a detective control, not a preventive one, and does not limit the agent’s blast radius in real time.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Grant the agent a GITHUB_TOKEN scoped to the repository with read/write permissions on contents and pull requests, and configure a repository environment with required reviewers to gate any agent-initiated deployments.',
        explanation: 'This answer is incorrect. The workflow token is issued to GitHub Actions runs rather than to the cloud agent, so shaping its permissions does not change what the agent may do. Environment reviewers gate deployments and do not address access to repository settings or to other repositories.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 13,
    domainCode: 'DOM-3',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A development team is using the GitHub Copilot cloud agent to autonomously implement a multi-file database schema migration across a production repository. The agent has been configured to run within a repository environment called production. Midway through execution, the agent encounters an unrecoverable error after modifying five files but before completing the migration. The team wants to ensure that any future agent task configuration guarantees the repository is restored to its pre-task state whenever the agent fails in this way. Which approach best implements this rollback behavior for the GitHub Copilot cloud agent?',
    explanation: 'Rollback for agent work in a repository rests on two things: the partial changes must be confined somewhere disposable, and something must dispose of them without a person remembering to. Confining the work to a branch the agent creates keeps the default branch untouched throughout, and reacting to the failed validation run by closing the pull request and deleting the branch clears the remnant automatically. Approval gates placed before the task starts cannot undo changes made after it begins, and security scanning detects vulnerable code rather than incomplete work. Note that this restores the repository only; changes an agent has already applied to external systems such as databases require their own reverse operations.\n\nDomain: Ensuring safe execution and error handling (Memory, state, and execution)',
    options: [
      {
        key: 'A',
        text: 'Configure the repository environment production to require a manual approval gate before the agent begins any task, so a human reviewer can revert changes if the agent reports an error.',
        explanation: 'This answer is incorrect. Requiring a manual approval gate before the agent starts a task adds a human checkpoint at the beginning of execution, but it does not implement rollback behavior. If the agent fails midway through modifying files, a pre-task approval cannot undo changes that have already been written; a separate automated mechanism is needed to restore the repository state.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Configure the repository environment production with a deployment protection rule that prevents the agent from writing directly to the default branch, and rely on the agent’s pull request to be manually reviewed before any changes are merged.',
        explanation: 'This answer is incorrect. While using a repository environment with deployment protection rules is a good safety practice that prevents direct writes to the default branch, it does not constitute a rollback mechanism. If the agent fails after modifying files on a feature branch, the partial changes still exist on that branch; manual review of a pull request addresses merging decisions but does not automatically clean up or restore the incomplete work.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Keep all agent work on a branch it creates so the default branch is never modified, and add a workflow that runs on completion of the agent’s validation run with a failure conclusion, closing the associated pull request and deleting the branch so the repository returns to its pre-task state.',
        explanation: 'This answer is correct. Confining the work to a branch means a mid-task failure never touches the default branch, so the repository state that matters is already protected. A workflow that reacts to the failed run by closing the pull request and deleting the branch removes the partial work automatically, completing the return to the pre-task state.',
        isCorrect: true,
      },
      {
        key: 'D',
        text: 'Enable GitHub Advanced Security on the repository so that secret scanning and dependency review automatically block incomplete migrations from being merged into the default branch.',
        explanation: 'This answer is incorrect. GitHub Advanced Security provides secret scanning, code scanning, and dependency review capabilities, but these are security analysis tools rather than rollback mechanisms. They do not detect or respond to agent execution failures, nor do they restore modified files to a previous state when an error occurs.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 14,
    domainCode: 'DOM-5',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A team runs a release pipeline in which several GitHub Copilot cloud agent sessions and GitHub Actions workflow runs each handle one stage of the work, and the stages are spread across separate workflow runs triggered at different times. After an incident, the team can read each individual run’s logs but cannot tell which runs belonged to the same end-to-end release attempt. Which change makes the sequence reconstructable across the separate runs?',
    explanation: 'Observability across a multi-stage agent pipeline depends on being able to group the records that belong to a single logical attempt. When stages execute as separate workflow runs, nothing links them by default, so each run is an isolated island of logs. Generating a correlation identifier at the start of the pipeline and passing it into every downstream stage gives all the related records a shared key that can be filtered and sorted reliably. Writing that key into job summaries and uploaded artifacts preserves the linkage after the runs age out of the active view, which is what an incident investigation needs. Correlation identifiers are the standard mechanism for reconstructing distributed execution paths, and they apply to agent handoffs the same way they apply to distributed services.\n\nDomain: Ensuring multi-agent observability (Multi-agent coordination)',
    options: [
      {
        key: 'A',
        text: 'Merge all stages into one very long workflow run so there is only ever a single set of logs to read.',
        explanation: 'This answer is incorrect. Collapsing independent stages into a single run removes the ability to retry or trigger stages separately, which is why they were split in the first place. It solves traceability by discarding the architecture.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Rename each workflow run using the timestamp at which it started so runs can be matched by their start times.',
        explanation: 'This answer is incorrect. Timestamps are approximate and become ambiguous as soon as two release attempts overlap or a stage is retried later. Ordering by time is a guess rather than an attribution.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Emit a shared correlation identifier for the release attempt, propagate it to every stage as an input, and include it in each run’s job summary and uploaded artifacts.',
        explanation: 'This answer is correct. A correlation identifier carried through every stage gives all related runs a common key that can be filtered on, no matter when each stage executed. Recording it in job summaries and artifacts means the link survives outside the live run view.',
        isCorrect: true,
      },
      {
        key: 'D',
        text: 'Increase the log verbosity of every job so each run contains more detail about what it executed.',
        explanation: 'This answer is incorrect. More detail inside each run does not create any link between runs, so the reconstruction problem is unchanged. It also makes the logs harder to read rather than easier.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 15,
    domainCode: 'DOM-4',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A team is using the GitHub Copilot cloud agent to resolve a bug reported in an issue. The agent is given the task: "Fix the authentication failure described in issue #42." The agent reads the issue, explores the codebase, creates a feature branch, and states in its plan that it will push its commits to that feature branch. The session log then shows the push tool being invoked with the target ref set to main rather than to the branch it created, and the call fails with "Permission denied: cannot write to protected branch main." Which root cause category best describes this failure?',
    explanation: 'Classifying an agent failure means locating the step at which intent and behavior diverged. Reasoning errors show up as a plan that does not serve the goal, context and environment issues show up as an agent acting sensibly against conditions it had no way to know about, and tool misuse shows up as a correct intention carried out through an incorrectly formed call. In this run the plan named the feature branch and the push named the default branch, which places the fault at the invocation. The corrective action follows the classification: constrain or validate the push target rather than rewriting the task description or changing repository protections.\n\nDomain: Performing root-cause analysis (Evaluation, error analysis, and tuning)',
    options: [
      {
        key: 'A',
        text: 'A reasoning error, because the agent misinterpreted the task goal and concluded that pushing directly to main was the correct way to resolve the issue, despite having already created a feature branch.',
        explanation: 'This answer is incorrect. A reasoning error would mean the agent misunderstood the goal or chose an approach that does not serve it. Here the plan was sound and named the correct branch, so the breakdown happened when the plan was carried out rather than when it was formed.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'A context or environment issue, because the branch protection rules on main were not communicated to the agent as part of its operating constraints, causing it to attempt an action outside its permitted scope.',
        explanation: 'This answer is incorrect. Branch protection on the default branch is a normal repository condition, and the agent had already created and named the correct branch, so nothing about the environment misled it. The protection rule surfaced the misdirected call rather than causing it.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'A context or environment issue, because the GITHUB_TOKEN provided to the agent lacked the contents: write permission required to push to any branch in the repository.',
        explanation: 'This answer is incorrect. A missing contents: write permission on the GITHUB_TOKEN would prevent the agent from pushing to any branch, including its own feature branch. The scenario states the agent did create a pull request (implying it could write to the feature branch), and the error specifically references the protected branch main, pointing to a branch protection constraint rather than a missing token permission.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'A tool misuse error, because the agent invoked the git push tool with incorrect parameters, targeting main instead of the feature branch it had created earlier in the session.',
        explanation: 'This answer is correct. The agent had the right tool available and the right target recorded in its plan, but invoked the push with the wrong ref, which is a defect in how the tool was called rather than in what the agent intended. Failures where the plan is correct and the invocation is not fall into the tool misuse category.',
        isCorrect: true,
      },
    ],
  },
  {
    orderIndex: 16,
    domainCode: 'DOM-3',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A bug fix requires coordinated changes in three separate repositories: an API service, a shared client library, and a documentation site. A developer assigns the whole fix to the GitHub Copilot cloud agent in the API repository and expects it to carry its decisions into the other two. The agent completes the API change but never touches the other repositories. Which approach correctly structures this work?',
    explanation: 'Continuity across environments starts with knowing the boundary of a single agent session, which for the cloud agent is one repository. Work that spans repositories therefore decomposes into separate tasks rather than one long-running task that migrates between codebases. The decisions that must hold across all three, such as a renamed method signature or an agreed contract version, have to be restated in each task definition because they do not travel automatically. Linking the resulting pull requests to one another gives reviewers and future sessions a trail that shows the pieces belong together. Recognizing session boundaries and passing shared decisions across them explicitly is what keeps multi-repository work coherent.\n\nDomain: Maintaining continuity across tools and environments (Memory, state, and execution)',
    options: [
      {
        key: 'A',
        text: 'Grant the agent’s credential write access to all three repositories so a single session can commit across repository boundaries.',
        explanation: 'This answer is incorrect. Widening the credential does not change the fact that the session’s working context is a single repository, so the additional access goes unused for this purpose. It also grants standing write access to repositories the session does not need.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Assign the issue in the API repository and add pull request comments describing the changes the other two repositories need, so the agent applies them when it reads the comments.',
        explanation: 'This answer is incorrect. Comments on a pull request in one repository do not give the agent a working context in the others, so the described changes have nowhere to land. The other repositories still require their own tasks.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'File an issue in each repository, assign each to the agent as its own task, and carry the decisions forward by stating them explicitly in each issue and linking the related pull requests.',
        explanation: 'This answer is correct. A cloud agent session operates within the repository it was assigned in, so cross-repository work is expressed as one task per repository. Restating the relevant decisions in each issue and linking the pull requests carries the shared context forward explicitly rather than assuming the agent retains it.',
        isCorrect: true,
      },
      {
        key: 'D',
        text: 'Combine the three repositories into a single monorepo so one agent session can reach all the code involved in the fix.',
        explanation: 'This answer is incorrect. Restructuring three repositories to accommodate one task is a large architectural change with consequences far beyond this fix. The coordination problem can be solved without it.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 17,
    domainCode: 'DOM-3',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A GitHub Copilot cloud agent consistently fails during dependency installation in one repository. The session log shows the requests to an internal package registry at packages.internal.example.com are not completing, while every other step in the session works normally. The failures happen on every run rather than intermittently. What should the team do?',
    explanation: 'Distinguishing transient failures from deterministic ones determines which recovery strategy is correct. Intermittent errors such as rate limiting or a momentary service outage call for bounded retries with backoff, because the same request is likely to succeed shortly afterwards. A failure that reproduces on every run points instead at a policy or configuration barrier, and for the cloud agent the common cause is the network restriction applied to its execution environment. Allowing the specific host the agent legitimately needs keeps the protective default in place while unblocking the task, which is preferable to disabling the restriction wholesale. Reading the failure pattern before choosing a remedy prevents teams from wrapping retries around a problem that retries cannot fix.\n\nDomain: Ensuring safe execution and error handling (Memory, state, and execution)',
    options: [
      {
        key: 'A',
        text: 'Add exponential backoff with three retries around the dependency installation step so the agent recovers from the network failures.',
        explanation: 'This answer is incorrect. Retrying with backoff is the right response to intermittent failures, but this failure occurs on every run, so each retry fails identically. Retries would only extend the runtime before the same outcome.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Grant the agent’s credential additional repository permissions so it can authenticate to the internal registry.',
        explanation: 'This answer is incorrect. Repository permissions govern what the agent may do within GitHub and have no bearing on whether outbound requests to an external host are permitted. The blocked traffic is a network policy matter, not a token scope matter.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Add the internal registry’s domain to the allowed list for the cloud agent’s environment so the agent’s outbound requests to it are permitted.',
        explanation: 'This answer is correct. The cloud agent’s environment restricts outbound network access, so requests to a host that has not been allowed do not complete. Adding the internal registry to the allowed list is what lets the installation step reach it.',
        isCorrect: true,
      },
      {
        key: 'D',
        text: 'Instruct the agent to skip dependency installation and proceed with the code changes, validating them after a human merges the pull request.',
        explanation: 'This answer is incorrect. Skipping installation means the agent cannot build or test its changes, so it produces unverified work and pushes validation onto reviewers after merge. That removes the checks the agent’s output depends on.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 18,
    domainCode: 'DOM-2',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A development team runs an automated workflow in the repository app-frontend that needs to open a pull request in a second repository, design-tokens, whenever a shared component changes. The workflow currently authenticates with the automatically provided GITHUB_TOKEN and fails when it tries to create the pull request in the other repository. Which credential approach correctly enables the cross-repository operation while keeping access narrow?',
    explanation: 'The token a workflow receives automatically is bound to the repository that hosts the workflow, so its permission block controls depth of access rather than breadth. Any operation that touches a second repository therefore needs a credential whose scope names that repository, which in practice means a GitHub App installation token or a fine-grained personal access token. Choosing between them is largely a question of ownership, since an App installation is not tied to an individual account, but both allow the permission set to be reduced to the specific capability required. Selecting broad classic credentials solves the immediate failure while granting reach across the whole organization, which defeats the purpose of scoping. Matching credential breadth to the exact set of repositories and permissions an automated task touches is the core of least-privilege design for agent and workflow execution contexts.\n\nDomain: Configuring agent tools and permissions (Tool use & environment interaction)',
    options: [
      {
        key: 'A',
        text: 'Add the design-tokens repository as a submodule of app-frontend so the existing GITHUB_TOKEN can reach it as part of the same checkout.',
        explanation: 'This answer is incorrect. A submodule changes how source is checked out and does not grant any authority to create a pull request in the referenced repository. The permission problem is unchanged.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Store an organization-level classic personal access token with full repository scope as a secret and use it for the cross-repository call.',
        explanation: 'This answer is incorrect. A token with full repository scope reaches every repository the account can see, which is far wider than the single additional repository the workflow needs. Broad standing credentials are exactly what least-privilege configuration is meant to avoid.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Grant the workflow’s GITHUB_TOKEN the pull-requests: write permission in the workflow file, which extends its scope to any repository the organization owns.',
        explanation: 'This answer is incorrect. The automatically provided token is scoped to the repository whose workflow is running, and permissions declared in the workflow file adjust what it can do inside that repository only. No permission setting extends it to a different repository.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Authenticate with a GitHub App installation token, or a fine-grained personal access token, that is granted pull request write access to design-tokens and nothing beyond the two repositories involved.',
        explanation: 'This answer is correct. Cross-repository work requires a credential whose scope explicitly includes the target repository, which a GitHub App installation or a fine-grained token can express. Granting only pull request write access on the one additional repository keeps the credential’s reach close to the task it performs.',
        isCorrect: true,
      },
    ],
  },
  {
    orderIndex: 19,
    domainCode: 'DOM-6',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A development team has assigned several issues to the GitHub Copilot cloud agent. A tech lead wants to watch a specific task while it is still running so she can intervene early if the agent heads in the wrong direction, rather than waiting for the finished pull request and reviewing it after the fact. Which approach gives her that in-flight visibility?',
    explanation: 'Observability for an autonomous agent has two distinct modes, and they call for different artifacts. After a run finishes, the pull request timeline and workflow logs support reconstruction of what happened. While a run is still executing, the agent session view is the artifact that matters, because it streams the agent’s steps, tool invocations, and intermediate decisions as they occur. Watching that record turns supervision into something that can change the outcome rather than merely document it, which is what a reviewer needs when the agent is working on unfamiliar or sensitive code. Choosing the artifact that matches the moment is what makes agent behavior genuinely inspectable.\n\nDomain: Observing and validating autonomous behavior (Guardrails & accountability)',
    options: [
      {
        key: 'A',
        text: 'Ask the agent in a pull request comment to describe what it has done so far, and rely on its reply as the record of its activity.',
        explanation: 'This answer is incorrect. A summary the agent writes about itself is a restatement rather than an independent record, and it depends on the agent correctly recalling its own behavior. The point of an execution record is that it does not rely on the agent’s own account.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Clone the agent’s working branch locally and run git log repeatedly to watch new commits appear as the agent works.',
        explanation: 'This answer is incorrect. Commit history shows what was written but not which tools the agent invoked or why it chose a particular approach. Polling a local clone is also a manual workaround for something the platform surfaces directly.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Wait for the agent to finish and then compare the merged diff against the original issue description to infer the path it took.',
        explanation: 'This answer is incorrect. Reading the final diff is a post-hoc reconstruction and by definition cannot happen while the task is in progress. It also shows the outcome rather than the reasoning that produced it.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Open the agent session from the pull request the agent created and follow the session view as it records each step, tool call, and decision while the task is still running.',
        explanation: 'This answer is correct. The cloud agent publishes a session record that is reachable from the pull request it opens, and that record populates as the run progresses rather than only at the end. Watching it lets the reviewer catch a wrong turn while there is still time to redirect the task.',
        isCorrect: true,
      },
    ],
  },
  {
    orderIndex: 20,
    domainCode: 'DOM-4',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A team finds that the GitHub Copilot cloud agent repeatedly edits files under src/shared/ while working on issues that concern only a single feature area, even though the issues never mention shared code. The team wants the agent to treat shared code as off limits unless an issue explicitly asks for it, without narrowing what it can do everywhere else in the repository. Which approach best encodes that constraint?',
    explanation: 'Tuning agent behavior works best when the constraint is expressed at the same granularity as the problem. Path-specific instruction files attach guidance to a directory, so the rule about shared code is applied exactly when the agent touches that directory and stays out of the way otherwise. This is more precise than repository-wide permission changes, which either block everything or nothing, and more reliable than comments that only human readers act on. The second half of the fix is upstream of the agent: vague issues invite scope expansion, so narrowing the task definition removes the ambiguity that causes the behavior. Combining scoped instructions with well-bounded tasks addresses both the trigger and the guardrail rather than one alone.\n\nDomain: Tuning and refining agent behavior (Evaluation, error analysis, and tuning)',
    options: [
      {
        key: 'A',
        text: 'Add a comment header to every file under src/shared/ warning that the file must not be modified without approval.',
        explanation: 'This answer is incorrect. In-file comments are guidance to human readers and are not a reliable constraint on what the agent modifies. Nothing enforces the warning.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Move src/shared/ into a separate repository so the agent cannot reach it while working on feature issues.',
        explanation: 'This answer is incorrect. Splitting the repository to control agent behavior imposes a permanent architectural cost, including versioning and release overhead, on a tuning problem. It also complicates legitimate coordinated changes.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Reduce the agent’s token permissions to read-only for the whole repository so it cannot write to shared code.',
        explanation: 'This answer is incorrect. Read-only access to the whole repository would prevent the agent from doing any work at all, not just work in shared code. The constraint needs to be path-specific rather than repository-wide.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Add a path-specific instructions file that applies to src/shared/ and states that changes there require the issue to explicitly request them, and keep issue scope narrow so the agent has a bounded task.',
        explanation: 'This answer is correct. Path-specific instructions attach guidance to a directory so it is applied whenever the agent works with files under that path, while leaving the rest of the repository unconstrained. Pairing that with narrowly scoped issues removes the ambiguity that invites the agent to expand its own scope.',
        isCorrect: true,
      },
    ],
  },
  {
    orderIndex: 21,
    domainCode: 'DOM-3',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A team has established naming conventions, a preferred testing framework, and a rule that all new modules must include an integration test. Developers use GitHub Copilot in their editors, others use it on github.com, and the cloud agent handles some issues autonomously. The conventions are currently pasted into individual chat sessions, and the results are inconsistent across surfaces. Which approach makes the conventions apply consistently wherever Copilot is used on this repository?',
    explanation: 'Continuity across tools and environments is achieved by attaching context to the repository rather than to a person or a session. Repository custom instructions are stored in the repository at .github/copilot-instructions.md and are picked up for work on that repository wherever Copilot runs, which covers editor sessions, work on github.com, and autonomous cloud agent runs alike. Because the file is versioned, changes to the conventions are reviewed like any other change and take effect for everyone at once. Approaches that rely on individual settings or repeated pasting scale poorly and drift as soon as one person forgets. Placing shared, durable guidance in a committed instructions file is the standard way to keep agent behavior consistent across surfaces.\n\nDomain: Maintaining continuity across tools and environments (Memory, state, and execution)',
    options: [
      {
        key: 'A',
        text: 'Ask each developer to save the conventions in their personal editor settings so their local Copilot sessions pick them up.',
        explanation: 'This answer is incorrect. Personal editor settings apply to one developer’s local sessions and travel with the person rather than the repository. They do not reach github.com or autonomous agent sessions at all.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Include the conventions in the description of every issue that will be assigned to the cloud agent.',
        explanation: 'This answer is incorrect. Repeating the conventions in every issue is manual, easy to forget, and covers only work that arrives through issues. Interactive sessions in the editor and on the web would still diverge.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Commit a repository custom instructions file at .github/copilot-instructions.md that states the conventions, so Copilot applies them across the editor, github.com, and cloud agent sessions on that repository.',
        explanation: 'This answer is correct. Repository custom instructions live in the repository and are applied to Copilot work on that repository regardless of which surface initiates it. Committing them means every developer and every agent session receives the same conventions without anyone pasting them in.',
        isCorrect: true,
      },
      {
        key: 'D',
        text: 'Add the conventions to the repository’s README so contributors and Copilot both encounter them when browsing the repository.',
        explanation: 'This answer is incorrect. A README is documentation for people and is not treated as instruction context, so it does not reliably shape Copilot’s output. Contributors may read it, but the behavior across surfaces remains inconsistent.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 22,
    domainCode: 'DOM-1',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A development team wants a failing test job on a pull request to trigger the GitHub Copilot cloud agent automatically, so that a proposed fix is already available by the time a reviewer looks at the pull request. An engineer drafts a job that runs after the test job and expects the agent to execute as a step on the workflow runner and commit its fix to the pull request branch. Which configuration correctly reflects how the cloud agent is actually invoked and how its work is delivered?',
    explanation: 'Automating agent involvement in a pipeline requires distinguishing what a workflow can do itself from what it delegates. A workflow can detect the condition, using a dependent job with a failure condition on the preceding test job, and it can create a task for the cloud agent through the GitHub API. What it cannot do is run the agent as a step on its own runner, because the agent executes in its own environment rather than inside the calling workflow. That separation is also why the agent delivers its work as a pull request of its own instead of pushing commits into the branch already under review. Designing the integration around detection in the workflow and delegation to the agent keeps the trigger explicit and the agent’s output reviewable.\n\nDomain: Integrating agents into the SDLC (Prepare agent architecture & SDLC processes)',
    options: [
      {
        key: 'A',
        text: 'Add a job with needs: test and if: always() that runs the cloud agent on the runner, so the agent inspects every run and only acts when it detects a failure in the test results.',
        explanation: 'This answer is incorrect. Running on every completed test job wastes runs when tests pass and still assumes the agent executes on the runner. It also leaves the decision to act inside the agent rather than in the workflow condition, which makes the trigger harder to reason about.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Add a scheduled workflow that periodically queries recent workflow runs for failures and, for each one found, checks out the failing branch and runs the cloud agent locally with a fine-grained personal access token.',
        explanation: 'This answer is incorrect. Polling on a schedule delays the response and reruns the same detection logic the workflow already performs directly. It also repeats the mistaken assumption that the agent is a program the workflow checks out and executes.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Add a job with needs: test and if: failure() that calls the GitHub API to create a cloud agent task describing the failing tests and linking the pull request, using a credential authorized to create that task. The agent then runs in its own environment and opens a separate pull request with its proposed fix.',
        explanation: 'This answer is correct. Work reaches the cloud agent by creating a task for it, which the workflow can do through the GitHub API when the condition on the preceding job is met. The agent then runs in its own environment and delivers its work as its own pull request, which keeps its changes reviewable rather than pushed silently into the branch under review.',
        isCorrect: true,
      },
      {
        key: 'D',
        text: 'Add a step to the end of the existing test job that runs the cloud agent on the same runner, granting the workflow token contents: write so the agent can commit its fix to the pull request branch before the job finishes.',
        explanation: 'This answer is incorrect. The cloud agent does not execute as a step on a workflow runner, so there is nothing for the job to run in place. The workflow token also governs what the workflow itself may do and is not the credential the agent operates with.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 23,
    domainCode: 'DOM-2',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'The GitHub Copilot cloud agent fails partway through several tasks in a repository because installing dependencies requires authenticating to a private package registry. The team must give the agent that registry token without making it available to every workflow in the repository or exposing it in the repository’s source. Where should the token be stored so the cloud agent can use it during its sessions?',
    explanation: 'Agents that build and test code frequently need credentials, and where those credentials live determines who else can reach them. Encrypted secrets scoped to the environment the cloud agent runs in give the agent access during its sessions without extending that access to every workflow in the repository. Variables are unsuitable because they are stored in plain text for non-sensitive configuration, and issue bodies and committed files are readable by anyone with repository access. Scoping to the specific repository and environment that needs the credential also limits the damage if the token is ever misused, since it cannot be picked up by unrelated automation. Placing credentials in the narrowest encrypted store that still satisfies the task is the standard least-privilege approach for agent execution contexts.\n\nDomain: Configuring agent tools and permissions (Tool use & environment interaction)',
    options: [
      {
        key: 'A',
        text: 'Add the token as an organization-level variable so it is available to all repositories that the agent might work in.',
        explanation: 'This answer is incorrect. Variables are not encrypted and are intended for non-sensitive configuration values, so a token stored that way is readable. Organization scope also widens exposure well beyond the one repository that needs it.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Add the token as a secret in the repository environment used by the cloud agent, so it is available to agent sessions in that repository without being exposed to unrelated workflows.',
        explanation: 'This answer is correct. Storing the token as a secret in the environment the cloud agent uses makes it available to agent sessions in that repository while keeping it encrypted and out of the source tree. Scoping it to that environment means unrelated workflows in the repository do not receive it.',
        isCorrect: true,
      },
      {
        key: 'C',
        text: 'Pass the token as an input in the issue body when assigning the task, so the agent receives it with the rest of its instructions.',
        explanation: 'This answer is incorrect. Issue bodies are plain text visible to everyone with repository access and are retained indefinitely. Handing a credential to the agent this way leaks it to every reader of the issue.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Commit the token to a configuration file on the agent’s working branch so it is present in the workspace when dependencies are installed.',
        explanation: 'This answer is incorrect. Committing a credential places it in version history where anyone with read access can retrieve it, and revocation becomes the only remedy once it is pushed. Source control is never an appropriate store for secrets.',
        isCorrect: false,
      },
    ],
  },
  {
    orderIndex: 24,
    domainCode: 'DOM-6',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A financial services organization lets the GitHub Copilot cloud agent open pull requests across a repository, but any change under services/payments/ must be reviewed by the payments security group specifically, not by whichever engineer happens to be available. Reviews on all other paths should continue to work as they do today. Which configuration enforces this?',
    explanation: 'Human-in-the-loop controls become meaningful only when the approval comes from someone qualified to judge the change. CODEOWNERS expresses that mapping by associating file paths with the teams accountable for them, and enabling required review from code owners turns the mapping into a merge condition. Because the rule is evaluated on the files a pull request touches, it applies precisely to changes under the sensitive path and leaves other work unaffected. It also applies uniformly to agent-authored and human-authored pull requests, so the guardrail does not depend on who or what opened the change. Routing approval by path is the standard way to keep specialist review targeted without slowing down the rest of the repository.\n\nDomain: Implementing guardrails and human-in-the-loop controls (Guardrails & accountability)',
    options: [
      {
        key: 'A',
        text: 'Ask the agent to mention the payments security team in the pull request description whenever it changes files under services/payments/.',
        explanation: 'This answer is incorrect. A mention notifies the team but does not prevent the pull request from merging without their approval. Notification is not enforcement.',
        isCorrect: false,
      },
      {
        key: 'B',
        text: 'Require two approving reviews on every pull request in the repository so a payments specialist is statistically likely to be among the reviewers.',
        explanation: 'This answer is incorrect. Raising the approval count does not direct the request to any particular team, so a payments change can still be approved entirely by engineers outside that group. It also adds review overhead to every unrelated pull request.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Disable the cloud agent’s ability to open pull requests that touch services/payments/ and require those changes to be written by hand.',
        explanation: 'This answer is incorrect. Blocking the agent from an entire path removes its contribution to that area rather than routing the work through the right reviewers. The requirement is targeted review, not exclusion.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Add a CODEOWNERS entry assigning services/payments/ to the payments security team, and require review from code owners in the ruleset protecting the default branch.',
        explanation: 'This answer is correct. CODEOWNERS maps paths to the teams responsible for them, and requiring code owner review makes approval from the mapped team a merge condition. Together they route payments changes to the payments security group automatically, whether the author is an agent or a person.',
        isCorrect: true,
      },
    ],
  },
  {
    orderIndex: 25,
    domainCode: 'DOM-5',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    text: 'A development team is using GitHub Copilot cloud agent to parallelize work across three separate agents on the same repository. Agent A is refactoring the authentication module, Agent B is adding new API endpoints that depend on the authentication module, and Agent C is updating unit tests for the authentication module. After all three agents complete their work and open pull requests, the team notices that Agent B’s API endpoints reference authentication method signatures that Agent A has renamed, and Agent C’s tests are asserting against the original method names that no longer exist. Which approach should the team use to prevent this class of conflict in future multi-agent workflows?',
    explanation: 'In multi-agent workflows, conflicts arising from interdependent code changes are best prevented through deliberate task sequencing rather than concurrent parallel execution across tightly coupled modules. When one agent’s output defines the interface that other agents depend on, that foundational work must be completed and merged before dependent agents are assigned their tasks. Structuring agent workflows with explicit dependency ordering—so downstream agents always start from the latest merged state of the base branch—is the most effective strategy for eliminating contradictory outputs caused by evolving APIs or shared abstractions.\n\nDomain: Orchestrating multi-agent workflows (Multi-agent coordination)',
    options: [
      {
        key: 'A',
        text: 'Establish a sequential dependency order so that Agent A’s pull request is merged first, then assign Agent B and Agent C as downstream tasks that are triggered only after Agent A’s changes are merged into the base branch.',
        explanation: 'This answer is correct. Establishing a sequential dependency order ensures that Agent A’s foundational refactoring of the authentication module is merged into the base branch before Agent B and Agent C begin their dependent work. This way, both downstream agents operate against the updated method signatures from the start, eliminating the root cause of the contradictory outputs observed.',
        isCorrect: true,
      },
      {
        key: 'B',
        text: 'Configure each agent to open draft pull requests immediately upon starting work, and rely on Copilot code review to automatically detect and flag cross-agent method signature conflicts before any pull request is marked ready for review.',
        explanation: 'This answer is incorrect. While draft pull requests and Copilot code review can surface issues during review, they detect conflicts only after the conflicting work has already been completed. This is a reactive approach that adds review overhead but does not prevent agents from producing contradictory outputs; it merely identifies them after the fact.',
        isCorrect: false,
      },
      {
        key: 'C',
        text: 'Increase the number of agents working on the authentication module simultaneously so that conflicts are identified earlier through more frequent merge attempts against the base branch.',
        explanation: 'This answer is incorrect. Adding more agents to work on the same module simultaneously increases the likelihood of overlapping changes and merge conflicts rather than reducing them. More frequent merge attempts do not resolve the underlying problem of agents working against an outdated API contract; they amplify it.',
        isCorrect: false,
      },
      {
        key: 'D',
        text: 'Require all agents to work exclusively on separate directories with no shared dependencies, and configure branch protection rules to block any pull request that modifies files outside the agent’s designated directory scope.',
        explanation: 'This answer is incorrect. Restricting agents to separate directories with no shared dependencies is overly rigid and does not reflect real-world codebases where cross-module dependencies are unavoidable. While branch protection rules can enforce scope, they cannot prevent downstream agents from referencing stale APIs from a module being concurrently refactored by another agent.',
        isCorrect: false,
      },
    ],
  },
];

console.log(`Validation: ${exam5Questions.length} questions.`);
if (exam5Questions.length !== 25) {
  throw new Error(`Expected 25 questions, got ${exam5Questions.length}`);
}

const domainCount = {};
for (const q of exam5Questions) {
  if (!q.text || !q.explanation) {
    throw new Error(`Question ${q.orderIndex} missing text or explanation`);
  }
  if (!q.options || q.options.length !== 4) {
    throw new Error(`Question ${q.orderIndex} must have exactly 4 options`);
  }
  const correctCount = q.options.filter(o => o.isCorrect).length;
  if (correctCount !== 1) {
    throw new Error(`Question ${q.orderIndex} must have exactly 1 correct option, got ${correctCount}`);
  }
  for (const opt of q.options) {
    if (!opt.text || !opt.explanation) {
      throw new Error(`Question ${q.orderIndex} Option ${opt.key} missing text or explanation`);
    }
  }
  domainCount[q.domainCode] = (domainCount[q.domainCode] || 0) + 1;
}

console.log('Domain breakdown:', domainCount);

const outputPath = path.join(__dirname, 'exam-5-data.json');
fs.writeFileSync(outputPath, JSON.stringify(exam5Questions, null, 2), 'utf8');
console.log(`Successfully generated ${outputPath} with ${exam5Questions.length} questions!`);
