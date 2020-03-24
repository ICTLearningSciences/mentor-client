import { mockMentorData, toGuestUrl } from "./helpers";

describe("Mentor panel", () => {
  beforeEach(() => {
    cy.server();

    mockMentorData(cy);
  });

  it("shows if there is more than one mentor", () => {
    cy.visit(toGuestUrl("/?mentor=clint&mentor=dan"));
    cy.get("#video-panel");
  });

  it("is hidden if there is only one mentor", () => {
    cy.visit(toGuestUrl("/?mentor=clint"));
    cy.get("#video-panel").should("not.exist");
  });

  it("displays 4 default mentors if no mentors specified", () => {
    cy.visit("/");
    cy.get("#video-panel").get("#video-thumbnail-clint");
    cy.get("#video-panel").get("#video-thumbnail-dan");
    cy.get("#video-panel").get("#video-thumbnail-carlos");
    cy.get("#video-panel").get("#video-thumbnail-julianne");
  });

  it("loads and displays chosen mentors if mentors specified", () => {
    cy.visit(
      toGuestUrl("/?mentor=jd_thomas&mentor=mario-pais&mentor=dan-burns")
    );
    cy.get("#video-panel").get("#video-thumbnail-jd_thomas");
    cy.get("#video-panel").get("#video-thumbnail-mario-pais");
    cy.get("#video-panel").get("#video-thumbnail-dan-burns");

    cy.get("#header").contains(
      "JD Thomas: NPS Student, Lieutenant, AOPS and ASWO"
    );

    cy.get("#video-thumbnail-mario-pais").click();
    cy.get("#header").contains(
      "Mario Pais: Senior Chief, Lead NECC UMS Instructor"
    );

    cy.get("#video-thumbnail-dan-burns").click();
    cy.get("#header").contains("Dan Burns: Captain (Retired), Chief Engineer");
  });
});
