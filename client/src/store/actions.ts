/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
/* eslint-disable */
import { ActionCreator, AnyAction, Dispatch } from "redux";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import Cmi5 from "@xapi/cmi5";
import { fetchConfig, fetchMentorPanel, getUtterance, queryMentor } from "api";
import {
  MentorsLoadRequest,
  MentorsLoadResult,
  MentorQuestionStatus,
  MentorSelection,
  MentorSelectReason,
  QuestionResponse,
  QuestionResult,
  ResultStatus,
  MentorState,
  MentorQuestionSource,
  State,
  XapiResultExt,
  XapiResultAnswerStatusByMentorId,
  Config,
  UtteranceName,
  Mentor,
  TopicQuestions,
  QuestionType,
  QuestionInput,
  MentorDataResult,
} from "../types";

const RESPONSE_CUTOFF = -100;

export const ANSWER_FINISHED = "ANSWER_FINISHED"; // mentor video has finished playing
export const CONFIG_LOAD_FAILED = "CONFIG_LOAD_FAILED";
export const CONFIG_LOAD_STARTED = "CONFIG_LOAD_STARTED";
export const CONFIG_LOAD_SUCCEEDED = "CONFIG_LOAD_SUCCEEDED";
export const MENTOR_ANSWER_PLAYBACK_STARTED = "MENTOR_ANSWER_PLAYBACK_STARTED";
export const MENTORS_LOAD_REQUESTED = "MENTORS_LOAD_REQUESTED";
export const MENTORS_LOAD_RESULT = "MENTORS_LOAD_RESULT";
export const MENTOR_FAVED = "MENTOR_FAVED"; // mentor was favorited
export const MENTOR_NEXT = "MENTOR_NEXT"; // set next mentor to play after current
export const MENTOR_SELECTED = "MENTOR_SELECTED"; // mentor video was selected
export const QUESTION_ANSWERED = "QUESTION_ANSWERED"; // question was answered by mentor
export const QUESTION_ERROR = "QUESTION_ERROR"; // question could not be answered by mentor
export const QUESTION_INPUT_CHANGED = "QUESTION_INPUT_CHANGED";
export const QUESTION_RESULT = "QUESTION_RESULT";
export const QUESTION_SENT = "QUESTION_SENT"; // question input was sent
export const TOPIC_SELECTED = "TOPIC_SELECTED";
export const GUEST_NAME_SET = "GUEST_NAME_SET";

export interface ConfigLoadFailedAction {
  type: typeof CONFIG_LOAD_FAILED;
  errors: string[];
}

export interface ConfigLoadStartedAction {
  type: typeof CONFIG_LOAD_STARTED;
}

export interface ConfigLoadSucceededAction {
  type: typeof CONFIG_LOAD_SUCCEEDED;
  payload: Config;
}

export type ConfigLoadAction =
  | ConfigLoadFailedAction
  | ConfigLoadStartedAction
  | ConfigLoadSucceededAction;

export interface MentorAnswerPlaybackStartedAction {
  type: typeof MENTOR_ANSWER_PLAYBACK_STARTED;
  payload: {
    mentor: string;
    duration: number;
  };
}

export interface MentorsLoadRequestedAction {
  type: typeof MENTORS_LOAD_REQUESTED;
  payload: MentorsLoadRequest;
}

export interface MentorsLoadResultAction {
  type: typeof MENTORS_LOAD_RESULT;
  payload: MentorsLoadResult;
}

export type MentorDataAction =
  | MentorsLoadRequestedAction
  | MentorsLoadResultAction;

export interface AnswerFinishedAction {
  type: typeof ANSWER_FINISHED;
}

export interface MentorFavedAction {
  type: typeof MENTOR_FAVED;
  id: string;
}

export interface MentorSelectedAction {
  type: typeof MENTOR_SELECTED;
  payload: MentorSelection;
}

export interface NextMentorAction {
  type: typeof MENTOR_NEXT;
  mentor: string;
}

export type MentorAction =
  | AnswerFinishedAction
  | MentorAnswerPlaybackStartedAction
  | MentorFavedAction
  | MentorSelectedAction
  | NextMentorAction;

export interface QuestionAnsweredAction {
  type: typeof QUESTION_ANSWERED;
  mentor: QuestionResponse;
}

export interface QuestionErrorAction {
  type: typeof QUESTION_ERROR;
  mentor: string;
  question: string;
}

export interface QuestionResultAction {
  type: typeof QUESTION_RESULT;
  payload: QuestionResult;
}

export interface QuestionSentAction {
  type: typeof QUESTION_SENT;
  payload: {
    question: string;
    source: MentorQuestionSource;
  };
}

export type QuestionAction =
  | QuestionAnsweredAction
  | QuestionErrorAction
  | QuestionResultAction
  | QuestionSentAction;

export interface GuestNameSetAction {
  type: typeof GUEST_NAME_SET;
  name: string;
}

export interface TopicSelectedAction {
  type: typeof TOPIC_SELECTED;
  topic: string;
}

export interface QuestionInputChangedAction {
  type: typeof QUESTION_INPUT_CHANGED;
  payload: QuestionInput;
}

export type MentorClientAction =
  | ConfigLoadAction
  | GuestNameSetAction
  | MentorDataAction
  | MentorAction
  | QuestionAction
  | TopicSelectedAction
  | QuestionInputChangedAction;

export const MENTOR_SELECTION_TRIGGER_AUTO = "auto";
export const MENTOR_SELECTION_TRIGGER_USER = "user";

export const loadConfig = () => async (
  dispatch: ThunkDispatch<State, void, ConfigLoadAction>
) => {
  dispatch({
    type: CONFIG_LOAD_STARTED,
  });
  try {
    const config = await fetchConfig();
    return dispatch({
      type: CONFIG_LOAD_SUCCEEDED,
      payload: config,
    });
  } catch (err) {
    console.error(err);
    return dispatch({
      type: CONFIG_LOAD_FAILED,
      errors: [err.message],
    });
  }
};

export const loadMentors: ActionCreator<
  ThunkAction<
    Promise<MentorsLoadResultAction>, // The type of the last action to be dispatched - will always be promise<T> for async actions
    State, // The type for the data within the last action
    string, // The type of the parameter for the nested function
    MentorsLoadResultAction // The type of the last action to be dispatched
  >
> = (args: {
  config: Config;
  mentors: string[];
  subjectId?: string;
  recommendedQuestions?: string[];
}) => async (
  dispatch: ThunkDispatch<State, void, AnyAction>,
  getState: () => State
) => {
  const { config, mentors, subjectId, recommendedQuestions } = args;
  dispatch<MentorsLoadRequestedAction>({
    type: MENTORS_LOAD_REQUESTED,
    payload: {
      mentors,
      recommendedQuestions: recommendedQuestions || [],
    },
  });
  const mentorLoadResult: MentorsLoadResult = {
    mentorsById: mentors.reduce(
      (acc: Record<string, MentorDataResult>, cur: string) => {
        acc[cur] = {
          status: ResultStatus.FAILED,
        };
        return acc;
      },
      {}
    ),
  };
  try {
    const result = await fetchMentorPanel(config, mentors, subjectId);
    if (result.status === 200 && result.data.data) {
      const mentorPanel: Mentor[] = result.data.data.mentorPanel;
      for (const mentor of mentorPanel) {
        const topics = mentor.topics;
        const questions = mentor.questions;
        const topicQuestions: TopicQuestions[] = [];
        const recommendedQuestions = getState().recommendedQuestions;
        if (recommendedQuestions.length > 0) {
          topicQuestions.push({
            topic: "Recommended",
            questions: recommendedQuestions,
          });
        }
        for (const topic of topics) {
          const tq = questions
            .filter((q) => q.topics.find((t) => t.id === topic.id))
            .map((q) => q.question.question);
          if (tq.length > 0) {
            topicQuestions.push({
              topic: topic.name,
              questions: tq,
            });
          }
        }
        topicQuestions.push({ topic: "History", questions: [] });
        const mentorData: MentorState = {
          mentor: mentor,
          topic_questions: topicQuestions,
          status: MentorQuestionStatus.ANSWERED, // move this out of mentor data
          answer_id: getUtterance(mentor, UtteranceName.INTRO)?._id,
          answerDuration: Number.NaN,
        };
        mentorLoadResult.mentorsById[mentor._id] = {
          data: mentorData,
          status: ResultStatus.SUCCEEDED,
        };
      }
    } else {
      console.error(`error loading mentors ${mentors}`, result);
    }
  } catch (mentorErr) {
    console.error(mentorErr);
  }
  mentorLoadResult.mentor = mentors.find(
    (id) => mentorLoadResult.mentorsById[id].status === ResultStatus.SUCCEEDED
  );
  if (mentorLoadResult.mentor) {
    const tqs =
      mentorLoadResult.mentorsById[mentorLoadResult.mentor]?.data
        ?.topic_questions;
    if (tqs && tqs.length > 0) {
      mentorLoadResult.topic = tqs[0].topic;
    }
  }
  return dispatch<MentorsLoadResultAction>({
    type: MENTORS_LOAD_RESULT,
    payload: mentorLoadResult,
  });
};

function sendCmi5Statement(statement: any) {
  if (!Cmi5.isCmiAvailable) {
    return;
  }
  try {
    Cmi5.instance
      .sendCmi5AllowedStatement(statement)
      .catch((err: Error) => console.error(err));
  } catch (err2) {
    console.error(err2);
  }
}

function toXapiResultExt(mentorData: MentorState, state: State): XapiResultExt {
  return {
    answerClassifier: mentorData.classifier || "",
    answerConfidence: Number(mentorData.confidence),
    answerDuration: Number(mentorData.answerDuration),
    answerId: mentorData.answer_id || "",
    answerIsOffTopic: Boolean(mentorData.is_off_topic),
    answerResponseTimeSecs: Number(mentorData.response_time) / 1000,
    answerStatusByMentor: Object.getOwnPropertyNames(state.mentorsById).reduce(
      (
        acc: XapiResultAnswerStatusByMentorId,
        cur: string
      ): XapiResultAnswerStatusByMentorId => {
        acc[cur] = {
          answerId: state.mentorsById[cur].answer_id || "",
          confidence: Number(state.mentorsById[cur].confidence),
          isOffTopic: Boolean(state.mentorsById[cur].is_off_topic),
          mentor: state.mentorsById[cur].mentor._id,
          status: state.mentorsById[cur].status,
          responseTimeSecs: Number(mentorData.response_time) / 1000,
        };
        return acc;
      },
      {}
    ),
    answerText: mentorData.answer_text || "",
    mentorCur: mentorData.mentor._id,
    mentorCurReason: state.curMentorReason,
    mentorCurStatus: mentorData.status,
    mentorCurIsFav: state.mentorFaved === mentorData.mentor._id,
    mentorFaved: state.mentorFaved,
    mentorNext: state.mentorNext,
    mentorTopicDisplayed: state.curTopic,
    questionsAsked: state.questionsAsked,
    question: state.curQuestion,
    questionSource: state.curQuestionSource,
    questionIndex: currentQuestionIndex(state),
    timestampAnswered: state.curQuestionUpdatedAt,
    timestampAsked: mentorData.answerReceivedAt,
  };
}

export function mentorAnswerPlaybackStarted(video: {
  mentor: string;
  duration: number;
}) {
  return (
    dispatch: ThunkDispatch<State, void, AnyAction>,
    getState: () => State
  ) => {
    dispatch(onMentorAnswerPlaybackStarted(video.mentor, video.duration)); // must go first to apply duration to mentordata in state
    const curState = getState();
    const mentorData = curState.mentorsById[video.mentor];
    if (!mentorData) {
      console.warn(
        `on mentorAnswerPlaybackStarted no mentor found for id '${video.mentor}`
      );
      return;
    }
    sendCmi5Statement({
      verb: {
        id: "https://mentorpal.org/xapi/verb/answer-playback-started",
        display: {
          "en-US": "answer-playback-started",
        },
      },
      result: {
        extensions: {
          "https://mentorpal.org/xapi/verb/answer-playback-started": toXapiResultExt(
            mentorData,
            curState
          ),
        },
      },
    });
  };
}

export const selectMentor = (
  mentor: string,
  reason: MentorSelectReason,
  setFav = false
) => (dispatch: ThunkDispatch<State, void, MentorSelectedAction>) => {
  clearNextMentorTimer();
  return dispatch({
    payload: {
      id: mentor,
      reason,
      setFav,
    },
    type: MENTOR_SELECTED,
  });
};

export const selectTopic = (topic: any) => ({
  topic,
  type: TOPIC_SELECTED,
});

export const faveMentor = (mentor_id: any) => ({
  id: mentor_id,
  type: MENTOR_FAVED,
});

export const setGuestName = (name: string) => ({
  name,
  type: GUEST_NAME_SET,
});

const currentQuestionIndex = (state: { questionsAsked: { length: any } }) =>
  Array.isArray(state.questionsAsked) ? state.questionsAsked.length : -1;

export const sendQuestion = (q: {
  question: string;
  source: MentorQuestionSource;
  config: Config;
}) => async (
  dispatch: ThunkDispatch<State, void, AnyAction>,
  getState: () => State
) => {
  if (Cmi5.isCmiAvailable && Cmi5.instance.isAuthenticated) {
    sendCmi5Statement({
      verb: {
        id: "https://mentorpal.org/xapi/verb/asked",
        display: {
          "en-US": "asked",
        },
      },
      result: {
        extensions: {
          "https://mentorpal.org/xapi/verb/asked": {
            questionIndex: currentQuestionIndex(getState()) + 1,
            text: q.question,
            source: q.source,
          },
        },
      },
    });
  }
  clearNextMentorTimer();
  dispatch(onQuestionSent(q));
  const state = getState();
  const mentorIds = Object.keys(state.mentorsById);
  const tick = Date.now();
  // query all the mentors without waiting for the answers one by one
  const promises = mentorIds.map((mentor) => {
    return new Promise<QuestionResponse>((resolve, reject) => {
      queryMentor(mentor, q.question, q.config)
        .then((r) => {
          const { data } = r;
          const response: QuestionResponse = {
            answerId: data.answer_id,
            answerText: data.answer_text,
            answerClassifier: data.classifier,
            answerConfidence: data.confidence,
            answerIsOffTopic: data.confidence <= RESPONSE_CUTOFF,
            answerFeedbackId: data.feedback_id,
            answerResponseTimeSecs: Number(Date.now() - tick) / 1000,
            mentor,
            question: q.question,
            questionSource: q.source,
            status: MentorQuestionStatus.ANSWERED,
          };
          sendCmi5Statement({
            verb: {
              id: "https://mentorpal.org/xapi/verb/answered",
              display: {
                "en-US": "answered",
              },
            },
            result: {
              extensions: {
                "https://mentorpal.org/xapi/verb/answered": {
                  ...response,
                  questionIndex: currentQuestionIndex(getState()),
                },
              },
            },
          });
          dispatch(onQuestionAnswered(response));
          resolve(response);
        })
        .catch((err: any) => {
          dispatch(onQuestionError(mentor, q.question));
          reject(err);
        });
    });
  });
  // ...but still don't move forward till we have all the answers,
  // because we will prefer the user's fav and then highest confidence
  const responses = (
    await Promise.all<QuestionResponse>(promises.map((p) => p.catch((e) => e)))
  ).filter((r) => !(r instanceof Error));
  if (responses.length === 0) {
    return;
  }
  // Play favored mentor if an answer exists
  if (state.mentorFaved) {
    const favResponse = responses.find((response) => {
      return response.mentor === state.mentorFaved;
    });
    if (favResponse && !favResponse.answerIsOffTopic) {
      dispatch(selectMentor(state.mentorFaved, MentorSelectReason.USER_FAV));
      return;
    }
  }
  // Otherwise play mentor with highest confidence answer
  responses.sort((a, b) => (a.answerConfidence > b.answerConfidence ? -1 : 1));
  if (responses[0].answerIsOffTopic) {
    dispatch(
      selectMentor(
        state.mentorFaved ? state.mentorFaved : state.curMentor,
        state.mentorFaved
          ? MentorSelectReason.OFF_TOPIC_FAV
          : MentorSelectReason.OFF_TOPIC_CUR
      )
    );
    return;
  }
  dispatch(
    selectMentor(responses[0].mentor, MentorSelectReason.HIGHEST_CONFIDENCE)
  );
};

const NEXT_MENTOR_DELAY = 3000;
let timer: NodeJS.Timer | null;
export const answerFinished = () => (
  dispatch: ThunkDispatch<State, void, AnyAction>,
  getState: () => State
) => {
  dispatch(onIdle());
  // order mentors by highest answer confidence
  const state = getState();
  const mentors = state.mentorsById;
  const responses: {
    confidence: number;
    id: string;
    is_off_topic: boolean;
    status: MentorQuestionStatus;
  }[] = [];
  Object.keys(mentors).forEach((id) => {
    responses.push({
      confidence: mentors[id].confidence || -1.0,
      id: mentors[id].mentor._id,
      is_off_topic: mentors[id].is_off_topic || false,
      status: mentors[id].status,
    });
  });
  responses.sort((a, b) => (a.confidence > b.confidence ? -1 : 1));
  // get the most confident answer that has not been given
  const mentorNext = responses.find((response) => {
    return (
      response.status === MentorQuestionStatus.READY && !response.is_off_topic
    );
  });
  // set the next mentor to start playing, if there is one
  if (!mentorNext) {
    return;
  }
  dispatch(nextMentor(mentorNext.id));
  // play the next mentor after the timeout
  clearNextMentorTimer();
  timer = setTimeout(() => {
    dispatch(selectMentor(mentorNext.id, MentorSelectReason.NEXT_READY));
  }, NEXT_MENTOR_DELAY);
};

function clearNextMentorTimer(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export const userInputChanged: ActionCreator<
  ThunkAction<AnyAction, State, void, QuestionInputChangedAction>
> = (userInput: String) => (dispatch: Dispatch) => {
  clearNextMentorTimer();
  return dispatch({
    type: QUESTION_INPUT_CHANGED,
    payload: userInput,
  });
};

const onMentorAnswerPlaybackStarted = (
  mentor: string,
  duration: number
): MentorAnswerPlaybackStartedAction => ({
  type: MENTOR_ANSWER_PLAYBACK_STARTED,
  payload: {
    mentor,
    duration,
  },
});

const onQuestionSent = (payload: {
  question: string;
  source: MentorQuestionSource;
}): QuestionSentAction => ({
  payload,
  type: QUESTION_SENT,
});

function onQuestionAnswered(response: QuestionResponse) {
  return {
    mentor: response,
    type: QUESTION_ANSWERED,
  };
}

const onQuestionError = (id: string, question: string) => ({
  mentor: id,
  question,
  type: QUESTION_ERROR,
});

const onIdle = () => ({
  type: ANSWER_FINISHED,
});

const nextMentor = (id: string): NextMentorAction => ({
  mentor: id,
  type: MENTOR_NEXT,
});
