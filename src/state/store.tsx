import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { CheckpointVote } from '../engine';
import { PROPOSED } from '../data/persona';
import {
  GameState, initSeason, buildBoard, togglePick, runClearing, advanceWeek,
  vote, markMet, closeNow, reportSafety, graduateNow,
  sendMessage, receiveReply, openChat, requestGraduate, confirmGraduate, dismissCelebrate,
} from './orchestration';

type Action =
  | { type: 'ONBOARD_APPROVE'; evidenceIds: string[] }
  | { type: 'DECLARE'; dir: 'in' | 'paused' }
  | { type: 'TOGGLE_PICK'; id: string }
  | { type: 'SUBMIT' }
  | { type: 'VOTE'; connId: string; v: CheckpointVote }
  | { type: 'MARK_MET'; connId: string }
  | { type: 'CLOSE'; connId: string }
  | { type: 'REPORT'; connId: string }
  | { type: 'GRADUATE'; connId: string }
  | { type: 'OPEN_CHAT'; connId: string | null }
  | { type: 'SEND_MESSAGE'; connId: string; text: string }
  | { type: 'RECEIVE_REPLY'; connId: string }
  | { type: 'REQUEST_GRADUATE'; connId: string | null }
  | { type: 'CONFIRM_GRADUATE'; connId: string }
  | { type: 'DISMISS_CELEBRATE' }
  | { type: 'ADVANCE' }
  | { type: 'RESET'; seed: string };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'ONBOARD_APPROVE': {
      const interests = PROPOSED.filter(
        (e) => action.evidenceIds.includes(e.id) && e.interest
      ).map((e) => e.interest!) as string[];
      const player = {
        ...state.player,
        interests: interests.length ? interests : state.player.interests,
      };
      const byId = new Map(state.byId);
      byId.set(player.id, player);
      return { ...state, player, byId, approvedEvidence: action.evidenceIds, phase: 'DECLARE' };
    }
    case 'DECLARE':
      return buildBoard({ ...state, declaration: action.dir });
    case 'TOGGLE_PICK':
      return togglePick(state, action.id);
    case 'SUBMIT':
      return runClearing(state);
    case 'VOTE':
      return vote(state, action.connId, state.player.id, action.v);
    case 'MARK_MET':
      return markMet(state, action.connId);
    case 'CLOSE':
      return closeNow(state, action.connId);
    case 'REPORT':
      return reportSafety(state, action.connId);
    case 'GRADUATE':
      return graduateNow(state, action.connId);
    case 'OPEN_CHAT':
      return openChat(state, action.connId);
    case 'SEND_MESSAGE':
      return sendMessage(state, action.connId, action.text);
    case 'RECEIVE_REPLY':
      return receiveReply(state, action.connId);
    case 'REQUEST_GRADUATE':
      return requestGraduate(state, action.connId);
    case 'CONFIRM_GRADUATE':
      return confirmGraduate(state, action.connId);
    case 'DISMISS_CELEBRATE':
      return dismissCelebrate(state);
    case 'ADVANCE':
      return advanceWeek(state);
    case 'RESET':
      return initSeason(action.seed);
    default:
      return state;
  }
}

interface Store {
  state: GameState;
  onboardApprove: (ids: string[]) => void;
  declare: (dir: 'in' | 'paused') => void;
  togglePick: (id: string) => void;
  submit: () => void;
  vote: (connId: string, v: CheckpointVote) => void;
  markMet: (connId: string) => void;
  close: (connId: string) => void;
  report: (connId: string) => void;
  graduate: (connId: string) => void;
  openChat: (connId: string | null) => void;
  send: (connId: string, text: string) => void;
  requestGraduate: (connId: string | null) => void;
  confirmGraduate: (connId: string) => void;
  dismissCelebrate: () => void;
  advance: () => void;
  reset: (seed: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, 'roster-season-0', initSeason);
  const store = useMemo<Store>(
    () => ({
      state,
      onboardApprove: (ids) => dispatch({ type: 'ONBOARD_APPROVE', evidenceIds: ids }),
      declare: (dir) => dispatch({ type: 'DECLARE', dir }),
      togglePick: (id) => dispatch({ type: 'TOGGLE_PICK', id }),
      submit: () => dispatch({ type: 'SUBMIT' }),
      vote: (connId, v) => dispatch({ type: 'VOTE', connId, v }),
      markMet: (connId) => dispatch({ type: 'MARK_MET', connId }),
      close: (connId) => dispatch({ type: 'CLOSE', connId }),
      report: (connId) => dispatch({ type: 'REPORT', connId }),
      graduate: (connId) => dispatch({ type: 'GRADUATE', connId }),
      openChat: (connId) => dispatch({ type: 'OPEN_CHAT', connId }),
      send: (connId, text) => {
        dispatch({ type: 'SEND_MESSAGE', connId, text });
        // The partner replies after a beat; content is deterministic, timing is theater.
        setTimeout(() => dispatch({ type: 'RECEIVE_REPLY', connId }), 1000 + Math.random() * 600);
      },
      requestGraduate: (connId) => dispatch({ type: 'REQUEST_GRADUATE', connId }),
      confirmGraduate: (connId) => dispatch({ type: 'CONFIRM_GRADUATE', connId }),
      dismissCelebrate: () => dispatch({ type: 'DISMISS_CELEBRATE' }),
      advance: () => dispatch({ type: 'ADVANCE' }),
      reset: (seed) => dispatch({ type: 'RESET', seed }),
    }),
    [state]
  );
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used within StoreProvider');
  return s;
}
