'use client';

import { useActionState } from 'react';
import {
  assignMemberAction,
  createTeamAction,
  createTopicAction,
  renameTeamAction,
  renameTopicAction,
  toggleTopicAction,
  type AdminActionState,
} from '@/app/actions/admin';

type TeamItem = {
  id: string;
  name: string;
  memberCount: number;
};

type TopicItem = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  active: boolean;
};

type MemberItem = {
  id: string;
  name: string;
  email: string;
  teamId: string;
  teamName: string;
  lastAutoAssignedAt: Date | null;
};

type PendingMember = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

type AdminData = {
  teams: TeamItem[];
  topics: TopicItem[];
  members: MemberItem[];
  pendingMembers: PendingMember[];
};

function Feedback({ state }: { state: AdminActionState }) {
  if (!state) return null;
  return <p className={`form-message form-message-${state.kind}`} role="status">{state.message}</p>;
}

function CreateTeamForm() {
  const [state, action, pending] = useActionState(createTeamAction, null);

  return (
    <form action={action} className="compact-form">
      <label className="field">
        <span>Team name</span>
        <input maxLength={80} minLength={2} name="name" required />
      </label>
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? 'Adding…' : 'Add team'}
      </button>
      <Feedback state={state} />
    </form>
  );
}

function TeamRow({ team }: { team: TeamItem }) {
  const [state, action, pending] = useActionState(renameTeamAction, null);

  return (
    <form action={action} className="management-row">
      <input name="id" type="hidden" value={team.id} />
      <label className="sr-only" htmlFor={`team-${team.id}`}>Team name</label>
      <input defaultValue={team.name} id={`team-${team.id}`} maxLength={80} minLength={2} name="name" required />
      <span className="row-meta">{team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}</span>
      <button className="button button-small button-secondary" disabled={pending} type="submit">Save</button>
      <Feedback state={state} />
    </form>
  );
}

function CreateTopicForm({ teams }: { teams: TeamItem[] }) {
  const [state, action, pending] = useActionState(createTopicAction, null);

  return (
    <form action={action} className="compact-form">
      <label className="field">
        <span>Topic name</span>
        <input maxLength={80} minLength={2} name="name" required />
      </label>
      <label className="field">
        <span>Route to team</span>
        <select defaultValue="" name="teamId" required>
          <option disabled value="">Choose a team</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
      </label>
      <button className="button button-primary" disabled={pending || teams.length === 0} type="submit">
        {pending ? 'Adding…' : 'Add topic'}
      </button>
      {teams.length === 0 && <p className="form-note">Create a team before adding a topic.</p>}
      <Feedback state={state} />
    </form>
  );
}

function TopicRow({ topic }: { topic: TopicItem }) {
  const [renameState, renameAction, renaming] = useActionState(renameTopicAction, null);
  const [toggleState, toggleAction, toggling] = useActionState(toggleTopicAction, null);

  return (
    <div className="topic-row">
      <form action={renameAction} className="management-row">
        <input name="id" type="hidden" value={topic.id} />
        <label className="sr-only" htmlFor={`topic-${topic.id}`}>Topic name</label>
        <input defaultValue={topic.name} id={`topic-${topic.id}`} maxLength={80} minLength={2} name="name" required />
        <span className="row-meta">{topic.teamName}</span>
        <button className="button button-small button-secondary" disabled={renaming} type="submit">Save</button>
        <Feedback state={renameState} />
      </form>
      <form action={toggleAction} className="topic-toggle-form">
        <input name="id" type="hidden" value={topic.id} />
        <input name="active" type="hidden" value={String(!topic.active)} />
        <span className={`status-pill ${topic.active ? 'status-active' : 'status-muted'}`}>
          {topic.active ? 'Available' : 'Paused'}
        </span>
        <button className="text-link" disabled={toggling} type="submit">
          {topic.active ? 'Pause topic' : 'Make available'}
        </button>
        <Feedback state={toggleState} />
      </form>
    </div>
  );
}

function AssignMemberForm({ teams, members }: { teams: TeamItem[]; members: PendingMember[] }) {
  const [state, action, pending] = useActionState(assignMemberAction, null);

  if (members.length === 0) {
    return <p className="empty-inline">No staff accounts are waiting for team placement.</p>;
  }

  return (
    <form action={action} className="compact-form">
      <label className="field">
        <span>Staff account</span>
        <select defaultValue="" name="userId" required>
          <option disabled value="">Choose a staff member</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name} · {member.email}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Team</span>
        <select defaultValue="" name="teamId" required>
          <option disabled value="">Choose a team</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
      </label>
      <button className="button button-primary" disabled={pending || teams.length === 0} type="submit">
        {pending ? 'Adding…' : 'Approve and add to team'}
      </button>
      <Feedback state={state} />
    </form>
  );
}

function MemberTeamForm({ teams, member }: { teams: TeamItem[]; member: MemberItem }) {
  const [state, action, pending] = useActionState(assignMemberAction, null);

  return (
    <form action={action} className="member-team-form">
      <input name="userId" type="hidden" value={member.id} />
      <label className="sr-only" htmlFor={`member-team-${member.id}`}>Team for {member.name}</label>
      <select defaultValue={member.teamId} id={`member-team-${member.id}`} name="teamId">
        {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
      </select>
      <button className="button button-small button-secondary" disabled={pending} type="submit">{pending ? 'Saving…' : 'Move'}</button>
      <Feedback state={state} />
    </form>
  );
}

export function AdminConsole({ data }: { data: AdminData }) {
  return (
    <div className="admin-grid">
      <section className="management-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Routing setup</span>
            <h2>Teams</h2>
          </div>
          <span className="count-badge">{data.teams.length}</span>
        </div>
        <CreateTeamForm />
        <div className="management-list">
          {data.teams.map((team) => <TeamRow key={team.id} team={team} />)}
          {data.teams.length === 0 && <p className="empty-inline">No teams yet. Add a team to begin setting up routing.</p>}
        </div>
      </section>

      <section className="management-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Topic routing</span>
            <h2>Topics</h2>
          </div>
          <span className="count-badge">{data.topics.length}</span>
        </div>
        <CreateTopicForm teams={data.teams} />
        <div className="management-list">
          {data.topics.map((topic) => <TopicRow key={topic.id} topic={topic} />)}
          {data.topics.length === 0 && <p className="empty-inline">No topics yet. Add topics to show them on the ticket form.</p>}
        </div>
      </section>

      <section className="management-panel member-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Access control</span>
            <h2>Team members</h2>
          </div>
          <span className="count-badge">{data.members.length}</span>
        </div>
        <div className="member-list">
          {data.members.map((member) => (
            <article className="member-row" key={member.id}>
              <div className="member-identity">
                <strong>{member.name}</strong>
                <span>{member.email}</span>
              </div>
              <MemberTeamForm member={member} teams={data.teams} />
            </article>
          ))}
          {data.members.length === 0 && <p className="empty-inline">No active team members yet.</p>}
        </div>
        <div className="pending-members">
          <div className="panel-heading panel-heading-small">
            <div>
              <span className="eyebrow">Awaiting placement</span>
              <h3>New accounts</h3>
            </div>
            <span className="count-badge">{data.pendingMembers.length}</span>
          </div>
          <AssignMemberForm members={data.pendingMembers} teams={data.teams} />
        </div>
      </section>
    </div>
  );
}
