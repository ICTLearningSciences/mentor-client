/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { normalizeString } from "utils";
import {
  ChatQuestionVisibilitySetAction,
  ChatQuestionsVisibilityShowAllAction,
  CHAT_QUESTION_VISIBILITY_SET,
  CHAT_QUESTION_VISIBILITY_SHOW_ALL,
  ANSWER_FINISHED,
  FEEDBACK_SEND_SUCCEEDED,
  FEEDBACK_SENT,
  MENTOR_FAVED,
  MENTOR_ANSWER_PLAYBACK_STARTED,
  MENTOR_NEXT,
  MENTOR_SELECTED,
  QUESTION_ANSWERED,
  QUESTION_ERROR,
  QUESTION_INPUT_CHANGED,
  QUESTION_SENT,
  TOPIC_SELECTED,
  MentorClientAction,
  MentorSelectedAction,
  MentorAnswerPlaybackStartedAction,
  QuestionSentAction,
  GUEST_NAME_SET,
  ConfigLoadSucceededAction,
  CONFIG_LOAD_FAILED,
  CONFIG_LOAD_STARTED,
  CONFIG_LOAD_SUCCEEDED,
  MentorsLoadRequestedAction,
  MENTORS_LOAD_REQUESTED,
  QuestionInputChangedAction,
  NextMentorAction,
  MentorFavedAction,
  MentorsLoadResultAction,
  TopicSelectedAction,
  MENTORS_LOAD_RESULT,
  QuestionAnsweredAction,
  FeedbackSentAction,
  FEEDBACK_SEND_FAILED,
  FeedbackSendSucceededAction,
  FeedbackSendFailedAction,
} from "./actions";
import {
  MentorState,
  MentorQuestionSource,
  MentorQuestionStatus,
  State,
  MentorSelectReason,
  LoadStatus,
  MentorType,
  Feedback,
} from "../types";

export const initialState: State = {
  chat: {
    messages: [],
    showAllAnswers: false,
  },
  config: {
    cmi5Enabled: false,
    cmi5Endpoint: process.env.CMI5_ENDPOINT || "/lrs/xapi",
    cmi5Fetch: process.env.CMI5_FETCH || "/lrs/auth/guesttoken",
    mentorsDefault: [],
    urlGraphql: process.env.MENTOR_GRAPHQL_URL || "/graphql",
    urlClassifier: process.env.MENTOR_API_URL || "/classifier",
    urlVideo: process.env.MENTOR_VIDEO_URL || "/videos",
    styleHeaderLogo: process.env.HEADER_LOGO || "",
    styleHeaderColor: process.env.HEADER_COLOR || "",
    styleHeaderTextColor: process.env.HEADER_TEXT_COLOR || "",
    disclaimerTitle: process.env.DISCLAIMER_TITLE || "",
    disclaimerText: process.env.DISCLAIMER_TEXT || "",
    disclaimerDisabled:
      process.env.DISCLAIMER_DISABLED?.toLowerCase() === "true" || true,
  },
  configLoadStatus: LoadStatus.NONE,
  guestName: "",
  curMentor: "", // id of selected mentor
  curMentorReason: MentorSelectReason.NONE,
  curQuestion: "", // question that was last asked
  curQuestionSource: MentorQuestionSource.NONE,
  curTopic: "", // topic to show questions for
  mentorFaved: "", // id of the preferred mentor
  isIdle: false,
  mentorsById: {},
  mentorNext: "", // id of the next mentor to speak after the current finishes
  recommendedQuestions: [],
  questionsAsked: [],
  questionInput: {
    question: "",
    source: MentorQuestionSource.NONE,
  },
};

function mentorSelected(state: State, action: MentorSelectedAction): State {
  const mentorId = action.payload.id;
  return onMentorNext({
    ...(action.payload.setFav
      ? mentorFaved(state, { type: MENTOR_FAVED, id: action.payload.id })
      : state),
    curMentor: action.payload.id,
    curMentorReason: action.payload.reason,
    isIdle: false,
    mentorsById: {
      ...state.mentorsById,
      [mentorId]: {
        ...state.mentorsById[mentorId],
        status: MentorQuestionStatus.ANSWERED,
      },
    },
  });
}

function mentorFaved(state: State, action: MentorFavedAction): State {
  return {
    ...state,
    mentorFaved: state.mentorFaved === action.id ? "" : action.id,
  };
}

function feedbackUpdate(
  state: State,
  feedbackId: string,
  feedback: Feedback,
  inProgress: boolean
): State {
  return {
    ...state,
    chat: {
      ...state.chat,
      messages: state.chat.messages.map((m) => {
        return m.feedbackId === feedbackId
          ? {
              ...m,
              isFeedbackSendInProgress: inProgress,
              feedback: feedback,
            }
          : m;
      }),
    },
  };
}

function onFeedbackSent(state: State, action: FeedbackSentAction): State {
  return feedbackUpdate(
    state,
    action.payload.feedbackId,
    action.payload.feedback,
    true
  );
}

function onFeedbackSendSucceeded(
  state: State,
  action: FeedbackSendSucceededAction
): State {
  return feedbackUpdate(
    state,
    action.payload.feedbackId,
    action.payload.feedback,
    true
  );
}

function onFeedbackSendFailed(
  state: State,
  action: FeedbackSendFailedAction
): State {
  return feedbackUpdate(
    state,
    action.payload.feedbackId,
    action.payload.feedback,
    false
  );
}

function onMentorAnswerPlaybackStarted(
  state: State,
  action: MentorAnswerPlaybackStartedAction
): State {
  const mentorData = state.mentorsById[action.payload.mentor];
  if (!mentorData) {
    return state;
  }
  return {
    ...state,
    mentorsById: {
      ...state.mentorsById,
      [action.payload.mentor]: {
        ...state.mentorsById[action.payload.mentor],
        answerDuration: Number(action.payload.duration),
      },
    },
  };
}

function onMentorsLoadRequested(
  state: State,
  action: MentorsLoadRequestedAction
): State {
  const mentorsById = action.payload.mentors.reduce<{
    [mentorId: string]: MentorState;
  }>((mentorsByIdAcc, mentorId) => {
    mentorsByIdAcc[mentorId] = {
      mentor: {
        _id: mentorId,
        name: "",
        title: "",
        mentorType: MentorType.VIDEO,
        topics: [],
        subjects: [],
        questions: [],
        utterances: [],
      },
      topic_questions: [],
      status: MentorQuestionStatus.NONE,
      answerDuration: Number.NaN,
      answer_media: [],
    };
    return mentorsByIdAcc;
  }, {});
  Object.getOwnPropertyNames(state.mentorsById).forEach((id) => {
    mentorsById[id] = state.mentorsById[id];
  });
  return {
    ...state,
    mentorsById: mentorsById,
    recommendedQuestions: action.payload.recommendedQuestions || [],
  };
}

function onMentorLoadResults(
  state: State,
  action: MentorsLoadResultAction
): State {
  let s = {
    ...state,
    mentorsById: Object.getOwnPropertyNames(action.payload.mentorsById).reduce(
      (acc: Record<string, MentorState>, mid: string) => {
        acc[mid] = {
          ...state.mentorsById[mid],
          ...(action.payload.mentorsById[mid]?.data || {}),
          status: MentorQuestionStatus.READY,
        };
        return acc;
      },
      {} as Record<string, MentorState>
    ),
  };
  if (action.payload.mentor) {
    s = mentorSelected(s, {
      type: MENTOR_SELECTED,
      payload: {
        id: action.payload.mentor,
        reason: MentorSelectReason.NEXT_READY,
      },
    });
  }
  if (action.payload.topic) {
    s = topicSelected(s, {
      type: TOPIC_SELECTED,
      topic: action.payload.topic,
    });
  }
  return s;
}

function onQuestionSent(state: State, action: QuestionSentAction): State {
  return onMentorNext(
    onQuestionInputChanged(
      {
        ...state,
        chat: {
          ...state.chat,
          messages: [
            ...state.chat.messages,
            {
              name: "",
              color: "",
              mentorId: "",
              isUser: true,
              text: action.payload.question,
              feedback: Feedback.NONE,
              feedbackId: "",
              isFeedbackSendInProgress: false,
              visibility: false,
              chatQuestionId: state.questionsAsked.length + 1,
            },
          ],
          showAllAnswers: true,
        },
        curQuestion: action.payload.question,
        curQuestionSource: action.payload.source,
        curQuestionUpdatedAt: new Date(Date.now()),
        questionsAsked: Array.from(
          new Set([
            ...state.questionsAsked,
            normalizeString(action.payload.question),
          ])
        ),
      },
      {
        type: QUESTION_INPUT_CHANGED,
        payload: {
          question: "",
          source: MentorQuestionSource.NONE,
        },
      }
    )
  );
}

function onConfigLoadStarted(state: State): State {
  return {
    ...state,
    configLoadStatus: LoadStatus.LOAD_IN_PROGRESS,
  };
}

function onConfigLoadFailed(state: State): State {
  return {
    ...state,
    configLoadStatus: LoadStatus.LOAD_FAILED,
  };
}

function onConfigLoadSucceeded(
  state: State,
  action: ConfigLoadSucceededAction
): State {
  return {
    ...state,
    config: action.payload,
    configLoadStatus: LoadStatus.LOADED,
  };
}

function onMentorNext(
  state: State,
  action: NextMentorAction | undefined = undefined
): State {
  return {
    ...state,
    mentorNext: action ? action.mentor : "",
  };
}

function onQuestionInputChanged(
  state: State,
  action: QuestionInputChangedAction
): State {
  return onMentorNext({
    ...state,
    questionInput: action.payload,
  });
}

function onQuestionAnswered(
  state: State,
  action: QuestionAnsweredAction
): State {
  // NOTE: about answerFeedbackId
  // It seems like the answerFeedbackId should be
  // associated to the chat message
  const response = action.mentor;
  const mentor: MentorState = {
    ...state.mentorsById[response.mentor],
    // we need chat messages to live up here
    answer_id: response.answerId,
    answer_text: response.answerText,
    answer_media: response.answerMedia,
    answerReceivedAt: new Date(Date.now()),
    answerFeedbackId: response.answerFeedbackId,
    classifier: response.answerClassifier,
    confidence: response.answerConfidence,
    is_off_topic: response.answerIsOffTopic,
    question: response.question,
    response_time: response.answerResponseTimeSecs,
    status: MentorQuestionStatus.READY,
  };
  const history = mentor.topic_questions.length - 1;
  if (!mentor.topic_questions[history].questions.includes(response.question)) {
    mentor.topic_questions[history].questions.push(response.question);
  }

  return {
    ...state,
    chat: {
      ...state.chat,
      messages: [
        ...state.chat.messages,
        {
          name: "",
          color: "",
          mentorId: action.mentor.mentor,
          isUser: false,
          text: action.mentor.answerText,
          feedback: Feedback.NONE,
          feedbackId: action.mentor.answerFeedbackId,
          isFeedbackSendInProgress: false,
          visibility: false,
          chatQuestionId: state.questionsAsked.length,
        },
      ],
      showAllAnswers: true,
    },

    isIdle: false,
    mentorsById: {
      ...state.mentorsById,
      [response.mentor]: mentor,
    },
  };
}

function onChatAnswerVisibiltyShowQuestion(
  state: State,
  action: ChatQuestionVisibilitySetAction
): State {
  return {
    ...state,
    chat: {
      ...state.chat,
      messages: state.chat.messages.map((m, i) => {
        return action.payload.indexes.includes(i)
          ? {
              ...m,
              visibility: action.payload.newVisibility,
            }
          : m;
      }),
    },
  };
}

function onChatAnwerVisibilityShowAll(
  state: State,
  action: ChatQuestionsVisibilityShowAllAction
): State {
  return {
    ...state,
    chat: {
      ...state.chat,
      messages: state.chat.messages.map((m) => {
        return {
          ...m,
          visibility: !action.payload.newValue,
        };
      }),
      showAllAnswers: !action.payload.newValue,
    },
  };
}

function topicSelected(state: State, action: TopicSelectedAction): State {
  return {
    ...state,
    curTopic: action.topic,
  };
}

export default function reducer(
  state = initialState,
  action: MentorClientAction
): State {
  switch (action.type) {
    case CONFIG_LOAD_FAILED:
      return onConfigLoadFailed(state);
    case CONFIG_LOAD_STARTED:
      return onConfigLoadStarted(state);
    case CONFIG_LOAD_SUCCEEDED:
      return onConfigLoadSucceeded(state, action);
    case FEEDBACK_SEND_FAILED:
      return onFeedbackSendFailed(state, action);
    case FEEDBACK_SEND_SUCCEEDED:
      return onFeedbackSendSucceeded(state, action);
    case FEEDBACK_SENT:
      return onFeedbackSent(state, action);
    case MENTOR_ANSWER_PLAYBACK_STARTED:
      return onMentorAnswerPlaybackStarted(state, action);
    case MENTORS_LOAD_REQUESTED:
      return onMentorsLoadRequested(state, action);
    case MENTORS_LOAD_RESULT:
      return onMentorLoadResults(state, action);
    case MENTOR_SELECTED:
      return mentorSelected(state, action);
    case MENTOR_FAVED:
      return mentorFaved(state, action);
    case MENTOR_NEXT:
      return onMentorNext(state, action);
    case QUESTION_SENT:
      return onQuestionSent(state, action);
    case QUESTION_ANSWERED:
      return onQuestionAnswered(state, action);
    case CHAT_QUESTION_VISIBILITY_SET:
      return onChatAnswerVisibiltyShowQuestion(state, action);
    case CHAT_QUESTION_VISIBILITY_SHOW_ALL:
      return onChatAnwerVisibilityShowAll(state, action);
    case QUESTION_ERROR:
      return {
        ...state,
        mentorsById: {
          ...state.mentorsById,
          [action.mentor]: {
            ...state.mentorsById[action.mentor],
            answerReceivedAt: new Date(Date.now()),
            question: action.question,
            status: MentorQuestionStatus.ERROR,
          },
        },
      };
    case ANSWER_FINISHED:
      return {
        ...state,
        isIdle: true,
      };
    case TOPIC_SELECTED:
      return topicSelected(state, action);
    case GUEST_NAME_SET:
      return {
        ...state,
        guestName: action.name,
      };
    case QUESTION_INPUT_CHANGED:
      return onQuestionInputChanged(state, action);
    default:
      return state;
  }
}
