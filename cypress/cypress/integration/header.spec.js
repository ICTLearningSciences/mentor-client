/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu

The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { addGuestParams, mockDefaultSetup, visitAsGuestWithDefaultSetup } from "../support/helpers";

describe("Header", () => {

    it("shows title for default mentor in panel", () => {
        visitAsGuestWithDefaultSetup(cy, "/");
        cy.get("#header").contains("Clinton Anderson: Nuclear Electrician's Mate");
    });

    it("changes title when selecting a mentor", () => {
        visitAsGuestWithDefaultSetup(cy, "/");
        cy.get("#video-thumbnail-dan").trigger('mouseover').click();
        cy.get("#header").contains(
            "Dan Davis: High Performance Computing Researcher"
        );

        cy.get("#video-thumbnail-carlos").trigger('mouseover').click();
        cy.get("#header").contains("Carlos Rios: Marine Logistician");

        cy.get("#video-thumbnail-julianne").trigger('mouseover').click();
        cy.get("#header").contains("Julianne Nordhagen: Student Naval Aviator");

        cy.get("#video-thumbnail-clint").trigger('mouseover').click();
        cy.get("#header").contains("Clinton Anderson: Nuclear Electrician's Mate");
    });

    it("shows title for a single mentor", () => {
        mockDefaultSetup(cy);
        cy.visit("/", {
            qs: addGuestParams({
                mentor: "clint"
            }),
        });
        cy.get("#header").contains("Clinton Anderson: Nuclear Electrician's Mate");
    });

    it("shows alternate header with logo if HEADER_LOGO env is set", () => {
        mockDefaultSetup(cy, { DISABLE_CMI5: true, DEFAULT_MENTORS: "clint", HEADER_LOGO: "https://identity.usc.edu/files/2019/01/PrimShield-Word_SmallUse_CardOnTrans.png" });
        cy.intercept("https://identity.usc.edu/files/2019/01/PrimShield-Word_SmallUse_CardOnTrans.png", { fixture: "uscheader.png" })
        cy.visit("/");
        cy.get("#header img")
            .should("have.attr", "src")
            .and("eq", "https://identity.usc.edu/files/2019/01/PrimShield-Word_SmallUse_CardOnTrans.png");
    });
});