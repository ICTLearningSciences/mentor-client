/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { visitAsGuestWithDefaultSetup } from "../support/helpers";

describe("History", () => {
    it("does not display in topics list if no questions have been asked", () => {
        visitAsGuestWithDefaultSetup(cy, "/");
        cy.get("#topics").should("not.have.value", "History");
    });

    it("displays in topics list if questions have been asked", () => {
        visitAsGuestWithDefaultSetup(cy, "/");
        cy.get("#input-field").type("Hello");
        cy.get("#input-send").trigger('mouseover').click();
        cy.get("#topics").contains("History");
    });

    it("displays questions that have been asked via input", () => {
        visitAsGuestWithDefaultSetup(cy, "/");
        cy.get("#input-field").type("Hello");
        cy.get("#input-send").trigger('mouseover').click();
        cy.get("#topic-8").trigger('mouseover').click();
        cy.get("#scrolling-questions-list").contains("Hello");
    });

    it("displays questions that have been asked via topic button", () => {
        visitAsGuestWithDefaultSetup(cy, "/");
        cy.get("#topic-0").trigger('mouseover').click();
        cy.get("#topic-0").trigger('mouseover').click();
        cy.get("#input-send").trigger('mouseover').click();
        cy.get("#topic-8").trigger('mouseover').click();
        cy.get("#scrolling-questions-list").contains("Where were you born?");
    });

    it("displays most recent questions at the top", () => {
        visitAsGuestWithDefaultSetup(cy, "/");
        cy.get("#input-field").type("Hello");
        cy.get("#input-send").trigger('mouseover').click();
        cy.get("#topic-8").trigger('mouseover').click();
        cy.get("#scrolling-questions-list").get("li").first().contains("Hello");
        cy.get("#input-field").type("World");
        cy.get("#input-send").trigger('mouseover').click();
        cy.get("#scrolling-questions-list").get("li").first().contains("World");
    });

    it("does not read duplicate questions", () => {
        visitAsGuestWithDefaultSetup(cy, "/");
        cy.get("#input-field").type("Hello");
        cy.get("#input-send").trigger('mouseover').click();
        cy.get("#topic-8").trigger('mouseover').click();
        cy.get("#scrolling-questions-list").contains("Hello");
        cy.get("#input-field").type("World");
        cy.get("#input-send").trigger('mouseover').click();
        cy.get("#scrolling-questions-list").contains("Hello");
        cy.get("#scrolling-questions-list").contains("World");
        cy.get("#scrolling-questions-list").find("li").should("have.length", 2);
        cy.get("#scrolling-questions-list").get("li").first().contains("World");
        cy.get("#input-field").type("Hello");
        cy.get("#input-send").trigger('mouseover').click();
        cy.get("#scrolling-questions-list").contains("Hello");
        cy.get("#scrolling-questions-list").contains("World");
        cy.get("#scrolling-questions-list").find("li").should("have.length", 2);
        cy.get("#scrolling-questions-list").get("li").first().contains("World");
    });
});