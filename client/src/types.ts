/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/

export interface ChatData {
  lastQuestionAt?: Date;
  lastAnswerAt?: Date;
  messages: ChatMsg[];
  showAllAnswers: boolean;
  lastChatAnswerId: number;
}

export interface ChatMsg {
  // we should change name, color, and isUser to just mentorIds
  name: string;
  color: string;
  mentorId: string;
  isUser: boolean;
  text: string;
  feedback: Feedback;
  feedbackId: string;
  isFeedbackSendInProgress: boolean;
  visibility: boolean;
  chatAnswerId: number;
  clicked: boolean;
}

export interface Mentor {
  _id: string;
  name: string;
  title: string;
  mentorType: MentorType;
  defaultSubject?: Subject;
  subjects: Subject[];
  topics: Topic[];
  questions: SubjectQuestion[];
  utterances: Answer[];
}

export interface Subject {
  _id: string;
  topics: Topic[];
  questions: SubjectQuestion[];
}

export interface Topic {
  id: string;
  name: string;
}

export interface SubjectQuestion {
  question: Question;
  topics: Topic[];
}

export interface Question {
  question: string;
  type: QuestionType;
  name: UtteranceName;
}

export interface Answer {
  _id: string;
  question: Question;
  transcript: string;
  media: Media[];
}

export interface Media {
  type: string;
  tag: string;
  url: string;
}

export interface QuestionApiData {
  query: string;
  answer_id: string;
  answer_text: string;
  answer_media: Media[];
  confidence: number;
  feedback_id: string;
  classifier: string;
}

export interface Config {
  cmi5Enabled: boolean;
  cmi5Endpoint: string;
  cmi5Fetch: string;
  mentorsDefault: string[];
  urlClassifier: string;
  urlGraphql: string;
  urlVideo: string;
  styleHeaderLogo: string;
  styleHeaderColor: string;
  styleHeaderTextColor: string;
  disclaimerTitle: string;
  disclaimerText: string;
  disclaimerDisabled: boolean;
}

export enum QuestionType {
  UTTERANCE = "UTTERANCE",
  QUESTION = "QUESTION",
}

export enum Status {
  INCOMPLETE = "INCOMPLETE",
  COMPLETE = "COMPLETE",
}

export enum UtteranceName {
  IDLE = "_IDLE_",
  INTRO = "_INTRO_",
  OFF_TOPIC = "_OFF_TOPIC_",
  PROMPT = "_PROMPT_",
  FEEDBACK = "_FEEDBACK_",
  REPEAT = "_REPEAT_",
  REPEAT_BUMP = "_REPEAT_BUMP_",
  PROFANIY = "_PROFANITY_",
}

export enum MentorType {
  VIDEO = "VIDEO",
  CHAT = "CHAT",
}

export enum Feedback {
  NONE = "NONE",
  GOOD = "GOOD",
  BAD = "BAD",
  NEUTRAL = "NEUTRAL",
}

export enum LoadStatus {
  NONE = "NONE",
  LOAD_IN_PROGRESS = "LOAD_IN_PROGRESS",
  LOADED = "LOADED",
  LOAD_FAILED = "LOAD_FAILED",
}

export enum MentorQuestionStatus {
  NONE = "NONE",
  ANSWERED = "ANSWERED",
  ERROR = "ERROR",
  READY = "READY",
}

export enum MentorQuestionSource {
  NONE = "NONE",
  USER = "USER",
  TOPIC_LIST = "TOPIC_LIST",
}

export enum MentorSelectReason {
  HIGHEST_CONFIDENCE = "HIGHEST_CONFIDENCE",
  NEXT_READY = "NEXT_READY",
  NONE = "NONE",
  OFF_TOPIC_CUR = "OFF_TOPIC_CUR",
  OFF_TOPIC_FAV = "OFF_TOPIC_FAV",
  USER_FAV = "USER_FAV",
  USER_SELECT = "USER_SELECT",
}

export enum ResultStatus {
  NONE = "NONE",
  IN_PROGRESS = "IN_PROGRESS",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  REMOVED = "REMOVED",
}

export interface MentorSelection {
  id: string;
  reason: MentorSelectReason;
  setFav?: boolean;
}

export interface TopicQuestions {
  topic: string;
  questions: string[];
}

export interface MentorState {
  mentor: Mentor;
  topic_questions: TopicQuestions[];
  status: MentorQuestionStatus;
  answerDuration: number;

  answer_id?: string;
  answer_text?: string;
  answer_media: Media[];
  answerReceivedAt?: Date;
  answerFeedbackId?: string;
  classifier?: string;
  confidence?: number;
  is_off_topic?: boolean;
  question?: string;
  response_time?: number;
}

export interface MentorDataResult {
  data?: MentorState;
  status: ResultStatus;
}

export interface MentorsLoadRequest {
  guestName?: string;
  mentors: string[];
  recommendedQuestions?: string[];
}

export interface MentorsLoadResult {
  mentorsById: Record<string, MentorDataResult>;
  mentor?: string;
  topic?: string;
}

export interface QuestionResult {
  status: ResultStatus;
}

export interface State {
  chat: ChatData;
  config: Config;
  configLoadStatus: LoadStatus;
  curMentor: string; // id of selected mentor
  curMentorReason: MentorSelectReason;
  curQuestion: string; // question that was last asked
  curQuestionSource: MentorQuestionSource;
  curQuestionUpdatedAt?: Date;
  curTopic: string; // topic to show questions for
  mentorFaved: string; // id of the preferred mentor
  isIdle: boolean;
  mentorsById: Record<string, MentorState>;
  mentorNext: string; // id of the next mentor to speak after the current finishes
  guestName: string;
  questionsAsked: string[];
  recommendedQuestions: string[];
  questionInput: QuestionInput;
}

export interface QuestionInput {
  question: string;
  source: MentorQuestionSource;
}

export interface QuestionResponse {
  answerId: string;
  answerText: string;
  answerMedia: Media[];
  answerClassifier: string;
  answerConfidence: number;
  answerIsOffTopic: boolean;
  answerResponseTimeSecs: number;
  answerFeedbackId: string;
  mentor: string;
  question: string;
  questionSource: MentorQuestionSource;
  status: MentorQuestionStatus;
}

export interface XapiResultMentorAnswerStatus {
  answerId: string;
  mentor: string;
  status: MentorQuestionStatus;
  confidence: number;
  isOffTopic: boolean;
  responseTimeSecs: number;
}

export interface XapiResultAnswerStatusByMentorId {
  [mentor: string]: XapiResultMentorAnswerStatus;
}

export interface XapiResultExt {
  answerClassifier: string;
  answerConfidence: number;
  answerDuration: number;
  answerId: string;
  answerIsOffTopic: boolean;
  answerResponseTimeSecs: number;
  answerStatusByMentor: XapiResultAnswerStatusByMentorId;
  answerText: string;
  mentorCur: string;
  mentorCurIsFav: boolean;
  mentorCurReason: MentorSelectReason;
  mentorCurStatus: MentorQuestionStatus;
  mentorFaved: string;
  mentorNext: string;
  mentorTopicDisplayed: string;
  question: string;
  questionIndex: number;
  questionSource: MentorQuestionSource;
  questionsAsked: string[];
  timestampAsked?: Date;
  timestampAnswered?: Date;
}
