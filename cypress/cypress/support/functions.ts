/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
interface StaticResponse {
    /**
     * Serve a fixture as the response body.
     */
    fixture?: string;
    /**
     * Serve a static string/JSON object as the response body.
     */
    body?: string | object | object[];
    /**
     * HTTP headers to accompany the response.
     * @default {}
     */
    headers?: { [key: string]: string };
    /**
     * The HTTP status code to send.
     * @default 200
     */
    statusCode?: number;
    /**
     * If 'forceNetworkError' is truthy, Cypress will destroy the browser connection
     * and send no response. Useful for simulating a server that is not reachable.
     * Must not be set in combination with other options.
     */
    forceNetworkError?: boolean;
    /**
     * Milliseconds to delay before the response is sent.
     */
    delayMs?: number;
    /**
     * Kilobits per second to send 'body'.
     */
    throttleKbps?: number;
}

interface MockGraphQLQuery {
    query: string,
    data: any | any[],
    me: boolean
}

function staticResponse(s: StaticResponse): StaticResponse {
    return {
        ...{
            headers: {
                "access-control-allow-origin": window.location.origin,
                "Access-Control-Allow-Credentials": "true",
            },
            ...s,
        },
    };
}

export function cySetup(cy) {
    cy.server();
    cy.viewport(1280, 720);
}

export function cyInterceptGraphQL(cy, mocks: MockGraphQLQuery[]): void {
    const queryCalls: any = {}
    for (const mock of mocks) {
        queryCalls[mock.query] = 0;
    }
    cy.intercept('**/graphql', (req) => {
        const { body } = req;
        const queryBody = body.query.replace(/\s+/g, " ").replace("\n", "").trim();
        for (const mock of mocks) {
            if (queryBody.indexOf(`{ ${mock.query}(`) !== -1 || queryBody.indexOf(`{ ${mock.query} {`) !== -1) {
                const data = Array.isArray(mock.data) ? mock.data : [mock.data];
                const val = data[Math.min(queryCalls[mock.query], data.length - 1)];
                const body = {};
                if (mock.me) {
                    const _inner = {};
                    _inner[mock.query] = val;
                    body["me"] = _inner;
                } else {
                    body[mock.query] = val;
                }
                req.alias = mock.query;
                req.reply(staticResponse({
                    body: {
                        data: body,
                        errors: null,
                    }
                }));
                queryCalls[mock.query] = queryCalls[mock.query] + 1;
                break;
            }
        }
    });
}

export function cyMockGQL(query: string, data: any | any[], me = false): MockGraphQLQuery {
    return {
        query,
        data,
        me,
    }
}