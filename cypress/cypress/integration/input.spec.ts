/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import {
  mockDefaultSetup,
  visitAsGuestWithDefaultSetup,
} from "../support/helpers";

const clint = require("../fixtures/clint.json");
const carlos = require("../fixtures/carlos.json");
const julianne = require("../fixtures/julianne.json");

describe("Input field", () => {
  it("has a default placeholder message", () => {
    visitAsGuestWithDefaultSetup(cy, "/");
    cy.get("#input-field").should("have.attr", "placeholder", "Ask a question");
  });

  it("can be typed into", () => {
    visitAsGuestWithDefaultSetup(cy, "/");
    cy.get("#input-field").type("Hello");
    cy.get("#input-field").contains("Hello");
  });

  it("enables send button if not empty", () => {
    visitAsGuestWithDefaultSetup(cy, "/");
    cy.get("#input-field").type("Hello");
    cy.get("#input-send").should("not.be.disabled");
  });

  it("disables send button if empty", () => {
    visitAsGuestWithDefaultSetup(cy, "/");
    cy.get("#input-send").should("be.disabled");
    cy.get("#input-field").type("Hello").clear();
    cy.get("#input-send").should("be.disabled");
  });

  it("updates placeholder message to last question asked", () => {
    visitAsGuestWithDefaultSetup(cy, "/");
    cy.get("#input-field").type("Hello");
    cy.get("#input-send").trigger("mouseover").click();
    cy.get("#input-field")
      .should("have.attr", "placeholder")
      .should("contain", "Hello");

    cy.get("#input-field").type("Test");
    cy.get("#input-send").trigger("mouseover").click();
    cy.get("#input-field").should("have.attr", "placeholder", "Test");
  });

  it("clears text after sending input", () => {
    visitAsGuestWithDefaultSetup(cy, "/");
    cy.get("#input-field").type("Hello");
    cy.get("#input-send").trigger("mouseover").click();
    cy.get("#input-field").should("not.have.value", "Hello");
  });

  it("sends api call to get responses from mentors after sending input", () => {
    mockDefaultSetup(cy, { mentorData: [clint, carlos, julianne], noMockApi: true });
    cy.viewport("iphone-x");

    cy.intercept("**/questions/?mentor=clint&query=how+old+are+you", {
      fixture: "response.json",
    }).as("askClint");
    cy.intercept("**/questions/?mentor=julianne&query=how+old+are+you", {
      fixture: "response.json",
    }).as("askJulianne");
    cy.intercept("**/questions/?mentor=carlos&query=how+old+are+you", {
      fixture: "response.json",
    }).as("askCarlos");

    cy.get("#input-field").type("how old are you");
    cy.get("#input-send").trigger("mouseover").click();

    cy.wait(["@askClint", "@askJulianne", "@askCarlos"], {
      responseTimeout: 15000,
    });
    expect(true).to.equal(true);
  });
});
