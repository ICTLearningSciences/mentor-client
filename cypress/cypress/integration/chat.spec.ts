/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { mockConfig } from "../support/helpers";
import { mockDefaultSetup, MODE_CHAT, MODE_VIDEO } from "../support/helpers.ts";

describe("Chat", () => {
  it("does not show if config.modeDefault is video", () => {
    mockDefaultSetup(cy, {
      mentorsDefault: ["clint"],
      modeDefault: MODE_VIDEO,
    });
    cy.visit("/");
    cy.get("#video-container").should("exist");
    cy.get("#chat-thread").should("not.exist");
  });

  it("replaces video config.modeDefault is chat", () => {
    mockDefaultSetup(cy, { mentorsDefault: ["clint"], modeDefault: MODE_CHAT });
    cy.viewport("iphone-x");
    cy.visit("/");
    cy.get("#chat-thread").should("exist");
    cy.get("#video-container").should("not.exist");
    cy.get("#chat-msg-0").contains(
      "My name is EMC Clint Anderson. I was born in California and I have lived there most of my life. I graduated from Paramount and a couple of years after I finished high school, I joined the US Navy. I was an Electrician's Mate. I served on an aircraft carrier for eight years and then afterwards, I went to the United States Navy Reserve. During that time I started going to school with some of the abundant benefits that the military reserve has given me and I started working with various companies."
    );
    cy.get("#input-field").type("how old are you");
    cy.get("#input-send").trigger("mouseover").click();
    cy.get("#chat-msg-1").contains("how old are you");
    cy.get("#chat-msg-2").contains("I'm thirty seven years old.");
  });

  it("can open external links in chat with markdown", () => {
    cy.intercept("**/mentors/clint/data", { fixture: "clint.json" });
    cy.intercept("**/questions/?mentor=*&query=*", {
      fixture: "clint_response_with_markdown.json",
    });
    mockConfig(cy, {
      cmi5Enabled: false,
      mentorsDefault: ["clint"],
      modeDefault: MODE_CHAT,
    });
    cy.viewport("iphone-x");
    cy.visit("/");
    cy.get("#chat-thread").should("exist");
    cy.get("#input-field").type("test");
    cy.get("#input-send").trigger("mouseover").click();
    cy.get("#chat-msg-2").contains("Click here");
    cy.get("#chat-msg-2 a").should(
      "have.attr",
      "href",
      "https://www.google.com"
    );
    cy.get("#chat-msg-2 a").should("have.attr", "target", "_blank");
  });

  it.only("can give feedback on classifier answer", () => {
    cy.intercept("**/mentors/clint/data", { fixture: "clint.json" });
    cy.intercept("**/questions/?mentor=*&query=*", {
      fixture: "clint_response_with_feedback.json",
    });
    mockConfig(cy, {
      cmi5Enabled: false,
      mentorsDefault: ["clint"],
      modeDefault: MODE_CHAT,
    });
    cy.viewport("iphone-x");
    cy.visit("/");
    cy.get("#chat-thread").should("exist");
    cy.get("#input-field").type("test");
    cy.get("#input-send").trigger("mouseover").click();
    cy.get("#chat-msg-2").contains("Give me feedback");
    cy.get("#chat-msg-2 #feedback-btn #neutral").should("exist");
    cy.get("#chat-msg-2 #feedback-btn").trigger("mouseover").click();
  })
});
