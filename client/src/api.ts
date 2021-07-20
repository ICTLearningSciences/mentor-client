/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import axios, { AxiosResponse } from "axios";
import {
  Answer,
  Config,
  Media,
  Mentor,
  QuestionApiData,
  Status,
  UtteranceName,
} from "types";

export const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || "/graphql";
export async function fetchConfig(graphqlUrl = "/graphql"): Promise<Config> {
  const gqlRes = await axios.post<GraphQLResponse<{ config: Config }>>(
    graphqlUrl,
    {
      query: `
      query FetchConfig {
        config {
          cmi5Enabled
          cmi5Endpoint
          cmi5Fetch
          mentorsDefault
          urlClassifier
          urlGraphql
          urlVideo
          disclaimerTitle
          disclaimerText
          disclaimerDisabled
          styleHeaderColor
          styleHeaderTextColor
          styleHeaderLogo
        }
      }
    `,
    }
  );
  if (gqlRes.status !== 200) {
    throw new Error(`config load failed: ${gqlRes.statusText}}`);
  }
  if (gqlRes.data.errors) {
    throw new Error(
      `errors reponse to config query: ${JSON.stringify(gqlRes.data.errors)}`
    );
  }
  if (!gqlRes.data.data) {
    throw new Error(
      `no data in non-error reponse: ${JSON.stringify(gqlRes.data)}`
    );
  }
  return gqlRes.data.data.config;
}

export function getUtterance(
  mentor: Mentor,
  utterance: UtteranceName
): Answer | undefined {
  if (!(mentor && Array.isArray(mentor.utterances))) {
    return undefined;
  }
  return mentor.utterances.find((a) => a.question.name === utterance);
}

export function videoUrl(media: Media[], tag?: string): string {
  if (!media) {
    return "";
  }
  return (
    media.find((m) => m.type === "video" && m.tag === (tag || "web"))?.url || ""
  );
}

export function idleUrl(mentor: Mentor, tag?: string): string {
  const idle = getUtterance(mentor, UtteranceName.IDLE);
  return idle ? videoUrl(idle.media, tag) : "";
}

export function subtitleUrl(media: Media[], tag?: string): string {
  if (!media) {
    return "";
  }
  return (
    media.find((m) => m.type === "subtitles" && m.tag === (tag || "en"))?.url ||
    ""
  );
}

interface MentorQueryData {
  mentor: Mentor;
}

interface GraphQLResponse<T> {
  errors?: { message: string }[];
  data?: T;
}

export async function fetchMentorByAccessToken(
  accessToken: string
): Promise<Mentor> {
  const headers = { Authorization: `bearer ${accessToken}` };
  const result = await axios.post(
    GRAPHQL_ENDPOINT,
    {
      query: `
      query {
        me {
          mentor {
            _id  
            }
          }
        }
    `,
    },
    { headers: headers }
  );
  return result.data.data.me.mentor;
}

export async function fetchMentor(
  config: Config,
  mentorId: string
): Promise<AxiosResponse<GraphQLResponse<MentorQueryData>>> {
  return await axios.post<GraphQLResponse<MentorQueryData>>(config.urlGraphql, {
    query: `
      query FetchMentor($id: ID!, $status: String!){
        mentor(id: $id) {
          _id
          name
          firstName
          title
          mentorType
          defaultSubject {
            _id
          }
          subjects {
            _id
            topics {
              id
              name
            }
            questions {
              topics {
                id
              }
              question {
                question
                type
              }
            }
          }
          topics {
            id
            name
          }
          questions {
            topics {
              id
            }
            question {
              question
              type
            }
          }
          utterances(status: $status) {
            _id
            transcript
            question {
              name
            }
            media {
              type
              tag
              url
            }
          }
        }
      }
    `,
    variables: {
      id: mentorId,
      status: Status.COMPLETE,
    },
  });
}

interface GiveFeedbackResult {
  userQuestionSetFeedback: {
    _id: string;
  };
}

export async function giveFeedback(
  feedbackId: string,
  feedback: string,
  config: Config
): Promise<AxiosResponse<GraphQLResponse<GiveFeedbackResult>>> {
  return await axios.post(config.urlGraphql, {
    query: `
      mutation UserQuestionSetFeedback($id: ID!, $feedback: String!){
        userQuestionSetFeedback(id: $id, feedback: $feedback) {
          _id
        }
      }
    `,
    variables: {
      id: feedbackId,
      feedback: feedback,
    },
  });
}

export async function queryMentor(
  mentorId: string,
  question: string,
  config: Config
): Promise<AxiosResponse<QuestionApiData>> {
  return await axios.get(`${config.urlClassifier}/questions/`, {
    params: {
      mentor: mentorId,
      query: question,
    },
  });
}
