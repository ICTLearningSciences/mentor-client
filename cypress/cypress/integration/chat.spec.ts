/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { cyMockGQL } from "../support/helpers";
import { mockDefaultSetup } from "../support/helpers";

const clint = require("../fixtures/clint.json");
const covid = require("../fixtures/covid.json");
const logged = require("../fixtures/logged.json");

describe("Chat", () => {
  it("does not show if mentor type is video", () => {
    mockDefaultSetup(cy, {
      config: { mentorsDefault: ["clint"] },
      mentorData: [clint],
    });
    cy.visit("/");
    cy.get("[data-cy=video-container]").should("exist");
    cy.get("[data-cy=chat-thread]").should("not.exist");
  });

  it("replaces video if mentor type is chat", () => {
    mockDefaultSetup(cy, {
      config: { mentorsDefault: ["covid"] },
      mentorData: [covid],
    });
    cy.visit("/");
    cy.get("[data-cy=header]").contains("USC: COVID-19 FAQ Chat Bot");
    cy.get("[data-cy=topics]").contains("COVID-19 General Information");
    cy.get("[data-cy=scrolling-questions-list]").contains(
      "What are the symptoms of COVID-19?"
    );
    cy.get("[data-cy=chat-thread]").should("exist");
    cy.get("[data-cy=video-container]").should("not.exist");
    cy.get("[data-cy=chat-msg-0]").contains(
      "I am a COVID-19 chat bot, you can ask me about COVID-19."
    );
    cy.get("[data-cy=input-field]").type("how old are you");
    cy.get("[data-cy=input-send]").trigger("mouseover").click();
    cy.get("[data-cy=chat-msg-1]").contains("how old are you");
    cy.get("[data-cy=chat-msg-2]").contains("I'm thirty seven years old.");
  });

  it("shows users mentor if user is logged in admin", () => {
    mockDefaultSetup(cy, {
      config: { mentorsDefault: ["logged"] },
      mentorData: [logged],
    });
    cy.visit("/");
    cy.get("[data-cy=header]").contains("Ben Mai: j");
  });

  it("shows home icon if user is logged in admin", () => {
    mockDefaultSetup(cy, {
      config: { mentorsDefault: ["logged"] },
      mentorData: [logged],
    });
    cy.visit("/");
    cy.get("[data-cy=home-button]").should("exist");
  });

  it("can open external links in chat with markdown", () => {
    mockDefaultSetup(cy, {
      config: { mentorsDefault: ["covid"] },
      mentorData: [covid],
      apiResponse: "response_with_markdown.json",
    });
    cy.intercept("**/questions/?mentor=*&query=*", {
      fixture: "response_with_markdown.json",
    });
    cy.viewport("iphone-x");
    cy.visit("/");
    cy.get("[data-cy=chat-thread]").should("exist");
    cy.get("[data-cy=input-field]").type("test");
    cy.get("[data-cy=input-send]").trigger("mouseover").click();
    cy.get("[data-cy=chat-msg-2]").contains("Click here");
    cy.get("[data-cy=chat-msg-2] a").should(
      "have.attr",
      "href",
      "https://www.google.com"
    );
    cy.get("[data-cy=chat-msg-2] a").should("have.attr", "target", "_blank");
  });

  it("can give feedback on classifier answer", () => {
    mockDefaultSetup(cy, {
      config: { mentorsDefault: ["covid"] },
      mentorData: [covid],
      apiResponse: "response_with_feedback.json",
      gqlQueries: [cyMockGQL("userQuestionSetFeedback", null, false)],
    });
    cy.intercept("**/questions/?mentor=covid&query=*", {
      fixture: "response_with_feedback.json",
    });
    cy.viewport("iphone-x");
    cy.visit("/");
    cy.get("[data-cy=chat-thread]").should("exist");
    cy.get("[data-cy=input-field]").type("test");
    cy.get("[data-cy=input-send]").trigger("mouseover").click();
    cy.get("[data-cy=chat-msg-2]").contains("Give me feedback");
    cy.get(
      "[data-cy=chat-msg-2] [data-cy=feedback-btn] [data-cy=neutral]"
    ).should("exist");
    cy.get("[data-cy=chat-msg-2] [data-cy=feedback-btn]")
      .trigger("mouseover")
      .click();
    cy.get("[data-cy=click-good]");
    cy.get("[data-cy=click-neutral]");
    cy.get("[data-cy=click-bad]").trigger("mouseover").click();
    cy.get("[data-cy=chat-msg-2] [data-cy=feedback-btn] [data-cy=bad]").should(
      "exist"
    );
    cy.get(
      "[data-cy=chat-msg-2] [data-cy=feedback-btn] [data-cy=neutral]"
    ).should("not.exist");
  });

  it("send button is hidden and text input is disabled if canned mentor", () => {
    const testCovid = {
      ...covid,
      canned: true,
    };

    mockDefaultSetup(cy, {
      config: { mentorsDefault: ["covid"] },
      mentorData: [testCovid],
      apiResponse: "response_with_feedback.json",
      gqlQueries: [cyMockGQL("userQuestionSetFeedback", null, false)],
    });
    cy.intercept("**/questions/?mentor=covid&query=*", {
      fixture: "response_with_feedback.json",
    });
    cy.viewport("iphone-x");
    cy.visit("/");
    cy.get("[data-cy=chat-thread]").should("exist");
    cy.get("[data-cy=input-field]").within(($within) => {
      cy.get("textarea").should("be.disabled");
    });
    cy.get("[data-cy=input-send]").should("not.exist");
  });
});
